---
name: observability-stack-template
description: Return one observability stack template as a vwf template payload —
  its axis fields, per-capability harness mechanisms, and conventions. Invoked by
  vwf-architecture and /vwf-setup after the user picks from the observability
  menu — not a general-purpose skill.
---

# observability-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`observability-stack-menu` lists, and nothing
else.

> **`invocation` must stay `both`** — see `observability-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that a managed backend comes from the project's cloud plugin rather than
from here. Never answer a slug this plugin has not written from general
telemetry knowledge — a template it has not written is a template it does not
offer.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/<axis>/<slug>.md` — the template file, whose own
   `axis:` frontmatter key is authoritative for the axis.
2. Read `%%AI_PLUGINS_ROOT%%/assets/contract.md` only when the caller asks what the
   capability requires in general. A template payload does not carry it: the
   template already states how *this* sink satisfies it.
3. Return **only** the payload below, filled from the template file. No prose
   around it, no summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: <the file's own axis: key>
capabilities: [] # capability-vocabulary tokens this sink realizes
harness: # how THIS sink satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — the collector's role, sampling, cardinality, retention
  and cost, the decisions plan and execute need. Verbatim from the file; do not
  summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                             | Leave out                              |
| --------------------------------------------------- | -------------------------------------- |
| Where sampling and redaction are decided            | Collector YAML reference               |
| Cardinality limits and what they forbid             | Per-language SDK setup                 |
| Retention per signal, and the cost curve behind it  | Query-language syntax                  |
| What happens when the sink itself is down           | Dashboard click-paths                  |
| How telemetry works in local development            | Container CLI syntax                   |

## The OTLP rule is not negotiable at this layer

**Always state that the product emits OTLP and never instruments against a
vendor SDK**, whatever the sink. A managed backend is a destination, not an
import. A template payload that quietly permits a vendor SDK has traded the one
property that makes the sink replaceable.

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the sink touches, and use `n/a`
honestly rather than inventing a mechanism. `local_stack` is the one that
matters here: a sink that runs locally is the reason a missing span is caught
before release rather than during an incident.

Never name a test runner here — that belongs to the project axis's plugin, not
to us.
