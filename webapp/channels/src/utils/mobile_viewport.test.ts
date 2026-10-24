// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint indent: ["error", 2], @typescript-eslint/indent: ["error", 2] */

import {fixedMobileViewport, initializeMobileViewport, isHomeScreenWebApp} from './mobile_viewport';

describe('managed mobile viewport', () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    document.head.innerHTML = '<meta name="viewport" content="width=device-width,initial-scale=1">';
    document.documentElement.classList.remove('mmwp-fixed-viewport');
    Object.defineProperty(window, 'matchMedia', {configurable: true, value: jest.fn(() => ({matches: false}))});
    Object.defineProperty(navigator, 'userAgent', {configurable: true, value: 'iPhone'});
    Object.defineProperty(navigator, 'maxTouchPoints', {configurable: true, value: 5});
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
  });

  test.each([
    ['iPhone', 5, true],
    ['iPhone', 0, true],
    ['iPad', 5, true],
    ['Android Mobile', 5, true],
    ['Macintosh', 5, true],
    ['Macintosh', 0, false],
    ['Windows NT', 0, false],
  ])('identifies %s with %i touch points', (agent, points, expected) => {
    Object.defineProperty(navigator, 'userAgent', {configurable: true, value: agent});
    Object.defineProperty(navigator, 'maxTouchPoints', {configurable: true, value: points});
    dispose = initializeMobileViewport();
    expect(document.documentElement.classList.contains('mmwp-fixed-viewport')).toBe(expected);
    expect(document.querySelector('meta')?.getAttribute('content')).toBe(expected ? fixedMobileViewport : 'width=device-width,initial-scale=1');
  });

  test.each(['gesturestart', 'gesturechange', 'gestureend'])('cancels %s', (name) => {
    dispose = initializeMobileViewport();
    const event = new Event(name, {cancelable: true});
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test.each(['touchstart', 'touchmove'])('preserves single touch and cancels pinch on %s', (name) => {
    dispose = initializeMobileViewport();
    for (const points of [1, 2]) {
      const event = new Event(name, {cancelable: true});
      Object.defineProperty(event, 'touches', {value: Array(points).fill({})});
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(points > 1);
    }
  });

  test.each(['click', 'input', 'compositionstart', 'compositionend', 'keydown'])('preserves %s', (name) => {
    dispose = initializeMobileViewport();
    const event = new Event(name, {cancelable: true});
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  test('initializes once and restores listeners and viewport on teardown', () => {
    dispose = initializeMobileViewport();
    expect(initializeMobileViewport()).toBeUndefined();
    dispose?.();
    dispose = undefined;
    const event = new Event('gesturestart', {cancelable: true});
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.querySelector('meta')?.getAttribute('content')).toBe('width=device-width,initial-scale=1');
  });
});

describe('Home Screen web app entry', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'standalone', {configurable: true, value: undefined});
  });

  test.each(['standalone', 'fullscreen'])('recognizes display-mode %s', (mode) => {
    Object.defineProperty(window, 'matchMedia', {configurable: true, value: jest.fn((query) => ({matches: query === `(display-mode: ${mode})`}))});
    expect(isHomeScreenWebApp()).toBe(true);
  });

  test('recognizes the iOS Home Screen flag', () => {
    Object.defineProperty(window, 'matchMedia', {configurable: true, value: jest.fn(() => ({matches: false}))});
    Object.defineProperty(navigator, 'standalone', {configurable: true, value: true});
    expect(isHomeScreenWebApp()).toBe(true);
  });

  test('retains the normal browser entry', () => {
    Object.defineProperty(window, 'matchMedia', {configurable: true, value: jest.fn(() => ({matches: false}))});
    Object.defineProperty(navigator, 'standalone', {configurable: true, value: false});
    expect(isHomeScreenWebApp()).toBe(false);
  });
});
