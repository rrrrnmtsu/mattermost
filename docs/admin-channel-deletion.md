# System-admin-only permanent channel deletion

The web client exposes a separate destructive action from the channel header
menu and the archive section in Channel Settings. Only the system_admin role
can see or invoke it. The confirmation requires the exact display name, locks
while in flight, and preserves an uncertain failure as an error.

The existing DELETE /api/v4/channels/{id}?permanent=true endpoint now loads the
current server user and requires IsSystemAdmin, even when ordinary channel
archive permissions are present. Town Square is also rejected. Local-mode
operator access remains administrative. EnableAPIChannelDeletion must be true;
only deploy that setting together with this guarded server binary.

The application uses the existing permanent-deletion operation for channel
records, posts and associated membership/webhook cleanup. It does not promise
physical erasure of attachment blobs, plugin-owned data or retained backups.
Ordinary archive behavior, schema migrations and license checks are unchanged.
Deleting data cannot be undone by rolling back an image.

Acceptance uses newly created private QA channels only. Verify normal users,
channel admins and team admins receive 403; anonymous requests fail; Town
Square and DMs are rejected. Verify exact-name gating, cancel, failure recovery,
one request per confirmation, post/channel removal and safe navigation on both
mobile WebKit and Chromium. A browser emulator is not a physical iPhone test.
