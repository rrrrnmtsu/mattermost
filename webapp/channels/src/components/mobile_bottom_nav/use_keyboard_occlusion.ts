// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useRef, useState} from 'react';

// Keep the bar hidden until the keyboard viewport has recovered, including the
// blur that happens before Send's native click. Focus alone must not move Send.
export function useKeyboardOcclusion() {
    const viewport = window.visualViewport;
    const initialHeight = Math.min(window.innerHeight, viewport?.height || window.innerHeight);
    const reference = useRef({height: window.innerHeight, width: window.innerWidth});
    const [occluded, setOccluded] = useState(window.innerHeight - initialHeight > 140);

    useEffect(() => {
        function update() {
            const height = Math.min(window.innerHeight, viewport?.height || window.innerHeight);
            const width = window.innerWidth;
            if (Math.abs(width - reference.current.width) > 80) {
                reference.current = {height: window.innerHeight, width};
            } else {
                reference.current.height = Math.max(reference.current.height, window.innerHeight, height);
            }
            setOccluded(reference.current.height - height > 140);
        }
        window.addEventListener('resize', update);
        viewport?.addEventListener('resize', update);
        update();
        return () => {
            window.removeEventListener('resize', update);
            viewport?.removeEventListener('resize', update);
        };
    }, [viewport]);
    return occluded;
}
