// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {createPortal} from 'react-dom';

import {fireEvent, renderWithContext, screen} from 'tests/react_testing_utils';

import MobileMenuModal from './mobile_menu_modal';

describe('mobile menu dismissal', () => {
    test('exposes a localized close button without selecting an action', () => {
        const onClose = jest.fn();
        const action = jest.fn();
        renderWithContext(
            <MobileMenuModal
                id='mobile-menu'
                onClose={onClose}
            >
                <button onClick={action}>{'Action'}</button>
            </MobileMenuModal>,
            {},
            {locale: 'ja', intlMessages: {'generic.close': '閉じる'}},
        );

        fireEvent.click(screen.getByRole('button', {name: '閉じる'}));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(action).not.toHaveBeenCalled();
    });

    test.each(['.GenericModal__wrapper', '.modal-content', '.modal-dialog'])('consumes a click on transparent %s without clicking through', (selector) => {
        const onClose = jest.fn();
        const backgroundAction = jest.fn();
        renderWithContext(
            <div onClick={backgroundAction}>
                <MobileMenuModal
                    id='mobile-menu'
                    onClose={onClose}
                >
                    <button>{'Action'}</button>
                </MobileMenuModal>
            </div>,
        );

        const event = new MouseEvent('click', {bubbles: true, cancelable: true});
        document.querySelector(selector)!.dispatchEvent(event);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
        expect(backgroundAction).not.toHaveBeenCalled();
    });

    test('leaves action clicks and scrolling to the menu', () => {
        const onClose = jest.fn();
        const action = jest.fn();
        renderWithContext(
            <MobileMenuModal
                id='mobile-menu'
                onClose={onClose}
            >
                <button onClick={action}>{'Action'}</button>
            </MobileMenuModal>,
        );
        fireEvent.scroll(screen.getByRole('button', {name: 'Action'}));
        fireEvent.click(screen.getByRole('button', {name: 'Action'}));
        expect(action).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close the parent for a submenu or another dialog portal', () => {
        const parentClose = jest.fn();
        const childClose = jest.fn();
        renderWithContext(
            <MobileMenuModal
                id='parent-menu'
                onClose={parentClose}
            >
                {createPortal(
                    <MobileMenuModal
                        id='child-menu'
                        onClose={childClose}
                    >
                        <button>{'Submenu action'}</button>
                    </MobileMenuModal>,
                    document.body,
                )}
            </MobileMenuModal>,
        );
        fireEvent.click(document.querySelector('#child-menu .GenericModal__wrapper')!);
        expect(childClose).toHaveBeenCalledTimes(1);
        expect(parentClose).not.toHaveBeenCalled();
    });

    test('removes the outside listener when unmounted', () => {
        const onClose = jest.fn();
        const {unmount} = renderWithContext(
            <MobileMenuModal
                id='mobile-menu'
                onClose={onClose}
            >
                <button>{'Action'}</button>
            </MobileMenuModal>,
        );
        unmount();
        const replacement = document.createElement('div');
        replacement.id = 'mobile-menu';
        document.body.appendChild(replacement);
        fireEvent.click(replacement);
        expect(onClose).not.toHaveBeenCalled();
        replacement.remove();
    });
});
