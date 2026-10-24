// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint indent: ["error", 2], @typescript-eslint/indent: ["error", 2] */

export const fixedMobileViewport = 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no';

/** Apply the managed mobile viewport policy without intercepting text input. */
export function initializeMobileViewport(): (() => void) | undefined {
  const mobile = (/iPhone|iPad|iPod|Android|Mobile/i).test(navigator.userAgent) ||
  ((/Macintosh/i).test(navigator.userAgent) && navigator.maxTouchPoints > 1) ||
  window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches;
  if (!mobile || document.documentElement.classList.contains('mmwp-fixed-viewport')) {
    return undefined;
  }

  const root = document.documentElement;
  root.classList.add('mmwp-fixed-viewport');
  let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const createdViewport = !viewport;
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  const previousViewport = viewport.content;
  viewport.content = fixedMobileViewport;

  const preventZoom = (event: Event) => {
    if (event.cancelable) {
      event.preventDefault();
    }
  };
  const preventPinch = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      preventZoom(event);
    }
  };
  const options = {capture: true, passive: false};
  const gestures = ['gesturestart', 'gesturechange', 'gestureend'];
  for (const name of gestures) {
    window.addEventListener(name, preventZoom, options);
  }
  window.addEventListener('touchstart', preventPinch, options);
  window.addEventListener('touchmove', preventPinch, options);

  return () => {
    for (const name of gestures) {
      window.removeEventListener(name, preventZoom, options);
    }
    window.removeEventListener('touchstart', preventPinch, options);
    window.removeEventListener('touchmove', preventPinch, options);
    root.classList.remove('mmwp-fixed-viewport');
    if (createdViewport) {
      viewport.remove();
    } else {
      viewport.content = previousViewport;
    }
  };
}
