// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import {getUserIdFromChannelName} from 'mattermost-redux/utils/channel_utils';

export function getMobileChannelPath(channel: Channel, teamName: string, currentUserId: string, users: Record<string, UserProfile>) {
    if (channel.type === 'D') {
        const user = users[getUserIdFromChannelName(currentUserId, channel.name)];
        if (user?.username) {
            return `/${teamName}/messages/@${user.username}`;
        }

        // The core /channels router resolves an ID pair and fetches its user;
        // /messages accepts usernames, user IDs or group IDs, never an ID pair.
        return `/${teamName}/channels/${channel.name}`;
    }
    return `/${teamName}/${channel.type === 'G' ? 'messages' : 'channels'}/${channel.name}`;
}
