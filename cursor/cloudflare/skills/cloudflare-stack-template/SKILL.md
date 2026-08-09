---
name: cloudflare-stack-template
description: Return one Cloudflare stack template as a vwf template payload —
  its axis fields, per-capability harness mechanisms, and conventions. Invoked by
  /architecture and /setup after the user picks from the cloudflare menu —
  not a general-purpose skill.
---

# cloudflare-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`/cloudflare-stack-menu` lists, and nothing else.

> **`invocation` must stay `both`** — see `cloudflare-stack-menu`.

**The catalogue is parked at Zero Trust Access**, so most Cloudflare service
names are *not* valid slugs here. An unknown slug is an error: name the slugs
that do exist and stop. Never answer one from general Cloudflare knowledge — a
template this plugin has not written is a template it does not offer.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/<axis>/<slug>.md` — the template file, whose own
   `axis:` frontmatter key is authoritative for the axis.
2. Return **only** the payload below, filled from it. No prose around it, no
   summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: <the file's own axis: key>
capabilities: [] # backing only — capability-vocabulary tokens it realizes
artifact: <token> # deploy only
harness: # how THIS stack satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — hostnames, policy shape, placement, the decisions plan
  and execute need. Verbatim from the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                       | Leave out                                |
| ------------------------------------------------------------- | ---------------------------------------- |
| When a project belongs behind the proxy, and when it does not | `wrangler` flags, SDK call signatures    |
| Cost model and the traps that bite at scale                   | Per-language client-library setup        |
| Quotas and limits that change the design                      | Release notes, dashboard click-paths     |
| The least-privilege shape of an access policy                 | The full policy-expression reference     |
| How the surface is reached in local development               | Tunnel CLI syntax                        |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the stack touches, and use
`n/a` honestly rather than inventing a mechanism. `health` and `e2e_staging` are
the two an access-controlled surface changes most: a probe that cannot get past
the proxy is not a health check, and a pre-production environment behind it
needs a service credential the test run can present.

Never name a test runner or browser driver here — those belong to the project
axis's plugin, not to us.

## The cloud underneath is not ours to pick

Zero Trust Access fronts a service; it does not host one. The template says what
the fronted project must expose and how the policy is shaped, and stays silent
on where that project runs — the `deploy` template for the hosting cloud owns
that, and pairing the two is vwf's job, not this skill's.
