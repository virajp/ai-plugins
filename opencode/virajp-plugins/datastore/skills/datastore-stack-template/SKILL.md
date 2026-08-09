---
name: datastore-stack-template
description: Return one datastore stack template as a vwf template payload — its
  axis fields, per-capability harness mechanisms, and conventions. Invoked by
  architecture and /vwf-setup after the user picks from the datastore menu
  — not a general-purpose skill.
---

# datastore-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`datastore-stack-menu` lists, and nothing else.

> **`invocation` must stay `both`** — see `datastore-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that a managed datastore comes from the project's cloud plugin rather than
from here. Never answer a slug this plugin has not written from general database
knowledge — a template it has not written is a template it does not offer.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/<axis>/<slug>.md` — the template file, whose own
   `axis:` frontmatter key is authoritative for the axis.
2. Read `%%AI_PLUGINS_ROOT%%/assets/contract.md` only when the caller asks what the
   capability requires in general. A template payload does not carry it: the
   template already states how *this* provider satisfies it.
3. Return **only** the payload below, filled from the template file. No prose
   around it, no summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: <the file's own axis: key>
capabilities: [] # capability-vocabulary tokens this provider realizes
harness: # how THIS provider satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — versioning, transactions, migrations, pooling, cost
  shape, the decisions plan and execute need. Verbatim from the file; do not
  summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                    | Leave out                              |
| ---------------------------------------------------------- | -------------------------------------- |
| How concurrency and atomicity are actually achieved        | Client-library or ORM call signatures  |
| Cost model and the traps that multiply it at scale         | Per-language driver setup              |
| Limits that change the data model                          | The full SQL or query-language reference |
| Pooling and connection shape as a design decision          | Server tuning parameters               |
| How the store is reached in local development              | Container CLI syntax                   |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the provider touches, and use
`n/a` honestly rather than inventing a mechanism. `local_stack` is the one that
matters most here: vwf's non-negotiable mechanism is a composed service behind a
`wait-on` readiness gate, because the acceptance verifier needs a deterministic
ready signal.

Never name a test runner or a migration library here — those belong to the
project axis's plugin, not to us.
