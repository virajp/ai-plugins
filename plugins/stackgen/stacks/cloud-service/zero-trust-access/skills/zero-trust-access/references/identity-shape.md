# Zero Trust Access — identity shape

The least-privilege grants this service needs. The account-side model —
roles, API tokens, the two identity systems that are not the same one —
is the `cloudflare` skill's identity and IAM reference, which this cites
and does not restate.

## Who is granted what, and where

Three distinct grants, routinely confused because all three are "access":

| Grant | Lives | Held by |
| --- | --- | --- |
| Reach the application through the proxy | The Access policy | A group in the identity provider |
| Change the policy | The Cloudflare account | The `Cloudflare Access` role |
| Reach the application as a machine | A service token | One automation |

Nobody needs the second in order to have the first. Granting account
access so that a person can *use* an internal tool is the mistake this
table exists to prevent, and it hands out the ability to rewrite the
policy in order to satisfy a request that the policy already covers.

## Users: the group is the grant

**Allow by group membership.** The group is the least-privilege boundary
and it is maintained where it should be — in the identity provider,
alongside every other thing membership decides. The policy names it and
otherwise stays out of the way.

**Not an email domain**, which admits everyone the organisation will ever
hire and keeps admitting everyone it has ever employed until somebody
notices.

**Not a list maintained here.** A second list is a second thing to keep in
step, and the one that drifts is always the one nobody's onboarding
checklist mentions.

Where the population genuinely differs per environment — staging open to
the whole engineering group, production to a smaller on-call one — that is
two groups and two policies, not one broad group covering both.

## Machines: a service token, and what it is not

Automation authenticates with a **service token** — a client ID and secret
pair presented on the request — matched by a **Service Auth** rule. No
login page is presented, which is the point: a machine cannot complete an
interactive sign-in.

**It is not a Bypass rule.** Bypass disables enforcement for matching
traffic, making it publicly reachable; a machine admitted that way is a
machine that did not authenticate, and so is everybody else who sends the
same request. The distinction matters most when someone is debugging a
failing automation under time pressure, because Bypass is the change that
makes the symptom go away.

**It is not a person's credential.** A token belongs to one automation and
is named for it, so revoking it stops exactly one thing and the blast
radius is legible before anyone pulls it. A shared token is one nobody
dares revoke.

**It is a secret, and gets the ordinary treatment.** Injected as an
environment variable at the process boundary, catalogued by name and never
by value in `docs/blueprint/environment.md`, and rotated. There is no
keyless story available here, and claiming one would be worse than naming
the secret and handling it properly.

Give a token an expiry, and prefer re-issuing to extending. A credential
with no expiry is one whose owner nobody has had to name since it was
created.

## The application still authorizes

The proxy decides **who reaches the door**; the product decides **what
they may do**. The group that gets through is not a role, and mapping it
to one inside the application is a decision the application owns.

Two failure modes worth designing against:

- **The application drops its own checks** because the proxy is in front
  of it. Every user who gets through is then fully privileged, and the day
  the proxy is removed or bypassed there is nothing underneath.
- **The two disagree silently.** Someone in the allowed group has no role
  in the application and sees an empty or broken interface, which reads as
  a bug rather than as a grant nobody made.

## What it verifies, and against what

The project verifies the assertion the proxy passes — signature against
the issuer's published keys, and audience against **this** application.
The mechanics and the reason live in the service doctrine; the
least-privilege point here is that the assertion identifies a user, and
what that user may do is still the application's answer.
