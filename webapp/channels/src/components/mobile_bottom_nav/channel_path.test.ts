// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TestHelper} from 'utils/test_helper';

import {getMobileChannelPath} from './channel_path';

const currentUserId = 'aaaaaaaaaaaaaaaaaaaaaaaaaa';
const peer = 'bbbbbbbbbbbbbbbbbbbbbbbbbb';
const dm = TestHelper.getChannelMock({type: 'D', name: `${currentUserId}__${peer}`});

it('uses the same DM username path as the core sidebar', () => {
    const profile = TestHelper.getUserMock({id: peer, username: 'peer'});
    expect(getMobileChannelPath(dm, 'work', currentUserId, {[peer]: profile})).toBe('/work/messages/@peer');
});

it('lets the core ID-pair router fetch an unloaded DM profile', () => {
    expect(getMobileChannelPath(dm, 'work', currentUserId, {})).toBe(`/work/channels/${currentUserId}__${peer}`);
});

it('keeps group messages and regular channels on their core paths', () => {
    const group = TestHelper.getChannelMock({type: 'G', name: 'group-id'});
    const channel = TestHelper.getChannelMock({type: 'P', name: 'operations'});
    expect(getMobileChannelPath(group, 'work', currentUserId, {})).toBe('/work/messages/group-id');
    expect(getMobileChannelPath(channel, 'work', currentUserId, {})).toBe('/work/channels/operations');
});
