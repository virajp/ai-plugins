---
name: gcp-stack-template
description: Return one Google Cloud stack template as a vwf template payload
  —
  its axis fields, per-capability harness mechanisms, and conventions. Invoked by
  architecture and /vwf-setup after the user picks from the gcp menu — not a
  general-purpose skill.
---

# gcp-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. Valid slugs are the ones `gcp-stack-menu` lists: `firebase`,
`cloud-sql`, `cloud-run`, `gke`. An unknown slug is an error, not a guess.

> **`disable-model-invocation` must stay `false`** — see `gcp-stack-menu`.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/<axis>/<slug>.md` — the template file.
2. Return **only** the payload below, filled from it. No prose around it, no
   summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: backing | deploy
capabilities: [] # backing only — capability-vocabulary tokens it realizes
artifact: <token> # deploy only
harness: # how THIS stack satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — layout, wiring, placement, the decisions plan and
  execute need. Verbatim from the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                        | Leave out                           |
| -------------------------------------------------------------- | ----------------------------------- |
| Which service to reach for, and when it stops being the answer | `gcloud` flags, SDK call signatures |
| Cost model and the traps that bite at scale                    | Per-language client-library setup   |
| Quotas and limits that change the design                       | Release notes, API version history  |
| Least-privilege IAM shape                                      | The full IAM role catalogue         |
| Which services have local emulators                            | Emulator CLI syntax                 |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the stack touches, and use
`n/a` honestly rather than inventing a mechanism:

- `local_stack` — for `firebase`, the Firebase Emulator Suite, which is why that
  stack needs no Docker. For `cloud-sql`, a Docker-composed Postgres behind a
  `wait-on` gate, per vwf's one non-negotiable mechanism.
- `health` — the readiness endpoint convention for the deploy target.
- `e2e_staging` — whether the target admits a deployed pre-production
  environment at all.

Never name a test runner or browser driver here — those belong to the project
axis's plugin, not to us.

## Observability is OpenTelemetry

Every template's `conventions` states observability the same way: the product
emits **OTLP** and the stack terminates it. Never instruct a caller to
instrument against a vendor SDK — GCP's observability services appear only as
OTLP destinations, so the product's telemetry stays portable off GCP.
