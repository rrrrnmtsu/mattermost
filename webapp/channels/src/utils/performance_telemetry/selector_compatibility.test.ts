// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {findPerformanceTarget, identifyElementRegion} from './element_identification';

describe('web-vitals selector compatibility', () => {
    afterEach(() => {
        document.body.replaceChildren();
        jest.restoreAllMocks();
    });

    test('keeps valid metric target attribution', () => {
        document.body.innerHTML = '<div id="channel_view"><span class="metric-target"></span></div>';
        const target = findPerformanceTarget('#channel_view > .metric-target');
        expect(target).not.toBeNull();
        expect(identifyElementRegion(target!)).toBe('center_channel');
    });

    test('tolerates unescaped React IDs from onboarding LCP attribution', () => {
        document.body.innerHTML = '<div id=":rb:"><span></span></div>';
        expect(() => findPerformanceTarget('#:rb:>span')).not.toThrow();
        expect(findPerformanceTarget('#:rb:>span')).toBeNull();
        expect(findPerformanceTarget('#\\:rb\\: > span')).toBe(document.querySelector('span'));
    });

    test.each([undefined, '', '.missing'])('tolerates missing or invalid target %s', (selector) => {
        expect(findPerformanceTarget(selector)).toBeNull();
    });

    test('does not swallow unrelated programming failures', () => {
        jest.spyOn(document, 'querySelector').mockImplementation(() => {
            throw new Error('unexpected failure');
        });
        expect(() => findPerformanceTarget('.target')).toThrow('unexpected failure');
    });
});
