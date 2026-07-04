# Notifications

One notifications foundation, **per-channel contracts**: push, email, SMS — each
channel the product uses is a deliberate selection. Cross-cutting token:
`notifications: [push, email]` (list the accepted channels).

## Default contract

- **Channels are explicit.** Push (mobile via the platform messenger, e.g.
  FCM/APNs) is the default first channel for an app product; email requires a
  real transport selection (not a logging stub shipped to production); SMS only
  when a flow genuinely needs it (cost + consent burden).
- **Triggers live on entities.** *What* notifies is a per-entity decision: each
  notifying action names its notification (event, audience, channel(s), payload
  gist) in the owning entity doc or the integration flow it belongs to. The
  foundation owns *how* channels work, never the trigger list.
- **Delivery is fire-and-forget or durable per the background-processes rule**:
  a single send off the request path forks in the service; batched, scheduled,
  or retry-critical sends are worker jobs.
- **Preferences & consent**: users can opt out per channel (transactional
  security notices may be exempt — name them); the preference lives on the user
  document; every send path checks it.
- **Localization**: notification content follows the product's locale set;
  templates live with the sending side, keyed by a stable template id — the
  blueprint names template ids and variables, never copy.
- **PII discipline**: device tokens/addresses are secrets-adjacent — catalogued
  per project in `environment.md` where server-side keys are involved; message
  bodies avoid embedding data the recipient shouldn't persist in plaintext
  channels (SMS/email previews).

## Elicit per product

- The channel set, and per channel: the provider selection (an `integrations`
  entry + `environment.md` keys), the transactional-vs-marketing split, and the
  opt-out exemptions.
- Quiet hours / batching / digest policies only if the product needs them —
  don't invent.

## Blueprint expansion

- `conventions.md#notifications` holds the channel contracts and preference
  rules; entity docs and `integration.md` flows carry the triggers; the user
  entity carries the preference fields. Realization: the common package's
  messaging wrapper + service/worker send paths in the reference-stack docs.
