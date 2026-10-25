// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';

import menuItem from './menu_item';

type Props = {
    onClick: (e: React.MouseEvent) => void;
    onTouchStart?: React.TouchEventHandler<HTMLButtonElement>;
    onTouchMove?: React.TouchEventHandler<HTMLButtonElement>;
    onTouchEnd?: React.TouchEventHandler<HTMLButtonElement>;
    onTouchCancel?: React.TouchEventHandler<HTMLButtonElement>;
    text: React.ReactNode;
    extraText?: string;
    id?: string;
    buttonClass?: string;
    rightDecorator?: React.ReactNode;
    isDangerous?: boolean;
    disabled?: boolean;
    sibling?: React.ReactNode;
    iconClassName?: string;
}
export const MenuItemActionImpl = ({
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    text,
    extraText,
    id,
    buttonClass,
    rightDecorator,
    isDangerous,
    disabled,
    sibling,
    iconClassName,
}: Props) => (
    <>
        <button
            data-testid={id}
            id={id}
            className={classNames('style--none', buttonClass, {
                'MenuItem__with-help': extraText,
                'MenuItem__with-sibling': sibling,
                disabled,
                MenuItem__dangerous: isDangerous,
            })}
            onClick={onClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            disabled={disabled}
        >
            {iconClassName && <i className={`icon ${iconClassName}`}/>}
            {text && <span className='MenuItem__primary-text'>{text}{rightDecorator}</span>}
            {extraText && <span className='MenuItem__help-text'>{extraText}</span>}
        </button>
        {sibling}
    </>

);

const MenuItemAction = menuItem(MenuItemActionImpl);
MenuItemAction.displayName = 'MenuItemAction';

export default MenuItemAction;
