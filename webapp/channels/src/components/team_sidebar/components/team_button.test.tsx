// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react';
import React from 'react';

import {renderWithContext, userEvent} from 'tests/react_testing_utils';

import TeamButton from './team_button';

describe('components/TeamSidebar/TeamButton', () => {
    const baseProps = {
        btnClass: '',
        url: '',
        displayName: '',
        tip: '',
        order: 0,
        showOrder: false,
        active: false,
        disabled: false,
        unread: false,
        mentions: 0,
        teamIconUrl: null,
        switchTeam: () => {},
        isDraggable: false,
        teamIndex: 0,
        teamId: '',
        isInProduct: false,
    };

    it('should show unread badge and set class when unread in channels', () => {
        const props = {
            ...baseProps,
            active: false,
            unread: true,
        };

        renderWithContext(
            <TeamButton {...props}/>,
        );

        expect(screen.queryByTestId('team-badge-')).toBeInTheDocument();
        expect(screen.getByTestId('team-container-')).toHaveClass('unread');
    });

    it('should hide unread badge and set no class when unread in a product', () => {
        const props = {
            ...baseProps,
            active: false,
            unread: true,
            isInProduct: true,
        };

        renderWithContext(
            <TeamButton {...props}/>,
        );

        expect(screen.queryByTestId('team-badge-')).not.toBeInTheDocument();
        expect(screen.getByTestId('team-container-')).not.toHaveClass('unread');
    });

    it('should show mentions badge and set class when mentions in channels', () => {
        const props = {
            ...baseProps,
            active: false,
            unread: true,
            mentions: 1,
        };

        renderWithContext(
            <TeamButton {...props}/>,
        );

        expect(screen.queryByTestId('team-badge-')).toHaveClass('badge-max-number');
        expect(screen.getByTestId('team-container-')).toHaveClass('unread');
    });

    it('should hide mentions badge and set no class when mentions in product', () => {
        const props = {
            ...baseProps,
            active: false,
            unread: true,
            mentions: 1,
            isInProduct: true,
        };

        renderWithContext(
            <TeamButton {...props}/>,
        );

        expect(screen.queryByTestId('team-badge-')).not.toBeInTheDocument();
        expect(screen.getByTestId('team-container-')).not.toHaveClass('unread');
    });

    it('switches team once from a single mobile touch on the nested icon', async () => {
        document.documentElement.classList.add('mmwp-fixed-viewport');
        const switchTeam = jest.fn();
        try {
            renderWithContext(
                <TeamButton
                    {...baseProps}
                    url='/second-team'
                    displayName='Second Team'
                    tip='Team caption'
                    switchTeam={switchTeam}
                />,
            );
            const link = screen.getByRole('link', {name: 'second team team'});
            const icon = link.querySelector('.team-btn')!;
            await userEvent.pointer([
                {keys: '[TouchA>]', target: icon},
                {keys: '[/TouchA]', target: icon},
            ]);
            expect(switchTeam).toHaveBeenCalledTimes(1);
            expect(switchTeam).toHaveBeenCalledWith('/second-team');
            expect(screen.queryByText('Team caption')).not.toBeInTheDocument();
            expect(link).toHaveAccessibleName('second team team');
        } finally {
            document.documentElement.classList.remove('mmwp-fixed-viewport');
        }
    });

    describe('aria-label accessibility', () => {
        it('should use displayName as aria-label for create team button', () => {
            const props = {
                ...baseProps,
                url: '/create_team',
                displayName: 'Create a Team',
            };

            renderWithContext(
                <TeamButton {...props}/>,
            );

            expect(screen.getByRole('link')).toHaveAccessibleName('Create a Team');
        });

        it('should use displayName as aria-label for join team button', () => {
            const props = {
                ...baseProps,
                url: '/select_team',
                displayName: 'Other teams you can join',
            };

            renderWithContext(
                <TeamButton {...props}/>,
            );

            expect(screen.getByRole('link')).toHaveAccessibleName('Other teams you can join');
        });

        it('should use team name with "team" for regular team buttons', () => {
            const props = {
                ...baseProps,
                url: '/team1',
                displayName: 'My Team',
            };

            renderWithContext(
                <TeamButton {...props}/>,
            );

            expect(screen.getByRole('link')).toHaveAccessibleName('my team team');
        });

        it('should use "team unread" aria-label for unread team buttons, not create/join buttons', () => {
            const props = {
                ...baseProps,
                url: '/team1',
                displayName: 'My Team',
                unread: true,
            };

            renderWithContext(
                <TeamButton {...props}/>,
            );

            expect(screen.getByRole('link')).toHaveAccessibleName('my team team unread');
        });

        it('should use "team mentions" aria-label for team buttons with mentions', () => {
            const props = {
                ...baseProps,
                url: '/team1',
                displayName: 'My Team',
                mentions: 5,
            };

            renderWithContext(
                <TeamButton {...props}/>,
            );

            expect(screen.getByRole('link')).toHaveAccessibleName('my team team, 5 mentions');
        });
    });
});
