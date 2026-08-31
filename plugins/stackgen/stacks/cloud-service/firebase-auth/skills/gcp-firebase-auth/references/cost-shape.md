# Cost shape — Firebase Auth · Identity Platform

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

Billed per **monthly active user** above a free allowance, with the
organization-scale spelling metered differently from the basic one, plus
**per-message charges for phone sign-in**.

**Token verification is not metered.** It happens in the product's own services
against cached public keys, so verifying on every request — which the contract
requires — costs nothing on this bill. That is worth knowing, because the
instinct to "avoid an auth call per request" is the instinct that produces a
gateway-trusts-header design solving a problem that does not exist.

## The trap: phone sign-in is a fraud target

Message delivery is billed per message, and there is a standing category of
abuse — **toll fraud** — that exists to generate those messages: an attacker
drives sign-in attempts to numbers on networks that pay them a share of the
delivery fee. The product gets nothing and pays for all of it.

If phone sign-in is offered:

- **Turn on the platform's abuse protection** and the app-attestation check
  before launch, not after the first bill.
- **Rate-limit by number and by client**, and treat a spike in send volume
  without a matching spike in completions as an incident signal.
- **Set a billing alert specifically on it.** This is the one line on this
  service that can move by orders of magnitude overnight.

If it is not needed, not offering it is the cheapest control available.

## The other line worth naming

**Active users, not registered users.** A product with a large dormant base pays
for the ones who came back, which makes this one of the few services where the
bill tracks something the product actually wants. The corollary: a bot-signup
problem is a cost problem here as well as a data-quality one, because a bot that
signs in is active.

## What is not on this meter

The datastore reads that back it. Every request that resolves a role reads the
product's own store, and per the doctrine those reads are on every authorized
path — so they land on the datastore's bill, where reads may well be the
dominant line. That is the correct place for the cost to appear, and it is worth
knowing which meter it lands on when a bill is being explained.
