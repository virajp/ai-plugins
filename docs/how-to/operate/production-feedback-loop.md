# Keep the blueprint true once the product is live

[Start a product from an empty repo](../greenfield/single-repo.md) ends with a
deploy verified against the blueprint. This guide picks up from there. **Relay**
— the team task manager from that guide, one repo holding a single project that
declares both `service` and `webapp` — is in production now, and reality has
started disagreeing with the contract. A user reports a bug. The first metric
reading comes in under target. Somebody says a badge looks wrong. Three teams
ask for the same feature.

Each of those arrives as a sentence in a chat window, and each has exactly one
place it belongs. By the end of this guide all four have landed in a doc, three
have a fixing command behind them, and none of them has been fixed by hand.

Mechanics — flags, halt conditions, the classification table, config keys — live
in the [vwf plugin manual](../../plugins/vwf.md). This guide covers the journey
and the judgment calls.

## The journey

### 1. Verify the deploy

vwf never deploys. Relay's pipeline pushes the production tag; this runs once
that deploy is live, and it is one of the commands the model never fires on its
own — you decide when a post-deploy check happens.

```text
/vwf:verify production
```

One more cycle has shipped since the spine's staging check — the team board is
live alongside task creation, and notifications are still unbuilt. Relay's first
verify run had to ask for the production hostname; accepting the offer to pin
what it resolved is why no run since has asked. What the two passes cover, and
how each kind of failure routes:
[`/vwf:verify`](../../plugins/vwf.md#vwfverify).

The run comes back healthy, and every criterion passes except the ones belonging
to `130-task-notifications` — a flow nobody has built yet cannot satisfy an
acceptance criterion, so those come back not covered rather than quietly
skipped. That is a testing gap, filed as one, with a plan step offered for next
cycle. A probe coming back down would have been something else entirely: an
infrastructure failure is reported as operational and never filed as a blueprint
gap.

Relay is never offered the release freeze, on this run or any other — that offer
belongs to a standalone service, and
[an API-only product](../greenfield/api-only-service.md#9-vwfverify-and-the-release-freeze)
is where it is worked through.

### 2. Route the bug

A user writes in: tasks created from the board's quick-add show up with nobody
on them. Paste it in.

```text
/vwf:feedback "quick-add on the board creates tasks with no owner"
```

One item at a time. Before classifying anything the command reads `product.md`,
locates the surface the report touches, and recalls what is already known — send
the same complaint twice and the second run reports its status instead of filing
it again.

Relay's item classifies as a **behaviour bug**, and the reason is the entire
judgment: `110-create-task` already pins that an unassigned task is invalid, an
owner being chosen at creation rather than after. The blueprint is right and the
code is wrong, so the offer is a fix cycle against that slice:

```text
/vwf:plan create-task
```

Take it and you are back on the spine at
[`/vwf:plan`](../../plugins/vwf.md#vwfplan). Relay defers instead — the
ownership number is due this week, and the re-rank in step 3 is what will
schedule the fix — so the item lands as a line in the flow doc's Open Questions,
recording what production does against what the doc promises. That line is
written whether or not the memory daemon is up, which is the property that makes
deferring safe. [`/vwf:feedback`](../../plugins/vwf.md#vwffeedback).

### 3. Log the metric reading

Week four of use, and the ownership number is in.

```text
/vwf:feedback "week four: 71% of open tasks have both an owner and a due date"
```

A number against a goal `product.md` already declares is a **metric reading**.
Relay's `#goal-ownership-visible` targets 90% by week four, so this one misses,
and it lands as a dated row in that doc's Metric readings appendix — created on
first use, and a log rather than part of the reviewed contract, so it does not
go back through the product reviewer. A hit would be recorded and nothing else;
a miss carries an offer:

```text
/vwf:product
```

Update mode raises the missed metric before it asks anything else, and the
decision is yours: re-rank the slices, revisit the goal, or leave both and
record why. Relay re-ranks — the quick-add defect from step 2 is the likeliest
explanation, so that fix cycle moves ahead of notifications.
[`/vwf:product`](../../plugins/vwf.md#vwfproduct).

### 4. Route the UX complaint

```text
/vwf:feedback "the overdue badge on the board reads like an error — people think the task failed"
```

Classified as a **UX issue**: the rendered experience contradicts the design
system rather than the flow contract. It is recorded at the exact screen and
state, against the flow doc that defines that screen, and the offer forks on
which layer is actually wrong. Relay's is language-level — the badge is using
the destructive colour role, and overdue is a status, not a destruction — so the
fix is the design system:

```text
/vwf:design-system
```

That command imports rather than authors, so the colour role gets corrected in
the design tool and the command brings the corrected contract back into
`design-system.md` for the reviewers and the execute UX gate to read. Had the
complaint instead been that the board shows a member who belongs to no team a
blank page, the surface would be under-pinned rather than mis-styled — nothing
ever said what that state renders — and the offer would have been
`/vwf:blueprint team-board`. Which fork to take is a decision point, below.
[`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system).

### 5. Route the feature idea

```text
/vwf:feedback "three teams have asked for recurring weekly chores"
```

A want, not a defect, and it never goes straight to code — not to a plan, not to
a blueprint edit — because the only question it raises first is which goal it
serves, and that question belongs to `product.md`. The offer is `/vwf:product`.

Relay's answer is that recurring chores do serve `#goal-standup-free` (a weekly
chore nobody owns is precisely the thing re-asked every standup), but not more
urgently than notifications. So it is recorded as an unranked candidate under
that goal's slice-priority row and nothing is scheduled. When it is ranked
later, it enters `blueprint → plan → execute` like any other slice.

### 6. Harvest the design review

```text
/vwf:feedback canvas
```

Everything said while reviewing designs on a canvas is production feedback that
never reached a chat window, and `canvas` pulls those remarks back through the
design adapter — one call per pinned design project, so a product designed in
two different tools harvests both — then runs each remark through the same
classification and the same routes as a pasted one.
[`/vwf:feedback`](../../plugins/vwf.md#vwffeedback).

### 7. Where the four items ended up

The bug is a line in the flow doc's Open Questions, waiting for the cycle the
re-rank just scheduled. The reading is a row in `product.md` and a re-ranked
slice list. The complaint is a note at one screen and a design-system import.
The idea is an unranked candidate under the goal it serves. Not one of them is a
patch somebody applied and remembered.

That is the whole point of the loop. Every route ends in a **doc edit now** plus
the **offer of the command that fixes it**, so the fix — when it happens —
happens through `blueprint`, `plan` and `execute` against a contract that
already says the right thing. The alternative is a codebase that has quietly
diverged from its own blueprint, at which point the blueprint stops being worth
reading and every later plan is a guess.

## Decision points

### Classification is the judgment, not the paperwork

The same sentence from a user can be any of four things, and what decides is not
the wording but what the blueprint already says about that surface. "The badge
looks wrong" is a UX issue when the design system pinned a colour role and the
screen ignored it, and a blueprint hole when nothing ever pinned what that badge
means. Ambiguity is confirmed with you by multiple choice, one decision at a
time, rather than guessed — and it is worth answering carefully, because the
class picks the destination.

### A blueprint hole and an implementation defect look identical from production

Both arrive as "the product does the wrong thing". The test that separates them
is one read of the flow contract: **if the doc states the behaviour and
production disagrees, the code is wrong** — a behaviour bug, routed to
[`/vwf:plan`](../../plugins/vwf.md#vwfplan) as a fix cycle. **If the doc is
silent, the contract is wrong** — a blueprint hole, routed to
[`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint) to pin the behaviour down
first, and only then to a plan.

Getting it backwards is expensive in both directions. Planning against a doc
that never said what to build hands `execute` a plan full of open decisions,
which is exactly the situation the plan gate exists to prevent. Blueprinting a
plain defect re-litigates a contract that was already correct and leaves the bug
sitting in the code while you do it. When you genuinely cannot tell, read the
flow doc before answering the classification question; that read is the cheapest
step in this guide.

### A metric miss is a product question

The temptation on a missed number is to reach for a plan — something is
underperforming, so build something. The reading routes to
[`/vwf:product`](../../plugins/vwf.md#vwfproduct) instead, because a miss is
evidence about the *ranking*, and the honest response is sometimes to re-order
the slices, sometimes to change the target, and sometimes to conclude the goal
was measuring the wrong thing. A plan can only be right after that is settled.

### Deferring is not a backlog

Declining the offered command does not put the item in a queue somebody has to
remember to drain. The doc edit is written either way — an appendix row, a note
at the screen, or, when the fix cycle is declined, an Open Questions line — so
the item lives in the same tree as the contract it contradicts, and the next
[`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint) or
[`/vwf:plan`](../../plugins/vwf.md#vwfplan) run over that slice reads it. Memory
is the fast path, not the record: with the daemon down the routing is unchanged
and only the recall step is skipped, which is what makes it safe to defer.
[Memory](../../plugins/vwf.md#memory).

## When things halt

- **Verify halts when there is nothing to verify** — no flow docs carrying
  acceptance criteria and no deployable project in the registry.
  [`/vwf:verify`](../../plugins/vwf.md#vwfverify)
- **Verify stops to ask which environment** when the command names none and more
  than one is plausible. [`/vwf:verify`](../../plugins/vwf.md#vwfverify)
- **Verify stops on format drift that removed what it checks against** — a
  blueprint too old to carry acceptance blocks sends you to
  [`/vwf:setup`](../../plugins/vwf.md#vwfsetup) first.
- **`feedback canvas` stops when no design project is pinned**, and halts
  separately when a pinned project names a design tool no adapter supports — two
  distinct conditions that are never collapsed into one message.
  [`/vwf:feedback`](../../plugins/vwf.md#vwffeedback)
