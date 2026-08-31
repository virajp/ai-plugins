# Service doctrine — Firebase Cloud Messaging

This component realizes the `push-notifications` capability. There is no neutral
push contract in `assets/contracts/` today, so unlike its neighbours this file
states its rules directly rather than citing one — and where a future contract
lands, these are the clauses it would be checked against.

## Push is best-effort, and is never a transport for state

A message can be dropped, delayed, coalesced with another, or delivered to a
device the user no longer holds. The platform may throttle a high-priority
message; the operating system may batch a low-priority one until the device
wakes.

So the payload **signals that something changed**, and the client **fetches the
truth from the product's own API**. Two consequences that are easy to get wrong
in the appealing direction:

- **Never put data in the payload that the product cannot afford to lose**, and
  never treat delivery as a write. A balance, a state transition, a
  "your order shipped" that exists nowhere else — all of these are the product's
  datastore's job, and push is the doorbell.
- **Never put anything sensitive in it either.** A notification payload is
  rendered on a lock screen and passes through infrastructure the product does
  not control.

**At-least-once is the guarantee**, so a delivery handler is idempotent: the
same message arriving twice produces one effect. Where the product cares about
ordering, carry a sequence or a version in the payload and let the client
discard what it has already passed — the transport preserves no order.

## The token lifecycle is where products leak

**A token identifies a device, not a user**, and it changes without warning: on
reinstall, on restore to a new device, on the platform's own schedule, and when
the app data is cleared.

The shape that works:

- **Store tokens as a collection under the user**, not a single field. One user
  has several devices, and overwriting is how a user stops getting notifications
  on the phone they actually use.
- **Refresh on every app start** and on the SDK's token-change callback,
  updating the record rather than adding a duplicate.
- **Delete on the unregistered response.** The send path tells you when a token
  is dead, and that response is the only reliable signal you will get. A store
  that ignores it grows forever, and every send iterates over addresses that
  cannot receive.
- **Remove a user's tokens on sign-out** from that device, or the next person to
  use it receives someone else's notifications.

## Data messages and notification messages behave differently

A message carrying a display payload is rendered by the platform, including when
the app is not running. A data-only message is handed to the app to act on, and
whether it runs at all when the app is backgrounded is a per-platform,
per-power-state question — the answer is often "not reliably", and designing a
background sync around it produces a feature that works on the developer's
unlocked device and nowhere else.

Pick the one that matches the intent, and where both are needed, send the
display half as display and let the app fetch on open.

## Consent and quiet hours are enforced before the send

The product checks its own preference record, its own quiet-hours rule and its
own rate limit, then sends. Not the reverse. The platform permission is a floor,
and it is one-shot: a user who revokes it is gone for every notification the
product will ever want to send, so an over-eager notification costs more than
the one it delivered.
