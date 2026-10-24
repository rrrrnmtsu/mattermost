// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getWebPushDocumentRedirect, navigateToWebPushDocument} from './webpush_login_redirect';

const origin = 'https://chat.example.test';
const plugin = '/plugins/com.sakura.mattermost-webpush';
const jobId = 'aB0_-'.repeat(8) + 'ab0';

describe('server-rendered Web Push login destinations', () => {
    test.each([
        [plugin + '/setup', origin],
        [plugin + '/open/' + jobId, origin + '/'],
        ['/chat' + plugin + '/setup', origin + '/chat'],
        ['/chat' + plugin + '/open/' + jobId, origin + '/chat/'],
        ['/work/chat' + plugin + '/setup', origin + '/work/chat'],
    ])('returns the same-origin path for %s', (path, siteURL) => {
        expect(getWebPushDocumentRedirect(path, siteURL, origin)).toBe(path);
    });

    test.each([
        null,
        '',
        '//outside.example' + plugin + '/setup',
        origin + plugin + '/setup',
        'https://outside.example' + plugin + '/setup',
        ['javascript', 'alert(1)'].join(':'),
        '/\\outside.example' + plugin + '/setup',
        '/api/v4/users/me',
        '/plugins/com.other.plugin/setup',
        plugin + '/setup/',
        plugin + '/setup?redirect_to=https://outside.example',
        plugin + '/setup#fragment',
        plugin + '/setup\n',
        plugin + '/open/' + 'a'.repeat(42),
        plugin + '/open/' + 'a'.repeat(44),
        plugin + '/open/' + '!'.repeat(43),
        plugin + '/open/' + 'a'.repeat(42) + '%',
        plugin + '/open/' + jobId + '/more',
        plugin + '/%73etup',
        '/somewhere/../plugins/com.sakura.mattermost-webpush/setup',
        plugin + '/open/../setup',
    ])('does not select %s for document navigation', (path) => {
        expect(getWebPushDocumentRedirect(path, origin, origin)).toBeNull();
    });

    test.each([
        [plugin + '/setup', origin + '/chat', origin],
        ['/chat-other' + plugin + '/setup', origin + '/chat', origin],
        ['/chat' + plugin + '/setup', origin, origin],
        ['/chat' + plugin + '/setup', 'https://outside.example/chat', origin],
        [plugin + '/setup', 'http://chat.example.test', origin],
        [plugin + '/setup', 'https://user:password@chat.example.test', origin],
        [plugin + '/setup', origin + '?query=1', origin],
        [plugin + '/setup', origin + '#fragment', origin],
        [plugin + '/setup', 'not a URL', origin],
        [plugin + '/setup', origin, 'null'],
    ])('rejects origin or SiteURL basename mismatch', (path, siteURL, currentOrigin) => {
        expect(getWebPushDocumentRedirect(path, siteURL, currentOrigin)).toBeNull();
    });

    test('assigns only the validated path and leaves unrelated SPA redirects untouched', () => {
        const location = {origin, assign: jest.fn()};
        expect(navigateToWebPushDocument(plugin + '/setup', origin, location)).toBe(true);
        expect(location.assign).toHaveBeenCalledTimes(1);
        expect(location.assign).toHaveBeenCalledWith(plugin + '/setup');
        expect(navigateToWebPushDocument('/work/channels/operations', origin, location)).toBe(false);
        expect(navigateToWebPushDocument('//outside.example', origin, location)).toBe(false);
        expect(location.assign).toHaveBeenCalledTimes(1);
    });
});
