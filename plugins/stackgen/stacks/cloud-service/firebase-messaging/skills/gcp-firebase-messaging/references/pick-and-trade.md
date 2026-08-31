# Pick & trade — Firebase Cloud Messaging

## When this is the answer

- **The product has native or web clients that need push at all**, and does not
  want to integrate with each platform's push service separately. That is the
  whole value: one API, one payload shape, one send path.
- **The rest of the stack is already this provider's.** The client SDK is
  already present, the identity is already there, and the send permission is one
  more grant rather than a new integration.
- **The notifications are notifications** — something changed, come and look.

## When it stops being the answer

- **The product needs delivery guarantees, receipts, or an audit trail of who
  was told what.** Push is best-effort by design and reports very little back.
  Where a message must provably reach someone, the channel is email or SMS with
  its own record, and push is at most a nudge alongside it.
- **The product needs rich multi-channel orchestration** — preferences across
  push, email and SMS, scheduling, campaign logic, per-user throttling. A
  messaging platform owns that, and this service becomes one transport under it
  rather than the thing the product integrates with.
- **The client is a desktop app or a server-side consumer.** This targets mobile
  and web; anything else needs its own channel.

## The choice inside the service

**Sending to a token, to a topic, or to a condition.** Tokens are the default
and the only one with per-user authorization: the product decides who gets what,
because it resolves the recipients. Topics are a broadcast — the *client*
subscribes, so anyone who knows a topic name can subscribe to it. That makes
topics right for genuinely public fan-out (a release announcement, a match
starting) and wrong for anything user-specific, which is a mistake that reads as
a performance optimization until it is a data leak.

## What it does not decide

**Whether to send.** Consent, preferences, quiet hours and rate limits are the
product's, enforced before the send path is reached. The platform's permission
prompt is a floor, not a policy — and it is a one-shot resource, since a user
who revokes it after being spammed is gone for every notification the product
will ever want to send.
