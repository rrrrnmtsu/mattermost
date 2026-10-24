// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act} from '@testing-library/react';
import React from 'react';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

import WithTooltip from './index';

jest.mock('utils/user_agent', () => ({
    isMac: jest.fn().mockReturnValue(false),
}));

describe('WithTooltip', () => {
    afterEach(() => {
        document.documentElement.classList.remove('mmwp-fixed-viewport');
        jest.useRealTimers();
    });
    test('renders children correctly', async () => {
        renderWithContext(
            <WithTooltip title='TooltipOfButton'>
                <button>{'I am a button surrounded by a tooltip'}</button>
            </WithTooltip>,
        );

        expect(screen.getByText('I am a button surrounded by a tooltip')).toBeInTheDocument();
    });

    test('shows tooltip on hover', async () => {
        jest.useFakeTimers();

        renderWithContext(
            <WithTooltip title='Tooltip will appear on hover'>
                <div>{'Hover Me'}</div>
            </WithTooltip>,
        );

        await userEvent.hover(screen.getByText('Hover Me'), {advanceTimers: jest.advanceTimersByTime});

        await waitFor(() => {
            expect(screen.getByText('Tooltip will appear on hover')).toBeInTheDocument();
        });
    });

    test('shows tooltip on focus', async () => {
        jest.useFakeTimers();

        renderWithContext(
            <WithTooltip title='Tooltip will appear on hover'>
                <button>{'Hover Me'}</button>
            </WithTooltip>,
        );

        const trigger = screen.getByText('Hover Me');

        // Clicking the button will simulate a focus event
        await userEvent.click(trigger, {advanceTimers: jest.advanceTimersByTime});

        await waitFor(() => {
            expect(trigger).toHaveFocus();
            expect(screen.getByText('Tooltip will appear on hover')).toBeInTheDocument();
        });
    });

    test('mobile touch invokes the action once without showing a caption', async () => {
        jest.useFakeTimers();
        document.documentElement.classList.add('mmwp-fixed-viewport');
        const action = jest.fn();
        const onOpen = jest.fn();
        renderWithContext(
            <WithTooltip
                title='Send caption'
                onOpen={onOpen}
            >
                <button
                    aria-label='Send message'
                    onClick={action}
                >{'Send'}</button>
            </WithTooltip>,
        );
        const trigger = screen.getByRole('button', {name: 'Send message'});
        await userEvent.pointer([
            {keys: '[TouchA>]', target: trigger},
            {keys: '[/TouchA]', target: trigger},
        ], {advanceTimers: jest.advanceTimersByTime});
        await act(async () => jest.advanceTimersByTime(2000));
        expect(action).toHaveBeenCalledTimes(1);
        expect(onOpen).not.toHaveBeenCalled();
        expect(screen.queryByText('Send caption')).not.toBeInTheDocument();
        expect(trigger).toHaveAccessibleName('Send message');
    });

    test('mobile synthesized hover and focus do not attach tooltip interactions', async () => {
        jest.useFakeTimers();
        document.documentElement.classList.add('mmwp-fixed-viewport');
        const action = jest.fn();
        renderWithContext(
            <WithTooltip title='Hover caption'>
                <button onClick={action}>{'Mobile action'}</button>
            </WithTooltip>,
        );
        const trigger = screen.getByRole('button', {name: 'Mobile action'});
        await userEvent.hover(trigger, {advanceTimers: jest.advanceTimersByTime});
        await userEvent.click(trigger, {advanceTimers: jest.advanceTimersByTime});
        await act(async () => jest.advanceTimersByTime(2000));
        expect(action).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Hover caption')).not.toBeInTheDocument();
        expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    test('calls onOpen when tooltip appears', async () => {
        const onOpen = jest.fn();

        jest.useFakeTimers();

        renderWithContext(
            <WithTooltip
                title='Tooltip will appear on hover'
                onOpen={onOpen}
            >
                <div>{'Hover Me'}</div>
            </WithTooltip>,
        );

        expect(onOpen).not.toHaveBeenCalled();

        await userEvent.hover(screen.getByText('Hover Me'), {advanceTimers: jest.advanceTimersByTime});

        await waitFor(() => {
            expect(screen.getByText('Tooltip will appear on hover')).toBeInTheDocument();
            expect(onOpen).toHaveBeenCalled();
        });
    });
});
