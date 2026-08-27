# Decisions — a plugin's flows are its *invocable* extension points

**Date** 2026-08-27 · **Branch** `main` · **Ships in** vwf 19.2.0 · Closes the
[format-fit gap](../gaps/2026-08-27-plugin-flow-granularity.md) that paused the
`/vwf:blueprint` sweep

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

## The rule

A plugin project's flows are the extension points **something can trigger** — a
command, an invocable skill, a hook. Two registrations are explicitly **not**
flows:

| Registration                                 | Where it goes now                          |
| -------------------------------------------- | ------------------------------------------ |
| a **subagent**                               | a **step** of each flow that dispatches it |
| **auto-applying doctrine** (`paths:`-scoped) | a **Reference** on the flows it governs    |

**It follows from the existing definition rather than adding a dial.** A flow is
*a journey to an observable outcome*; a subagent is a subroutine of the journey
that dispatched it, and doctrine is a constraint on other journeys. Neither has
a trigger or an outcome of its own, so a flow doc for either describes something
nobody can start.

Rejected: a size threshold escaping to per-plugin (an arbitrary number invites
argument at every boundary); one flow per independently-shipped unit (a single
doc cannot carry the gates and artifacts of 21 distinct commands); and a
repo-scoped waiver leaving the rule intact (the cost evidence says the rule is
unworkable generally, not just here).

## What it cost to find out

**48 flows → 25.** Nothing is lost: the excluded registrations are still fully
described, in the flow that uses them — which is also the only place their
inputs and gates mean anything.

The decisive evidence was measured, not argued: one flow authored end to end at
**~250k tokens and ~10 minutes**, for the *cheapest* case this product has. The
old reading put 102 flows on this repo — **~12M tokens**, more than a session
holds. A contract whose only conformant reading cannot be executed is a contract
that needs changing, and that sentence is the whole decision.

**A repo where even the invocable set is unmanageable should split the registry
project**, not coarsen its flows. Recorded in the contract so the next person
does not re-derive the escape.

## Three fixes that rode along, all found by the same run

- **Code-independence and the plugin contract genuinely conflicted.** The
  contract *requires* naming the host's extension mechanism — skill vs command
  vs hook supply different inputs, so the choice is load-bearing — while the
  obvious reading of code-independence forbids naming anything. The carve-out is
  now explicit and **bounded**: name the mechanism and invocation state; never
  the host's version, file layout, key spellings or command strings. Un-stated,
  this made a required section unwritable, which is exactly what happened on the
  first flow.
- **The baseline gained a third state.** *Inapplicable* — a rule with no
  *surface* — is now distinct from *waived*, carries no `enforcement.rules`
  entry, and is recorded as one closing paragraph. The bar is a missing surface,
  not missing work; when in doubt the rule applies.
- **`capability-vocabulary.md` gained non-capability nouns.** Version control, a
  package registry, the CI workflow, the container runtime, the agent host. They
  were missing, which is why real product names leaked into the first flow past
  a bar I was actively enforcing — there was no word to use instead.

## The checker had to be taught the difference

`plugins:check`'s technology-free guard failed the new noun table, because it
names `npm` and `docker`. The names are the **lookup key** — an author who wrote
"npm" finds the row by searching for it — so removing them breaks the table's
only job. Added to `TOOL_NAME_EXCEPTIONS` with that reason, which is the third
entry on a deliberately hard-to-extend allowlist.

Worth noting the guard behaved correctly: it caught prose naming tools in vwf,
which is what it is for. The exception is the judgment it cannot make.

## Still open

`010-vwf-setup` carries six reviewer gaps, **three of them caused by the
conflict now fixed** — it needs a fix round before the sweep resumes. The stamp
stays `partial`, so `/vwf:plan` remains blocked, which is correct.
