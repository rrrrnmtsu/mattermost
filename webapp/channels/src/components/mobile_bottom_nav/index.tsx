// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {lazy, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {basicUnreadMeta, getCurrentChannelId, getDirectAndGroupChannels, getMyChannelMemberships, getUnreadChannels, getUnreadStatusInCurrentTeam} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getCurrentTeam, getMyTeams} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId, getUsers} from 'mattermost-redux/selectors/entities/users';

import {clearChannelSelection, setUnreadFilterEnabled} from 'actions/views/channel_sidebar';
import {close as closeLhs, open as openLhs} from 'actions/views/lhs';
import {openModal} from 'actions/views/modals';
import {closeMenu, closeRightHandSide, showMentions} from 'actions/views/rhs';
import {getIsLhsOpen} from 'selectors/lhs';
import {getIsRhsMenuOpen} from 'selectors/rhs';
import {getIsMobileView} from 'selectors/views/browser';
import {getChannelsByCategoryForCurrentTeam} from 'selectors/views/channel_sidebar';
import {isAnyModalOpen} from 'selectors/views/modals';

import {makeAsyncComponent} from 'components/async_load';

import {ModalIdentifiers} from 'utils/constants';

import {getMobileChannelPath} from './channel_path';
import MobileBottomNavView from './mobile_bottom_nav';
import {useKeyboardOcclusion} from './use_keyboard_occlusion';

const MoreDirectChannels = makeAsyncComponent('MobileNavDirectChannels', lazy(() => import('components/more_direct_channels')));
const UserSettingsModal = makeAsyncComponent('MobileNavUserSettings', lazy(() => import('components/user_settings/modal')));

export default function MobileBottomNav() {
    const dispatch = useDispatch();
    const isMobileView = useSelector(getIsMobileView);
    const team = useSelector(getCurrentTeam);
    const teams = useSelector(getMyTeams);
    const channels = useSelector(getDirectAndGroupChannels);
    const sidebarChannels = useSelector(getChannelsByCategoryForCurrentTeam);
    const currentUserId = useSelector(getCurrentUserId);
    const users = useSelector(getUsers);
    const members = useSelector(getMyChannelMemberships);
    const unreads = useSelector(getUnreadChannels);
    const unreadStatus = useSelector(getUnreadStatusInCurrentTeam);
    const unreadMeta = basicUnreadMeta(unreadStatus);
    const currentChannelId = useSelector(getCurrentChannelId);
    const modalOpen = useSelector(isAnyModalOpen);
    const lhsOpen = useSelector(getIsLhsOpen);
    const rhsMenuOpen = useSelector(getIsRhsMenuOpen);
    const config = useSelector(getConfig);
    const keyboardOccluded = useKeyboardOcclusion();
    const [showDirectPicker, setShowDirectPicker] = useState(false);
    const directChannels = useMemo(() => {
        const visibleIds = new Set(Object.values(sidebarChannels).flat().map((channel) => channel.id));
        return channels.filter((channel) => visibleIds.has(channel.id) && members[channel.id] && !channel.delete_at).
            sort((a, b) => b.last_post_at - a.last_post_at);
    }, [channels, members, sidebarChannels]);

    useEffect(() => {
        if (!isMobileView) {
            return undefined;
        }
        document.body.classList.add('mmwp-mobile-nav');
        document.body.classList.toggle('mmwp-mobile-single-team', teams.length === 1);
        return () => {
            document.body.classList.remove('mmwp-mobile-nav', 'mmwp-mobile-single-team');
        };
    }, [isMobileView, teams.length]);

    if (!isMobileView || !team) {
        return null;
    }

    function closeSidebars() {
        dispatch(closeLhs());
        dispatch(closeMenu());
        dispatch(closeRightHandSide());
    }

    function showSettings(isContentProductSettings: boolean) {
        closeSidebars();
        dispatch(openModal({
            modalId: ModalIdentifiers.USER_SETTINGS,
            dialogType: UserSettingsModal,
            dialogProps: {isContentProductSettings, focusOriginElement: 'mmwp-mobile-settings'},
        }));
    }

    const channelPaths = Object.fromEntries([...directChannels, ...unreads].map((channel) => [channel.id, getMobileChannelPath(channel, team.name, currentUserId, users)]));

    return (
        <>
            <MobileBottomNavView
                currentChannelId={currentChannelId}
                teamName={team.name}
                directChannels={directChannels}
                channelPaths={channelPaths}
                unreadCount={unreads.length}
                mentionCount={unreadMeta.unreadMentionCount}
                hidden={keyboardOccluded || modalOpen || rhsMenuOpen}
                lhsOpen={lhsOpen}
                pushSettingsHref={(config.SiteURL || '').replace(/\/$/, '') + '/plugins/com.sakura.mattermost-webpush/setup'}
                onChat={() => {
                    dispatch(setUnreadFilterEnabled(false));
                    dispatch(closeMenu());
                    dispatch(closeRightHandSide());
                    dispatch(openLhs());
                }}
                onOpenPanel={closeSidebars}
                onChannelSelected={() => {
                    closeSidebars();
                    dispatch(clearChannelSelection());
                }}
                onNewDirectMessage={() => {
                    closeSidebars();
                    setShowDirectPicker(true);
                }}
                onMentions={() => {
                    closeSidebars();
                    dispatch(showMentions());
                }}
                onAccountSettings={() => showSettings(true)}
                onSecuritySettings={() => showSettings(false)}
            />
            {showDirectPicker && (
                <MoreDirectChannels
                    isExistingChannel={false}
                    onModalDismissed={() => setShowDirectPicker(false)}
                    focusOriginElement='mmwp-mobile-dms'
                />
            )}
        </>
    );
}
