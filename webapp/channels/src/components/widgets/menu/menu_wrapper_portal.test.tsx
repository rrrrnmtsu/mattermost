// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fireEvent, render, screen} from 'tests/react_testing_utils';

import Menu from './menu';
import MenuWrapper from './menu_wrapper';

jest.mock('./is_mobile_view_hack', () => ({isMobile: () => true}));

function popup(onToggle: (open: boolean) => void = jest.fn(), action: () => void = jest.fn(), portalOnMobile = true) {
    return render(
        <MenuWrapper
            open={true}
            onToggle={onToggle}
            portalOnMobile={portalOnMobile}
        >
            <button>{'Open'}</button>
            <Menu ariaLabel='Post actions'>
                <Menu.ItemAction
                    text='Add task'
                    onClick={action}
                />
            </Menu>
        </MenuWrapper>,
    );
}

test('places the opted-in mobile popup outside the virtualized post ancestry', () => {
    const {container} = popup();
    const host = document.querySelector('.mmwp-post-menu-portal');
    expect(host?.parentElement).toBe(document.body);
    expect(container.querySelector('.Menu')).toBeNull();
    expect(screen.getByRole('menu')).toBeInTheDocument();
});

test('portal actions run before the wrapper closes and outside clicks close it', () => {
    const order: string[] = [];
    const onToggle = jest.fn(() => order.push('toggle'));
    popup(onToggle, () => order.push('action'));
    fireEvent.click(screen.getByRole('button', {name: 'Add task'}));
    expect(order[0]).toBe('action');
    expect(onToggle).toHaveBeenCalledWith(false);
    onToggle.mockClear();
    fireEvent.click(document.body);
    expect(onToggle).toHaveBeenCalledWith(false);
});

test('leaves other mobile menus in their existing position', () => {
    const {container} = popup(undefined, undefined, false);
    expect(document.querySelector('.mmwp-post-menu-portal')).toBeNull();
    expect(container.querySelector('.Menu')).toBeInTheDocument();
});
