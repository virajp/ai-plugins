# Firebase Cloud Messaging — conventions

The provider's push transport to mobile and web clients: one API in front of the
platform push services, so the product sends once rather than integrating with
each.

**Push is best-effort and is never a transport for state.** A message can be
dropped, delayed, coalesced, or delivered to a device the user no longer has.
Treat it as a **notification that something changed**, and let the client fetch
the truth from the product's own API. A payload the product cannot afford to
lose does not belong here.

**The token is per device, not per user**, and it changes without warning — on
reinstall, on restore, on the platform's own schedule. Store tokens as a
collection under the user, refresh them on every app start, and **delete on the
unregistered response** the send path returns. A token store nothing prunes
grows forever and sends into the void.

**Delivery handlers are idempotent.** At-least-once is the guarantee, and the
same message arriving twice must produce one effect.

**Sending authenticates as a service account**, with the narrow send permission
— never a long-lived server key. The legacy key form is a permanent credential
of exactly the kind the provider's identity doctrine rules out.

**User consent and quiet hours are the product's, and are enforced before the
send.** The platform's permission prompt is the floor, not the policy: a product
that sends what a user asked not to receive loses the permission for everything.

**There is no emulator for delivery.** Nothing local reaches a device, so keep
sending behind a seam and assert the constructed payload in tests
(`assets/contracts/local-stack.md`).

Full judgment: the `gcp-firebase-messaging` skill's references. The
provider-wide half — cost doctrine, IAM, the emulator map, the private plane —
is the `gcp` skill's.
