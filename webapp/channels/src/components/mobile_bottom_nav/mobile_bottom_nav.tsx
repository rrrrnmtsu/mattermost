// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {Link} from 'react-router-dom';

import type {Channel} from '@mattermost/types/channels';

import './mobile_bottom_nav.scss';

type Panel = 'dms' | 'unread' | 'settings' | null;

export type Props = {
    currentChannelId: string;
    teamName: string;
    directChannels: Channel[];
    channelPaths: Record<string, string>;
    unreadChannels: Channel[];
    hidden: boolean;
    lhsOpen: boolean;
    pushSettingsHref: string;
    onChat: () => void;
    onOpenPanel: () => void;
    onChannelSelected: () => void;
    onNewDirectMessage: () => void;
    onMentions: () => void;
    onAccountSettings: () => void;
    onSecuritySettings: () => void;
};

const icons = {dms: 'icon-account-multiple-outline', unread: 'icon-bell-outline', settings: 'icon-cog-outline'};

const messages = {
    chat: {id: 'mmwp.mobileNav.chat', defaultMessage: 'Chats'},
    dms: {id: 'mmwp.mobileNav.dms', defaultMessage: 'DMs'},
    unread: {id: 'mmwp.mobileNav.unread', defaultMessage: 'Unread'},
    settings: {id: 'mmwp.mobileNav.settings', defaultMessage: 'Settings'},
    dmsTitle: {id: 'mmwp.mobileNav.dmsTitle', defaultMessage: 'Direct messages'},
    unreadTitle: {id: 'mmwp.mobileNav.unreadTitle', defaultMessage: 'Unread conversations'},
    settingsTitle: {id: 'mmwp.mobileNav.settingsTitle', defaultMessage: 'Settings'},
};

export default function MobileBottomNavView(props: Props) {
    const intl = useIntl();
    const [panel, setPanel] = useState<Panel>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPanel(null);
    }, [props.currentChannelId, props.teamName]);

    useEffect(() => {
        if (panel) {
            headingRef.current?.focus({preventScroll: true});
        }
    }, [panel]);

    useEffect(() => {
        if (!panel || props.hidden) {
            return undefined;
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.stopPropagation();
                setPanel(null);
                navRef.current?.querySelector<HTMLButtonElement>(`[data-panel="${panel}"]`)?.focus({preventScroll: true});
            }
        }
        function handleOutsidePointer(event: PointerEvent) {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setPanel(null);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('pointerdown', handleOutsidePointer);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('pointerdown', handleOutsidePointer);
        };
    }, [panel, props.hidden]);

    function closePanel() {
        const button = navRef.current?.querySelector<HTMLButtonElement>(`[data-panel="${panel}"]`);
        setPanel(null);
        button?.focus({preventScroll: true});
    }

    function togglePanel(next: Exclude<Panel, null>) {
        props.onOpenPanel();
        setPanel((current) => (current === next ? null : next));
    }

    function channelList(channels: Channel[]) {
        return (
            <ul className='mmwp-MobileNav__conversations'>
                {channels.map((channel) => (
                    <li key={channel.id}>
                        <Link
                            to={props.channelPaths[channel.id]}
                            onClick={() => {
                                props.onChannelSelected();
                                setPanel(null);
                            }}
                        >
                            <i
                                className={`icon ${channel.type === 'D' || channel.type === 'G' ? 'icon-message-outline' : 'icon-pound'}`}
                                aria-hidden='true'
                            />
                            <span>{channel.display_name || (channel.type === 'D' || channel.type === 'G' ? intl.formatMessage(messages.dmsTitle) : channel.name)}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div
            className='mmwp-MobileNav'
            hidden={props.hidden}
            data-testid='mmwp-mobile-nav'
            ref={containerRef}
        >
            {panel && !props.hidden && (
                <section
                    className='mmwp-MobileNav__panel'
                    role='dialog'
                    aria-labelledby='mmwp-mobile-panel-heading'
                >
                    <div className='mmwp-MobileNav__panelHeader'>
                        <h2
                            id='mmwp-mobile-panel-heading'
                            tabIndex={-1}
                            ref={headingRef}
                        >
                            {intl.formatMessage(messages[`${panel}Title`])}
                        </h2>
                        <button
                            type='button'
                            aria-label={intl.formatMessage({id: 'mmwp.mobileNav.close', defaultMessage: 'Close'})}
                            onClick={closePanel}
                        >
                            <i
                                className='icon icon-close'
                                aria-hidden='true'
                            />
                        </button>
                    </div>
                    {panel === 'dms' && (
                        <>
                            <button
                                className='mmwp-MobileNav__action'
                                type='button'
                                onClick={() => {
                                    setPanel(null);
                                    props.onNewDirectMessage();
                                }}
                            >
                                <FormattedMessage
                                    id='mmwp.mobileNav.newDM'
                                    defaultMessage='New direct message'
                                />
                            </button>
                            {props.directChannels.length ? channelList(props.directChannels) : (
                                <p className='mmwp-MobileNav__empty'>
                                    <FormattedMessage
                                        id='mmwp.mobileNav.noDMs'
                                        defaultMessage='No direct messages yet'
                                    />
                                </p>
                            )}
                        </>
                    )}
                    {panel === 'unread' && (
                        <>
                            <button
                                className='mmwp-MobileNav__action'
                                type='button'
                                onClick={() => {
                                    setPanel(null);
                                    props.onMentions();
                                }}
                            >
                                <FormattedMessage
                                    id='mmwp.mobileNav.mentions'
                                    defaultMessage='Mentions of me'
                                />
                            </button>
                            {props.unreadChannels.length ? channelList(props.unreadChannels) : (
                                <p className='mmwp-MobileNav__empty'>
                                    <FormattedMessage
                                        id='mmwp.mobileNav.noUnreads'
                                        defaultMessage='No unread conversations'
                                    />
                                </p>
                            )}
                        </>
                    )}
                    {panel === 'settings' && (
                        <>
                            <button
                                className='mmwp-MobileNav__action'
                                id='mmwp-mobile-account-settings'
                                type='button'
                                onClick={() => {
                                    setPanel(null);
                                    props.onAccountSettings();
                                }}
                            >
                                <FormattedMessage
                                    id='mmwp.mobileNav.accountSettings'
                                    defaultMessage='Notification and display settings'
                                />
                            </button>
                            <button
                                className='mmwp-MobileNav__action'
                                id='mmwp-mobile-security-settings'
                                type='button'
                                onClick={() => {
                                    setPanel(null);
                                    props.onSecuritySettings();
                                }}
                            >
                                <FormattedMessage
                                    id='mmwp.mobileNav.securitySettings'
                                    defaultMessage='Profile and security'
                                />
                            </button>
                            <a
                                className='mmwp-MobileNav__action'
                                href={props.pushSettingsHref}
                            >
                                <FormattedMessage
                                    id='mmwp.mobileNav.pushSettings'
                                    defaultMessage='Set up phone notifications'
                                />
                            </a>
                            <p className='mmwp-MobileNav__empty'>
                                <FormattedMessage
                                    id='mmwp.mobileNav.pushDescription'
                                    defaultMessage='Check notification permission and registration on this device.'
                                />
                            </p>
                        </>
                    )}
                </section>
            )}
            <nav
                className='mmwp-MobileNav__bar'
                aria-label={intl.formatMessage({id: 'mmwp.mobileNav.label', defaultMessage: 'Chat navigation'})}
                ref={navRef}
            >
                <button
                    type='button'
                    aria-expanded={props.lhsOpen}
                    onClick={() => {
                        setPanel(null);
                        props.onChat();
                    }}
                >
                    <i
                        className='icon icon-message-text-outline'
                        aria-hidden='true'
                    />
                    <span>{intl.formatMessage(messages.chat)}</span>
                </button>
                {(['dms', 'unread', 'settings'] as const).map((item) => (
                    <button
                        key={item}
                        type='button'
                        id={`mmwp-mobile-${item}`}
                        data-panel={item}
                        aria-expanded={panel === item}
                        onClick={() => togglePanel(item)}
                    >
                        <i
                            className={`icon ${icons[item]}`}
                            aria-hidden='true'
                        />
                        <span>{intl.formatMessage(messages[item])}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
