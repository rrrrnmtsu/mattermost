// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelTypes} from 'mattermost-redux/action_types';
import {Client4} from 'mattermost-redux/client';
import {getChannel} from 'mattermost-redux/selectors/entities/channels';
import {getRelativeTeamUrl} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId, isCurrentUserSystemAdmin} from 'mattermost-redux/selectors/entities/users';

import {closeModal} from 'actions/views/modals';
import {closeRightHandSide} from 'actions/views/rhs';

import {getHistory} from 'utils/browser_history';
import {Constants, ModalIdentifiers} from 'utils/constants';

import type {ActionFuncAsync} from 'types/store';

export function permanentlyDeleteChannel(channelId: string): ActionFuncAsync<boolean> {
    return async (dispatch, getState) => {
        const state = getState();
        const channel = getChannel(state, channelId);
        if (!isCurrentUserSystemAdmin(state) || !channel || channel.name === Constants.DEFAULT_CHANNEL || !['O', 'P'].includes(channel.type)) {
            return {data: false};
        }

        try {
            await Client4.permanentlyDeleteChannel(channel.id);
        } catch {
            // A lost response is not proof that deletion failed or succeeded.
            return {data: false};
        }

        dispatch(closeModal(ModalIdentifiers.CHANNEL_SETTINGS));
        dispatch(closeModal(ModalIdentifiers.PERMANENT_DELETE_CHANNEL));
        dispatch(closeRightHandSide());
        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: {id: channel.id, team_id: channel.team_id, user_id: getCurrentUserId(state), type: channel.type},
        });
        getHistory().replace(`${getRelativeTeamUrl(state, channel.team_id)}/channels/${Constants.DEFAULT_CHANNEL}`);
        return {data: true};
    };
}
