// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef} from 'react';
import type {ReactNode, KeyboardEvent} from 'react';
import {FormattedMessage} from 'react-intl';

import {GenericModal} from '@mattermost/components';

type Props = {
    id: string;
    ariaLabel?: string;
    onClose: () => void;
    handleKeydown?: (event?: KeyboardEvent<HTMLDivElement>) => void;
    children: ReactNode;
};

// Mobile menus need an explicit exit even when a touch backdrop is obscured.
export default function MobileMenuModal({id, ariaLabel, onClose, handleKeydown, children}: Props) {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        function handleOutsideClick(event: globalThis.MouseEvent) {
            const target = event.target as Node | null;
            const modal = document.getElementById(id);
            if (!target || !modal?.contains(target) || surfaceRef.current?.contains(target) || closeButtonRef.current?.contains(target)) {
                return;
            }

            // The generic modal's transparent wrapper can cover its backdrop.
            // Consume only that outside click, never menu actions or a portal.
            event.preventDefault();
            event.stopPropagation();
            onClose();
        }

        document.addEventListener('click', handleOutsideClick, true);
        return () => document.removeEventListener('click', handleOutsideClick, true);
    }, [id, onClose]);

    return (
        <GenericModal
            id={id}
            className='menuModal'
            showHeader={false}
            backdrop={true}
            ariaLabel={ariaLabel}
            onExited={onClose}
            enforceFocus={false}
            handleKeydown={handleKeydown}
            footerContent={
                <button
                    ref={closeButtonRef}
                    type='button'
                    className='btn btn-tertiary menuModal__close'
                    onClick={onClose}
                >
                    <FormattedMessage
                        id='generic.close'
                        defaultMessage='Close'
                    />
                </button>
            }
        >
            <div ref={surfaceRef}>
                {children}
            </div>
        </GenericModal>
    );
}
