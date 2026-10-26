// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Client4} from 'mattermost-redux/client';

import {renderWithContext} from 'tests/react_testing_utils';
import {getHistory} from 'utils/browser_history';
import {TestHelper} from 'utils/test_helper';

import {permanentlyDeleteChannel} from './permanent_channel_deletion';

jest.mock('utils/browser_history', () => ({getHistory: jest.fn(() => ({replace: jest.fn()}))}));
const channel = TestHelper.getChannelMock({id: 'aaaaaaaaaaaaaaaaaaaaaaaaaa', team_id: 'team', name: 'delete-test', type: 'P'});
function setup(roles = 'system_user system_admin', name = channel.name) {
    const user = TestHelper.getUserMock({id: 'actor', roles});
    return renderWithContext(<span/>, {entities: {
        users: {currentUserId: user.id, profiles: {[user.id]: user}},
        teams: {teams: {team: TestHelper.getTeamMock({id: 'team', name: 'qa-private'})}},
        channels: {channels: {[channel.id]: {...channel, name}}},
    }}).store;
}

beforeEach(() => jest.clearAllMocks());

test.each(['system_user', 'system_user team_admin', 'system_user channel_admin'])('does not send a request as %s', async (roles) => {
    const fetch = jest.spyOn(Client4, 'permanentlyDeleteChannel');
    const store = setup(roles);
    expect(await store.dispatch(permanentlyDeleteChannel(channel.id))).toEqual({data: false});
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
});

test('does not send a request for Town Square', async () => {
    const fetch = jest.spyOn(Client4, 'permanentlyDeleteChannel');
    const store = setup(undefined, 'town-square');
    expect(await store.dispatch(permanentlyDeleteChannel(channel.id))).toEqual({data: false});
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
});

test('server rejection does not remove a channel or navigate', async () => {
    const fetch = jest.spyOn(Client4, 'permanentlyDeleteChannel').mockRejectedValue(new Error('403'));
    const store = setup();
    expect(await store.dispatch(permanentlyDeleteChannel(channel.id))).toEqual({data: false});
    expect(store.getState().entities.channels.channels[channel.id]).toBeDefined();
    expect(getHistory).not.toHaveBeenCalled();
    fetch.mockRestore();
});

test('uses the permanent endpoint once and removes cached channel only after success', async () => {
    const replace = jest.fn();
    jest.mocked(getHistory).mockReturnValue({replace} as unknown as ReturnType<typeof getHistory>);
    const fetch = jest.spyOn(Client4, 'permanentlyDeleteChannel').mockResolvedValue({status: 'OK'});
    const store = setup();
    expect(await store.dispatch(permanentlyDeleteChannel(channel.id))).toEqual({data: true});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(channel.id);
    expect(store.getState().entities.channels.channels[channel.id]).toBeUndefined();
    expect(replace).toHaveBeenCalledWith('/qa-private/channels/town-square');
    fetch.mockRestore();
});
