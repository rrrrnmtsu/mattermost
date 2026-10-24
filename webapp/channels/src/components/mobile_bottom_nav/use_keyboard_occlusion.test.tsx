// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, renderHook} from '@testing-library/react';

import {useKeyboardOcclusion} from './use_keyboard_occlusion';

const originalViewport = window.visualViewport;
const originalHeight = window.innerHeight;
const originalWidth = window.innerWidth;
let viewport: EventTarget & {height: number};

beforeEach(() => {
    viewport = Object.assign(new EventTarget(), {height: 740});
    Object.defineProperty(window, 'visualViewport', {configurable: true, value: viewport});
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 740});
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 393});
});

afterEach(() => {
    Object.defineProperty(window, 'visualViewport', {configurable: true, value: originalViewport});
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: originalHeight});
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: originalWidth});
});

it('remains hidden through focus changes until the keyboard viewport recovers', () => {
    const {result} = renderHook(useKeyboardOcclusion);
    expect(result.current).toBe(false);
    act(() => {
        viewport.height = 400;
        viewport.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(true);
    act(() => document.dispatchEvent(new FocusEvent('focusout')));
    expect(result.current).toBe(true);
    act(() => {
        viewport.height = 740;
        viewport.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(false);
});

it('treats a landscape rotation as a new layout baseline', () => {
    const {result} = renderHook(useKeyboardOcclusion);
    act(() => {
        Object.defineProperty(window, 'innerWidth', {configurable: true, value: 852});
        Object.defineProperty(window, 'innerHeight', {configurable: true, value: 393});
        viewport.height = 393;
        window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(false);
});

it('starts hidden when mounted above an already open keyboard', () => {
    viewport.height = 400;
    const {result} = renderHook(useKeyboardOcclusion);
    expect(result.current).toBe(true);
});
