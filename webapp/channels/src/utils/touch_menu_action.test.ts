// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TouchMenuAction} from './touch_menu_action';

const point = (x = 20, y = 20) => ({identifier: 1, clientX: x, clientY: y});
function ended(touch = point()) {
    const target = document.createElement('button');
    target.getBoundingClientRect = () => ({left: 0, right: 100, top: 0, bottom: 44} as DOMRect);
    return {touches: [], changedTouches: [touch], currentTarget: target, preventDefault: jest.fn(), stopPropagation: jest.fn()};
}

describe('legacy plugin menu touch activation', () => {
    test('executes one tap once and suppresses the later click-through', () => {
        const guard = new TouchMenuAction();
        const action = jest.fn();
        guard.start({touches: [point()]});
        const event = ended();
        guard.end(event, action);
        guard.end(event, action);
        expect(action).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    test('reads native Touch properties even when they are not enumerable', () => {
        const touch = Object.create(null);
        Object.defineProperties(touch, {identifier: {value: 1}, clientX: {value: 20}, clientY: {value: 20}});
        const guard = new TouchMenuAction();
        const action = jest.fn();
        guard.start({touches: [touch]});
        guard.end(ended(touch), action);
        expect(action).toHaveBeenCalledTimes(1);
    });

    test('does not execute after scrolling away and returning', () => {
        const guard = new TouchMenuAction();
        const action = jest.fn();
        guard.start({touches: [point()]});
        guard.move({touches: [point(20, 70)]});
        guard.move({touches: [point()]});
        guard.end(ended(), action);
        expect(action).not.toHaveBeenCalled();
    });

    test('does not execute a long press or a release outside the button', () => {
        let now = 0;
        const clock = () => now;
        const guard = new TouchMenuAction(clock);
        const action = jest.fn();
        guard.start({touches: [point()]});
        now = 1000;
        guard.end(ended(), action);
        guard.start({touches: [point(99)]});
        guard.end(ended(point(105)), action);
        expect(action).not.toHaveBeenCalled();
    });

    test('keeps cancelled and multi-touch gestures inactive', () => {
        const guard = new TouchMenuAction();
        const action = jest.fn();
        guard.start({touches: [point()]});
        guard.cancel();
        guard.end(ended(), action);
        guard.start({touches: [point(), {...point(), identifier: 2}]});
        guard.end(ended(), action);
        expect(action).not.toHaveBeenCalled();
    });
});
