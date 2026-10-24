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
The `sakura-mobile-ux` HTML meta tag identifies this build as `11.7.14-mobile.3`.

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


Mobile.3 groups secondary composer tools behind a labeled button while keeping
attachment and Send directly available. The text input stays mounted, and the
existing submit, permissions, draft and IME logic remains in charge. The compact
composer also applies to a managed phone in landscape. Desktop controls retain
their original layout.

At the existing mobile breakpoint (768 CSS px), a bottom navigation row opens
chats, existing DMs, actual unread conversations, and settings. It reuses core
selectors, router links and settings dialogs. Mentions are a separate action
rather than being labeled unread. The row occupies layout space instead of
covering Send, respects the bottom safe area, and folds while the keyboard
reduces the viewport. A single joined team does not need a permanent team rail;
multiple-team switching remains available.

Home Screen standalone/fullscreen web apps skip the native-app chooser. Normal
browser entry keeps the existing chooser. Push settings still use the separate
plugin page; this fork does not change its API, payload, VAPID or worker policy.
The deployment's separate plugin settings update distinguishes OS permission,
server registration, test acceptance and the user's own on-device confirmation.

Focused composer, navigation, routing, keyboard-viewport, Home Screen entry and
previous tooltip tests accompany this patch. Public browser acceptance covers
single-touch send, DM/unread navigation, settings, draft preservation and layout.
A simulated standalone flag or reduced viewport is not physical iPhone evidence.
