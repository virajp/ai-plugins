---
name: orchestration-stack-template
description: Return one async-orchestration stack template as a vwf template
  payload — its axis fields, per-capability harness mechanisms, and conventions.
  Invoked by <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> after the user picks from the
  orchestration menu — not a general-purpose skill.
argumentHint: "<slug>"
invocation: both
model: sonnet
effort: medium
---

# orchestration-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`<%= it.cmd("orchestration:orchestration-stack-menu") %>` lists, and nothing
else.

> **`invocation` must stay `both`** — see `orchestration-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that managed queues, buses and schedulers come from the project's cloud
plugin rather than from here. Never answer a slug this plugin has not written
from general queueing knowledge — a template it has not written is a template it
does not offer.

## How to answer

1. Read `<%= it.root %>/stacks/<axis>/<slug>.md` — the template file, whose own
   `axis:` frontmatter key is authoritative for the axis.
2. Read `<%= it.root %>/assets/contract.md` only when the caller asks what the
   capability requires in general, or asks which of queue / bus / scheduler /
   workflow engine the product actually needs. A template payload does not carry
   it: the template already states how *this* engine satisfies it.
3. Return **only** the payload below, filled from the template file. No prose
   around it, no summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: <the file's own axis: key>
capabilities: [] # capability-vocabulary tokens this engine realizes
harness: # how THIS engine satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — delivery semantics, retry policy, the poison path,
  determinism and versioning, the decisions plan and execute need. Verbatim from
  the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                  | Leave out                             |
| -------------------------------------------------------- | ------------------------------------- |
| Delivery semantics and what they force on every consumer | SDK call signatures                   |
| Retry policy shape, and what must never be retried       | Per-language client setup             |
| What breaks an in-flight process on deploy               | The full configuration reference      |
| Cost model, and what it actually grows with              | Console click-paths                   |
| How work is exercised in local development               | Container CLI syntax                  |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the engine touches, and use
`n/a` honestly rather than inventing a mechanism. `local_stack` and `e2e_local`
are the two that matter here: asynchronous work that cannot be driven to
completion in a test is asynchronous work with no acceptance criterion.

Never name a test runner here — that belongs to the project axis's plugin, not
to us. The engine's *own* test framework is a different thing and does belong,
because it is what makes a fourteen-day wait testable in milliseconds.
