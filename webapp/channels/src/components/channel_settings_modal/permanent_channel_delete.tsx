// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {TrashCanOutlineIcon} from '@mattermost/compass-icons/components';
import {GenericModal} from '@mattermost/components';
import type {Channel} from '@mattermost/types/channels';

import {isCurrentUserSystemAdmin} from 'mattermost-redux/selectors/entities/users';

import {closeModal, openModal} from 'actions/views/modals';
import {permanentlyDeleteChannel} from 'actions/views/permanent_channel_deletion';

import * as Menu from 'components/menu';

import {Constants, ModalIdentifiers} from 'utils/constants';

import ChannelSettingsModal from './channel_settings_modal';

import './permanent_channel_delete.scss';

type Props = {channel: Channel; menuItem?: boolean};

export default function PermanentChannelDelete({channel, menuItem = false}: Props) {
    const dispatch = useDispatch();
    const isAdmin = useSelector(isCurrentUserSystemAdmin);
    if (!isAdmin || channel.name === Constants.DEFAULT_CHANNEL || !['O', 'P'].includes(channel.type)) {
        return null;
    }

    const openConfirmation = () => {
        if (!menuItem) {
            dispatch(closeModal(ModalIdentifiers.CHANNEL_SETTINGS));
        }
        dispatch(openModal({
            modalId: ModalIdentifiers.PERMANENT_DELETE_CHANNEL,
            dialogType: PermanentChannelDeleteModal,
            dialogProps: {channel, returnToSettings: !menuItem},
        }));
    };
    const label = (
        <FormattedMessage
            id='channel_settings.permanent_delete.button'
            defaultMessage='Permanently delete channel'
        />
    );
    if (menuItem) {
        return (
            <Menu.Item
                id='channelPermanentDelete'
                labels={label}
                isDestructive={true}
                leadingElement={<TrashCanOutlineIcon size={18}/>}
                onClick={openConfirmation}
            />
        );
    }
    return (
        <section className='ChannelPermanentDelete'>
            <p>
                <FormattedMessage
                    id='channel_settings.permanent_delete.admin_only'
                    defaultMessage='Only system administrators can permanently delete a channel.'
                />
            </p>
            <button
                type='button'
                className='btn btn-danger'
                onClick={openConfirmation}
                id='channelSettingsPermanentDeleteButton'
            >
                {label}
            </button>
        </section>
    );
}

export function PermanentChannelDeleteModal({channel, returnToSettings = false}: {channel: Channel; returnToSettings?: boolean}) {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const isAdmin = useSelector(isCurrentUserSystemAdmin);
    const [confirmation, setConfirmation] = useState('');
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);
    const inFlight = useRef(false);
    const allowed = isAdmin && channel.name !== Constants.DEFAULT_CHANNEL && ['O', 'P'].includes(channel.type);
    useEffect(() => {
        if (!allowed) {
            dispatch(closeModal(ModalIdentifiers.PERMANENT_DELETE_CHANNEL));
        }
    }, [allowed, dispatch]);
    const close = () => {
        if (!inFlight.current) {
            dispatch(closeModal(ModalIdentifiers.PERMANENT_DELETE_CHANNEL));
            if (returnToSettings) {
                dispatch(openModal({
                    modalId: ModalIdentifiers.CHANNEL_SETTINGS,
                    dialogType: ChannelSettingsModal,
                    dialogProps: {channelId: channel.id, isOpen: true, initialTab: 'archive'},
                }));
            }
        }
    };
    const submit = async () => {
        if (!allowed || confirmation !== channel.display_name || inFlight.current) {
            return;
        }
        inFlight.current = true;
        setPending(true);
        setFailed(false);
        try {
            const result = await dispatch(permanentlyDeleteChannel(channel.id));
            if (result.data) {
                return;
            }
        } catch {
            // Keep the dialog open when the server result is uncertain.
        }
        inFlight.current = false;
        setPending(false);
        setFailed(true);
    };
    if (!allowed) {
        return null;
    }
    return (
        <GenericModal
            id='permanentChannelDeleteModal'
            className='ChannelPermanentDeleteModal'
            modalHeaderText={formatMessage({id: 'channel_settings.permanent_delete.button', defaultMessage: 'Permanently delete channel'})}
            ariaLabel={formatMessage({id: 'channel_settings.permanent_delete.button', defaultMessage: 'Permanently delete channel'})}
            onExited={close}
            preventClose={pending}
            showCloseButton={!pending}
            keyboardEscape={!pending}
            footerContent={
                <>
                    <button
                        type='button'
                        className='btn btn-tertiary'
                        disabled={pending}
                        onClick={close}
                    >
                        <FormattedMessage
                            id='channel_settings.permanent_delete.cancel'
                            defaultMessage='Cancel'
                        />
                    </button>
                    <button
                        type='button'
                        className='btn btn-danger'
                        disabled={pending || confirmation !== channel.display_name}
                        onClick={submit}
                        id='confirmPermanentChannelDelete'
                    >
                        {pending ? (
                            <FormattedMessage
                                id='channel_settings.permanent_delete.pending'
                                defaultMessage='Deleting…'
                            />
                        ) : (
                            <FormattedMessage
                                id='channel_settings.permanent_delete.confirm'
                                defaultMessage='Permanently delete'
                            />
                        )}
                    </button>
                </>
            }
        >
            <p>
                <FormattedMessage
                    id='channel_settings.permanent_delete.warning'
                    defaultMessage='This permanently deletes the channel and its posts. This action cannot be undone.'
                />
            </p>
            <label htmlFor='permanentChannelDeleteName'>
                <FormattedMessage
                    id='channel_settings.permanent_delete.name'
                    defaultMessage='Type “{name}” to confirm.'
                    values={{name: channel.display_name}}
                />
            </label>
            <input
                id='permanentChannelDeleteName'
                className='form-control'
                type='text'
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={pending}
                autoComplete='off'
                autoCapitalize='off'
                spellCheck={false}
            />
            {failed && (
                <p
                    role='alert'
                    className='error'
                >
                    <FormattedMessage
                        id='channel_settings.permanent_delete.error'
                        defaultMessage='Deletion failed or its result could not be confirmed. Reload the channel to check its state before trying again.'
                    />
                </p>
            )}
        </GenericModal>
    );
}
