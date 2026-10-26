// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {permanentlyDeleteChannel} from 'actions/views/permanent_channel_deletion';

import {act, fireEvent, renderWithContext, screen, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import PermanentChannelDelete, {PermanentChannelDeleteModal} from './permanent_channel_delete';

jest.mock('actions/views/permanent_channel_deletion', () => ({permanentlyDeleteChannel: jest.fn()}));

const channel = TestHelper.getChannelMock({id: 'aaaaaaaaaaaaaaaaaaaaaaaaaa', team_id: 'team', name: 'delete-test', display_name: '削除試験', type: 'P'});
function state(roles = 'system_user system_admin') {
    const user = TestHelper.getUserMock({id: 'actor', roles});
    return {entities: {users: {currentUserId: user.id, profiles: {[user.id]: user}}}};
}

beforeEach(() => jest.clearAllMocks());

test.each(['system_user', 'system_user team_admin', 'system_user channel_admin'])('hides permanent deletion from %s', (roles) => {
    renderWithContext(<PermanentChannelDelete channel={channel}/>, state(roles));
    expect(screen.queryByText('Permanently delete channel')).not.toBeInTheDocument();
});

test.each(['town-square', 'direct'])('protects a default channel or direct conversation: %s', (name) => {
    const target = {...channel, name, type: name === 'direct' ? 'D' as const : 'O' as const};
    renderWithContext(<PermanentChannelDelete channel={target}/>, state());
    expect(screen.queryByText('Permanently delete channel')).not.toBeInTheDocument();
});

test('shows the action to system admins and accepts an archived channel', () => {
    renderWithContext(<PermanentChannelDelete channel={{...channel, delete_at: 10}}/>, state());
    expect(screen.getByRole('button', {name: 'Permanently delete channel'})).toBeVisible();
});

test('requires the exact channel name and suppresses duplicate submissions', async () => {
    let resolve: (result: {data: boolean}) => void;
    const pending = new Promise<{data: boolean}>((done) => {
        resolve = done;
    });
    jest.mocked(permanentlyDeleteChannel).mockReturnValue(() => pending);
    renderWithContext(<PermanentChannelDeleteModal channel={channel}/>, state());
    const confirm = screen.getByRole('button', {name: 'Permanently delete'});
    const input = screen.getByLabelText('Type “削除試験” to confirm.');
    expect(confirm).toBeDisabled();
    fireEvent.change(input, {target: {value: '削除試験 '}});
    expect(confirm).toBeDisabled();
    fireEvent.change(input, {target: {value: '削除試験'}});
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(permanentlyDeleteChannel).toHaveBeenCalledTimes(1);
    expect(input).toBeDisabled();
    await act(async () => resolve({data: false}));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be confirmed');
    expect(confirm).toBeEnabled();
});

test('cancel never submits a deletion', () => {
    const {store} = renderWithContext(<PermanentChannelDeleteModal channel={channel}/>, state());
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(permanentlyDeleteChannel).not.toHaveBeenCalled();
    expect(store.getState().views.modals.modalState.permanent_delete_channel?.open).not.toBe(true);
});

test('a failed response keeps confirmation open for review', async () => {
    jest.mocked(permanentlyDeleteChannel).mockReturnValue(async () => ({data: false}));
    renderWithContext(<PermanentChannelDeleteModal channel={channel}/>, state());
    fireEvent.change(screen.getByLabelText('Type “削除試験” to confirm.'), {target: {value: '削除試験'}});
    fireEvent.click(screen.getByRole('button', {name: 'Permanently delete'}));
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());
    expect(screen.getByRole('dialog')).toBeVisible();
});

test('losing the system admin role closes the confirmation without submitting', () => {
    const {updateStoreState} = renderWithContext(<PermanentChannelDeleteModal channel={channel}/>, state());
    expect(screen.getByRole('dialog')).toBeVisible();
    updateStoreState(state('system_user'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(permanentlyDeleteChannel).not.toHaveBeenCalled();
});
