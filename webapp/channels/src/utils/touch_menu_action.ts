// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type Point = {identifier: number; clientX: number; clientY: number};
type Points = {length: number; [index: number]: Point};
type TouchActionEvent = {
    touches: Points;
    changedTouches: Points;
    currentTarget: HTMLElement;
    preventDefault: () => void;
    stopPropagation: () => void;
};

// Keep a legacy menu alive until its trusted touch action has run. Suppressing the
// later compatibility click prevents it from reaching content exposed by closing.
export class TouchMenuAction {
    private pending?: Point & {time: number; moved: boolean};
    private readonly now: () => number;

    constructor(now = Date.now) {
        this.now = now;
    }

    start(event: Pick<TouchActionEvent, 'touches'>) {
        const touch = event.touches[0];
        this.pending = event.touches.length === 1 ? {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY, time: this.now(), moved: false} : undefined;
    }

    move(event: Pick<TouchActionEvent, 'touches'>) {
        if (!this.pending) {
            return;
        }
        if (event.touches.length !== 1 || event.touches[0].identifier !== this.pending.identifier) {
            this.cancel();
            return;
        }
        const touch = event.touches[0];
        this.pending.moved ||= Math.abs(touch.clientX - this.pending.clientX) > 10 || Math.abs(touch.clientY - this.pending.clientY) > 10;
    }

    cancel() {
        this.pending = undefined;
    }

    end(event: TouchActionEvent, action: () => void) {
        const start = this.pending;
        this.cancel();
        if (!start || event.changedTouches.length !== 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const touch = event.changedTouches[0];
        const rect = event.currentTarget.getBoundingClientRect();
        const moved = start.moved || Math.abs(touch.clientX - start.clientX) > 10 || Math.abs(touch.clientY - start.clientY) > 10;
        if (touch.identifier !== start.identifier || moved || this.now() - start.time > 750 ||
            touch.clientX < rect.left || touch.clientX > rect.right || touch.clientY < rect.top || touch.clientY > rect.bottom) {
            return;
        }
        action();
    }
}
