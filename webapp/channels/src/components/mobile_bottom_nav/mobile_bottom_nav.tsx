// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {Link} from 'react-router-dom';

import type {Channel} from '@mattermost/types/channels';

import './mobile_bottom_nav.scss';

type Panel = 'dms' | 'settings' | null;

export type Props = {
    currentChannelId: string;
    teamName: string;
    directChannels: Channel[];
    channelPaths: Record<string, string>;
    unreadCount: number;
    mentionCount: number;
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

const messages = {
    home: {id: 'mmwp.mobileNav.home', defaultMessage: 'Home'},
    dms: {id: 'mmwp.mobileNav.dms', defaultMessage: 'DMs'},
    mentionsTab: {id: 'mmwp.mobileNav.mentionsTab', defaultMessage: 'Mentions'},
    you: {id: 'mmwp.mobileNav.you', defaultMessage: 'You'},
    dmsTitle: {id: 'mmwp.mobileNav.dmsTitle', defaultMessage: 'Direct messages'},
    settingsTitle: {id: 'mmwp.mobileNav.settingsTitle', defaultMessage: 'Settings'},
};

function Badge({count}: {count: number}) {
    if (count <= 0) {
        return null;
    }
    return (
        <span
            className='mmwp-MobileNav__badge'
            aria-hidden='true'
        >
            {count >= 100 ? '99+' : count}
        </span>
    );
}

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
                    <span className='mmwp-MobileNav__iconWrapper'>
                        <i
                            className='icon icon-home-outline'
                            aria-hidden='true'
                        />
                        <Badge count={props.unreadCount}/>
                    </span>
                    <span>{intl.formatMessage(messages.home)}</span>
                </button>
                <button
                    type='button'
                    id='mmwp-mobile-dms'
                    data-panel='dms'
                    aria-expanded={panel === 'dms'}
                    onClick={() => togglePanel('dms')}
                >
                    <span className='mmwp-MobileNav__iconWrapper'>
                        <i
                            className='icon icon-message-outline'
                            aria-hidden='true'
                        />
                    </span>
                    <span>{intl.formatMessage(messages.dms)}</span>
                </button>
                <button
                    type='button'
                    onClick={() => {
                        setPanel(null);
                        props.onMentions();
                    }}
                >
                    <span className='mmwp-MobileNav__iconWrapper'>
                        <i
                            className='icon icon-at'
                            aria-hidden='true'
                        />
                        <Badge count={props.mentionCount}/>
                    </span>
                    <span>{intl.formatMessage(messages.mentionsTab)}</span>
                </button>
                <button
                    type='button'
                    id='mmwp-mobile-settings'
                    data-panel='settings'
                    aria-expanded={panel === 'settings'}
                    onClick={() => togglePanel('settings')}
                >
                    <span className='mmwp-MobileNav__iconWrapper'>
                        <i
                            className='icon icon-account-outline'
                            aria-hidden='true'
                        />
                    </span>
                    <span>{intl.formatMessage(messages.you)}</span>
                </button>
            </nav>
        </div>
    );
}
