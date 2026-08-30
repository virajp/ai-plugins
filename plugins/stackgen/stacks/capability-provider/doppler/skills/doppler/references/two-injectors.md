# Doppler — two injectors, one set of names

The constraint that bites. It is not Doppler's availability, its latency or its
bill — it is that **this product has two suppliers of secrets and only one
shared vocabulary between them**.

Development is Doppler. Staging and production are the platform that runs them,
per clause 1 in [contract satisfaction](contract-satisfaction.md). The two
share exactly one thing: the **name** of each environment variable. That makes
the name the contract, and it reshapes three decisions.

## A variable that exists in only one place fails at the worst moment

Add a credential to Doppler and every laptop works. Nothing on any laptop can
tell you it is missing from the deployed side, because the deployed side is a
different system with a different membership list and a different person
maintaining it. The failure surfaces at deploy, or later — at the first request
that happens to need it.

This is the single largest cost of the split, and it has one durable answer:
**`docs/blueprint/environment.md` is the join.** Every variable and secret a
project needs is catalogued there by name, with its issuer, and that catalog is
what both suppliers are reconciled against. It is not documentation of the
Doppler config; it is the list neither supplier holds.

## Start-up fails loudly on a missing variable

**Read every required variable once at start-up and exit non-zero if one is
absent.** No defaults, no lazy read at first use, no empty string standing in.

A default is what converts "this environment is missing a secret" into
"requests to this endpoint fail in a way nobody attributes to configuration".
With two suppliers that mismatch is not a rare event — it is the normal
consequence of adding a credential — so the product has to be built to announce
it.

Reading lazily has the same shape as defaulting: the process starts green, and
the gap appears on whichever code path happens to need it, possibly days later.

## Nothing may be Doppler-shaped downstream of the injector

The application, the tests and the task library must not know which supplier
filled the environment. No `DOPPLER_*` variable is read by product code, no task
branches on whether the injector ran, and no configuration names a Doppler
project or config.

The rule is easy to hold while it is the only injector in play and easy to break
the first time someone reaches for a Doppler-only convenience. What it buys is
that the deployed environments — which have never seen Doppler — run the same
code and the same tasks.

## What this constraint does not justify

**It does not justify routing production through Doppler to make the problem go
away.** That trades a reconciliation problem for a runtime dependency on a
second vendor at start-up, and it is the trade this pack's scope declines. If a
team wants one manager end-to-end, the honest move is to pick the manager the
deployed platform can reach by identity, not to extend the dev one — see
[pick & trade](pick-and-trade.md).
