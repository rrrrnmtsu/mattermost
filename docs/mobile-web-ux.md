# Managed mobile web UI

This branch follows Mattermost v11.7.14 and carries a small mobile web patch.
The server executable, API, database schema, permissions, licensing checks and
push plugin are unchanged. Source licensing remains defined by LICENSE.txt.

The managed UI keeps mobile input text at least 16 CSS pixels, prevents focus
zoom and manual zoom gestures, and prevents horizontal focus scrolling in the
iOS right-hand menu. Ordinary scrolling, taps and IME events are not canceled
by the viewport policy. Focus uses preventScroll when opening the menu.

The policy is loaded from the first webapp entry and bundled CSS. It does not
depend on reverse-proxy HTML substitution or injected external stylesheets.
The `sakura-mobile-ux` HTML meta tag identifies this build as `11.7.14-mobile.2`.

Build with the Node/npm versions in webapp/package.json and the committed
lockfile. A lockfile-only repair aligns Rollup with the override already in
the upstream package.json; no package requirement is weakened.

Run the mobile_viewport and mobile_sidebar_right Jest tests, changed-file
lint and TypeScript checks, then a production webapp build. Package
webapp/channels/dist as the `client` directory of a derived image based on
the exact matching official server image digest. Keep the original image
and client artifacts available for existing browser tabs and rollback.

Acceptance covers narrow phones, landscape, desktop, channel/reply/edit
composers, menus, search, attachment controls, verified HTTPS/WebSocket and
the existing notification plugin. Browser viewport resizing simulates only
available space; the owner must verify the actual iPhone keyboard, Japanese
IME, app resume, notification and tap-through behavior.

On each supported upstream security update, port only these patches to the
matching version and rebuild. Do not update the API/server/DB version as
part of a UI-only replacement. Submit generic input/menu fixes separately
from the deployment-specific no-zoom policy if contributing upstream.

Managed mobile controls bypass WithTooltip entirely: the original child retains
its click/ref/accessible name, while tooltip hover/focus handlers and portals
are absent. Desktop mouse hover and keyboard tooltips remain enabled. No
synthetic click or global single-touch cancellation is added. Touch acceptance
uses an actual touchscreen tap, including the nested workspace icon target,
and verifies exactly one action/request per tap.
