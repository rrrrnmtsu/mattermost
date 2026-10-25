// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {createPortal} from 'react-dom';

import Constants from 'utils/constants';

import {isMobile} from './is_mobile_view_hack';
import MenuWrapperAnimation from './menu_wrapper_animation';

import './menu_wrapper.scss';

declare module 'react' {

    // This isn't a valid HTML attribute, but we use it in enough places now that it'll require some work to remove it

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
        disabled?: boolean;
    }
}

type Props = {
    children?: React.ReactNode;
    className: string;
    onToggle?: (open: boolean) => void;
    animationComponent: any;
    id?: string;
    isDisabled?: boolean;
    stopPropagationOnToggle?: boolean;
    open?: boolean;
    portalOnMobile?: boolean;
}

type State = {
    open: boolean;
}

/**
 * @deprecated Use the "webapp/channels/src/components/menu" instead.
 */
export default class MenuWrapper extends React.PureComponent<Props, State> {
    private node: React.RefObject<HTMLDivElement>;
    private portalNode = React.createRef<HTMLDivElement>();

    public static defaultProps = {
        className: '',
        animationComponent: MenuWrapperAnimation,
    };

    public constructor(props: Props) {
        super(props);
        if (!Array.isArray(props.children) || props.children.length !== 2) {
            throw new Error('MenuWrapper needs exactly 2 children');
        }
        this.state = {
            open: false,
        };
        this.node = React.createRef();
    }

    public componentDidMount() {
        if (this.state.open) {
            this.addEventListeners();
        }
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (props.open !== undefined && props.open !== state.open) {
            return {
                open: props.open,
            };
        }
        return null;
    }

    public componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.state.open && !prevState.open) {
            this.addEventListeners();
        } else if (!this.state.open && prevState.open) {
            this.removeEventListeners();
        }
    }

    public componentWillUnmount() {
        if (this.state.open) {
            this.removeEventListeners();
        }
    }

    private addEventListeners() {
        document.addEventListener('click', this.closeOnBlur, true);
        document.addEventListener('keyup', this.keyboardClose, true);
    }

    private removeEventListeners() {
        document.removeEventListener('click', this.closeOnBlur, true);
        document.removeEventListener('keyup', this.keyboardClose, true);
    }

    private keyboardClose = (e: KeyboardEvent) => {
        if (e.key === Constants.KeyCodes.ESCAPE[0]) {
            this.close();
        }

        if (e.key === Constants.KeyCodes.TAB[0]) {
            this.closeOnBlur(e);
        }
    };

    private closeOnBlur = (e: Event) => {
        if (e.target && (this.node.current?.contains(e.target as Node) || this.portalNode.current?.contains(e.target as Node))) {
            return;
        }

        this.close();
    };

    public close = () => {
        if (this.state.open) {
            this.setState({open: false});
            if (this.props.onToggle) {
                this.props.onToggle(false);
            }
        }
    };

    toggle = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        /**
         * This is only here so that we can toggle the menus in the sidebar, because the default behavior of the mobile
         * version (ie the one that uses a modal) needs propagation to close the modal after selecting something
         * We need to refactor this so that the modal is explicitly closed on toggle, but for now I am aiming to preserve the existing logic
         * so as to not break other things
        **/
        if (this.props.stopPropagationOnToggle) {
            e.preventDefault();
            e.stopPropagation();
        }
        const newState = !this.state.open;
        this.setState({open: newState}, () => {
            if (this.props.onToggle) {
                this.props.onToggle(newState);
            }
        });
    };

    public render() {
        const {children} = this.props;

        const Animation = this.props.animationComponent;
        const menu = (
            <Animation show={this.state.open}>
                {children ? Object.values(children)[1] : {}}
            </Animation>
        );

        // A fixed popup inside the virtualized post list inherits WebKit's
        // scroller containing block. Keep this opt-in popup at the body level.
        let popup: React.ReactNode = menu;
        if (this.props.portalOnMobile && isMobile()) {
            popup = null;
            if (this.state.open) {
                popup = createPortal(
                    <div
                        className='post mmwp-post-menu-portal'
                        style={{display: 'contents'}}
                        ref={this.portalNode}
                    >
                        {menu}
                    </div>,
                    document.body,
                );
            }
        }

        return (
            <div
                id={this.props.id}
                className={'MenuWrapper ' + this.props.className + (this.state.open ? ' MenuWrapper--open' : '')}
                onClick={this.toggle}
                ref={this.node}
                disabled={this.props.isDisabled}
            >
                {children ? Object.values(children)[0] : {}}
                {popup}
            </div>
        );
    }
}
