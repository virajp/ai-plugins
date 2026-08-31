# Local dev — Firebase Cloud Messaging

**There is no emulator for delivery.** This is the one service in the bundle
with no local answer at all: nothing offline reaches a device, and the Firebase
Emulator Suite does not cover it. The functions emulator can trigger the code
path that *sends*, which is a different thing.

So this component contributes **nothing** to vwf's `local_stack`
(`assets/contracts/local-stack.md`) — a product whose local E2E suite needs no
push needs no local stack for it, and inventing one satisfies nothing. The
provider's full emulator map is the `gcp` skill's local-development reference.

## Keep sending behind a seam

The services layer exposes a notification interface — recipients, a kind, the
data the payload will carry — and the transport adapter behind it is the only
thing that talks to the service. Everything upstream depends on the interface.

That makes the testable surface the right one:

- **Assert the constructed payload.** Given this event and this recipient, the
  product produces this notification, to these tokens, with this priority. That
  is the logic worth testing and it is fully testable against a fake.
- **Assert the decisions before the send.** Consent, quiet hours, rate limits,
  recipient resolution — all of it is the product's own logic, none of it needs
  the transport.
- **Assert the token lifecycle.** Register, refresh, sign-out removal, and
  deletion on the unregistered response. That last one is the rule most often
  unimplemented, and a fake that returns an unregistered result is how you find
  out.

The adapter itself stays thin enough that "it calls the SDK with what it was
given" is nearly all it does, which is the part you accept as untested locally.

## What only a real device tells you

Everything below the seam, and it is worth planning a manual pass rather than
pretending otherwise:

- **Whether the message is displayed at all** in each app state — foreground,
  background, terminated — which differs per platform and is the most common
  source of "it works on mine".
- **Whether a data-only message runs** when the app is backgrounded, which is
  frequently not reliable and should not be designed around.
- **How the notification looks** on a lock screen, which is also a privacy check:
  the payload is rendered where anyone holding the phone can read it.
- **Permission flows**, including a user who denies and later enables in system
  settings.

Do that pass on both platforms before launch, once, against a staging project —
and treat anything it surfaces as a design finding rather than a bug to patch,
since most of these are properties of the transport rather than defects.
