// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import React from 'react';

import {renderWithContext, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import MobileBottomNavView from './mobile_bottom_nav';
import type {Props} from './mobile_bottom_nav';

function makeProps(): Props {
    return {
        currentChannelId: 'current',
        teamName: 'work',
        channelPaths: {dm: '/work/messages/@peer', unread: '/work/channels/operations'},
        directChannels: [TestHelper.getChannelMock({id: 'dm', name: 'user1__user2', type: 'D', display_name: 'Managed peer'})],
        unreadChannels: [TestHelper.getChannelMock({id: 'unread', name: 'operations', type: 'P', display_name: 'Operations'})],
        hidden: false,
        lhsOpen: false,
        pushSettingsHref: '/plugins/com.sakura.mattermost-webpush/setup',
        onChat: jest.fn(),
        onOpenPanel: jest.fn(),
        onChannelSelected: jest.fn(),
        onNewDirectMessage: jest.fn(),
        onMentions: jest.fn(),
        onAccountSettings: jest.fn(),
        onSecuritySettings: jest.fn(),
    };
}

describe('mobile navigation', () => {
    it('opens the conversation list on the first touch without a tooltip', async () => {
        const props = makeProps();
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.pointer({keys: '[TouchA]', target: screen.getByRole('button', {name: 'Chats'})});
        expect(props.onChat).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('opens an existing DM with one further native link click', async () => {
        const props = makeProps();
        const history = createMemoryHistory({initialEntries: ['/work/channels/operations']});
        renderWithContext(<MobileBottomNavView {...props}/>, {}, {history});
        await userEvent.click(screen.getByRole('button', {name: 'DMs'}));
        await userEvent.click(screen.getByRole('link', {name: 'Managed peer'}));
        expect(history.location.pathname).toBe('/work/messages/@peer');
        expect(props.onChannelSelected).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('never exposes raw DM or group identifiers when profiles are not ready', async () => {
        const props = makeProps();
        props.directChannels = [
            TestHelper.getChannelMock({id: 'dm', name: 'user1__user2', type: 'D', display_name: ''}),
            TestHelper.getChannelMock({id: 'group', name: 'opaque-group-identifier', type: 'G', display_name: ''}),
        ];
        props.channelPaths.group = '/work/messages/opaque-group-identifier';
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'DMs'}));
        expect(screen.getAllByRole('link', {name: 'Direct messages'})).toHaveLength(2);
        expect(screen.queryByText('user1__user2')).not.toBeInTheDocument();
        expect(screen.queryByText('opaque-group-identifier')).not.toBeInTheDocument();
    });

    it('keeps actual unread conversations separate from mention history', async () => {
        const props = makeProps();
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Unread'}));
        expect(screen.getByRole('link', {name: 'Operations'})).toHaveAttribute('href', '/work/channels/operations');
        expect(screen.queryByRole('link', {name: 'Managed peer'})).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', {name: 'Mentions of me'}));
        expect(props.onMentions).toHaveBeenCalledTimes(1);
    });

    it('shows the empty unread state without pretending mentions are unread', async () => {
        const props = {...makeProps(), unreadChannels: []};
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Unread'}));
        expect(screen.getByText('No unread conversations')).toBeInTheDocument();
        expect(screen.queryByRole('link', {name: 'Operations'})).not.toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Mentions of me'})).toBeInTheDocument();
    });

    it('provides account settings and the separate push setup link', async () => {
        const props = makeProps();
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Settings'}));
        expect(screen.getByRole('link', {name: 'Set up phone notifications'})).toHaveAttribute('href', props.pushSettingsHref);
        await userEvent.click(screen.getByRole('button', {name: 'Notification and display settings'}));
        expect(props.onAccountSettings).toHaveBeenCalledTimes(1);
    });

    it('opens profile and MFA settings separately from product preferences', async () => {
        const props = makeProps();
        renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Settings'}));
        await userEvent.click(screen.getByRole('button', {name: 'Profile and security'}));
        expect(props.onSecuritySettings).toHaveBeenCalledTimes(1);
        expect(props.onAccountSettings).not.toHaveBeenCalled();
    });

    it('closes a panel with Escape and returns focus without scrolling', async () => {
        renderWithContext(<MobileBottomNavView {...makeProps()}/>);
        const dms = screen.getByRole('button', {name: 'DMs'});
        await userEvent.click(dms);
        expect(screen.getByRole('heading', {name: 'Direct messages'})).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(dms).toHaveFocus();
    });

    it('does not leave an actionable panel under a keyboard or modal', async () => {
        const props = makeProps();
        const view = renderWithContext(<MobileBottomNavView {...props}/>);
        await userEvent.click(screen.getByRole('button', {name: 'DMs'}));
        view.rerender(
            <MobileBottomNavView
                {...props}
                hidden={true}
            />,
        );
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
