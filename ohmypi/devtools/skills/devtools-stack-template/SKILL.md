---
name: devtools-stack-template
description: Return one devtools stack template as a vwf template payload — its
  axis fields, per-capability harness mechanisms, and conventions. Invoked by
  /skill:vwf-architecture and /skill:vwf-setup after the user picks from the devtools menu
  — not a general-purpose skill.
---

# devtools-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`/skill:devtools-stack-menu` lists, and nothing else.

> **`invocation` must stay `both`** — see `devtools-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that a managed container host comes from the project's cloud plugin rather
than from here. Never answer a slug this plugin has not written from general
container knowledge — a template it has not written is a template it does not
offer.

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
  <the template's prose — the artifact, the release path, configuration and
  secrets, the private plane, health, the decisions plan and execute need.
  Verbatim from the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                       | Leave out                            |
| ------------------------------------------------------------- | ------------------------------------ |
| Why one image is promoted rather than rebuilt per environment | Dockerfile instruction reference     |
| What the host must inject, and what the image must not hold   | `docker` / `compose` CLI flags       |
| Which project roles do **not** deploy this way                | Registry vendor comparison           |
| How the release stays behind a task so the host is swappable  | The host's own deploy CLI            |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the stack touches, and use
`n/a` honestly rather than inventing a mechanism. `local_stack` is the one whose
mechanism vwf fixes rather than accepting a variant: composed services behind a
`wait-on` readiness gate, because the acceptance verifier needs a deterministic
ready signal. `health` is the other that matters here — a container host's
liveness and readiness probes point at the endpoint the capability requires.

Never name a test runner or a package manager here — those belong to the project
and repo axes' plugins, not to us.

## The host underneath is not ours to pick

This template says what the artifact is and what the host must provide; it stays
silent on **which** host runs it, deliberately. A managed container service is a
cloud plugin's template, and it is vwf's job to pair the two, not this skill's.
