# OIDC issuer — cost shape

The billing and operational model, and the traps. No dollar figures: they age
badly and are wrong per region anyway.

## The two shapes are entirely different

**Self-hosted: the cost is operational, and it is availability.** An issuer sits
on the critical path of every authenticated request — or at least of every
sign-in and refresh — so it needs at least the availability the product needs.
That means redundancy, a database behind it, backup and restore that has
actually been tested, and someone who knows how to upgrade it.

The compute bill for an issuer is usually small. The cost is the operational
commitment, and it is easy to underestimate because the thing is small right up
until it is down, at which point nobody can sign in.

**Managed: almost always per monthly active user.** This is the important
property, and it is worth restating because it surprises people: the bill grows
with **reach**, not with usage. A product with many occasional users costs far
more than a product with few intensive ones, which is the opposite of how
compute and storage bill.

## The trap: modelling MAU against traffic

Model the managed cost against the product's **growth curve**, not its traffic.
A team used to per-request pricing will forecast identity cost from request
volume and be badly wrong in either direction.

Two specific edges worth checking in the pricing before committing:

- **What counts as active.** A user who only refreshed a token, or who signed in
  once on day one of the month, may or may not count. The definition moves the
  bill substantially for products with long-lived sessions.
- **Where the tier boundaries are.** MAU pricing is usually banded, and the step
  between bands can be large. Knowing where the next step is turns a surprise
  into a forecast.

## Cost of the free tier ending

Managed identity commonly has a generous free tier, which makes it the obvious
choice early and creates a dependency before anyone has modelled the paid one.
The portability that OIDC buys is the mitigation — but only if the product kept
its boundary narrow, per [integration & access shape](access-shape.md). A
product that reached into the issuer's proprietary API for roles and profiles
has to pay whatever the bill becomes.

## Cost of the operator plane

If the operator plane uses a separate managed issuer, it bills separately and
its MAU count is small but its per-user tier may not be. Where operators are few
and expensive to license, sharing one issuer with a distinct audience is the
cheaper shape — and satisfies the contract equally.
