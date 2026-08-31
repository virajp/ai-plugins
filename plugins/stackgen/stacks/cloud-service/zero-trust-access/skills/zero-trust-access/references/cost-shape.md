# Zero Trust Access — cost shape

The provider's billing principle is **seats, not traffic** — the
`cloudflare` skill's cost doctrine owns it, including what frees a seat
and the review that reconciles seats against the group. This is what that
principle means for this one service.

## The bill tracks the org chart

The unit is a **seat per user allowed through**, independent of how many
requests they make. So:

- **Traffic growth does not move the bill.** An operator plane that gets
  ten times busier costs the same. That is unusual enough to be worth
  saying out loud, because every instinct trained on consumption billing
  points the other way.
- **Team growth does.** Ten more operators is ten more seats, whether or
  not they ever log in.

## The trap

**Everyone who *can* reach it costs, not everyone who does.** A group
generously scoped "so nobody gets blocked" bills for every member of that
group from the moment the policy admits them, and nothing about a quiet
seat looks different from a busy one. This is the direct cost of the
broad-group habit, and it lands in the same place as the security
argument — the policy should allow the group that actually needs the
plane, not the nearest larger group that certainly contains it.

The second half of the trap is that **the seat does not release itself**.
Someone who has not logged in for a quarter, or who left the identity
provider, still holds a seat until they are removed from it. That is why
the provider's cost review and its privilege review read the same evidence
and are worth running as one pass.

## Two things that are not seats

- **Automation.** A service token is a credential, not a user, and it does
  not consume a seat. Where the choice is between giving a monitoring
  system or a test run a person's seat and giving it a credential, the
  credential is both the cheaper and the more correct answer.
- **A Bypass path.** Traffic admitted with enforcement disabled has no
  identity to charge for. That is a fact about the billing model, not an
  argument for Bypass — see the service doctrine on what Bypass actually
  does.

## The sizing question

Not "how much traffic will this take" but **"who is on this list, and who
will be on it in a year"**. If the honest answer is a population that
grows with the product's own users rather than with the team, this is the
wrong stack for that project — which is the same conclusion
[pick & trade](pick-and-trade.md) reaches from the design direction.

Never write dollar figures. They change; the shape does not.
