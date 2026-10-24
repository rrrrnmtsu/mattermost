// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const PLUGIN_PATH = '/plugins/com.sakura.mattermost-webpush/';
const OPEN_PATH = /^open\/[A-Za-z0-9_-]{43}$/;

/** Only these server-rendered pages need to leave the React router after login. */
export function getWebPushDocumentRedirect(redirectTo: string | null, siteURL: string, origin: string): string | null {
    // Keep the login route's root-relative requirement. Reject browser URL
    // normalization of slashes, control characters and dot segments as well.
    if (!redirectTo || !(/^\/([^/]|$)/).test(redirectTo) || (redirectTo.includes('\\') || (/\s/).test(redirectTo))) {
        return null;
    }

    try {
        const site = new URL(siteURL);
        const current = new URL(origin);
        if (!['https:', 'http:'].includes(site.protocol) || site.origin !== current.origin ||
            site.username || site.password || site.search || site.hash) {
            return null;
        }

        const basePath = site.pathname.replace(/\/+$/, '');
        const prefix = basePath + PLUGIN_PATH;
        const destination = new URL(redirectTo, current.origin);
        if (destination.origin !== current.origin || destination.pathname !== redirectTo ||
            destination.search || destination.hash || !redirectTo.startsWith(prefix)) {
            return null;
        }

        const page = redirectTo.slice(prefix.length);
        return page === 'setup' || OPEN_PATH.test(page) ? destination.pathname : null;
    } catch {
        return null;
    }
}

type NavigationLocation = Pick<Location, 'origin' | 'assign'>;

export function navigateToWebPushDocument(redirectTo: string | null, siteURL: string, location: NavigationLocation = window.location): boolean {
    const path = getWebPushDocumentRedirect(redirectTo, siteURL, location.origin);
    if (!path) {
        return false;
    }
    location.assign(path);
    return true;
}
