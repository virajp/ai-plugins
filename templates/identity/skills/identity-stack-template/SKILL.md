---
name: identity-stack-template
description: Return one identity stack template as a vwf template payload — its
  axis fields, per-capability harness mechanisms, and conventions. Invoked by
  <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> after the user picks from the identity menu
  — not a general-purpose skill.
argumentHint: "<slug>"
invocation: both
model: sonnet
effort: medium
---

# identity-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`<%= it.cmd("identity:identity-stack-menu") %>` lists, and nothing else.

> **`invocation` must stay `both`** — see `identity-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that a managed identity service comes from the project's cloud plugin rather
than from here. Never answer a slug this plugin has not written from general
auth knowledge — a template it has not written is a template it does not offer.

## How to answer

1. Read `<%= it.root %>/stacks/<axis>/<slug>.md` — the template file, whose own
   `axis:` frontmatter key is authoritative for the axis.
2. Read `<%= it.root %>/assets/contract.md` only when the caller asks what the
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
  <the template's prose — verification, claims, revocation, the operator plane,
  the decisions plan and execute need. Verbatim from the file; do not summarize
  it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                | Leave out                             |
| ------------------------------------------------------ | ------------------------------------- |
| What a token may and may not be trusted to carry      | SDK call signatures, endpoint URLs    |
| Where authorization is actually decided               | Per-language verification library setup |
| Revocation window and what it forces on the design    | The full OIDC specification           |
| Cost model, and what it grows with                    | Console click-paths, dashboard tours  |
| How sign-in works in local development                | Container CLI syntax                  |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the provider touches, and use
`n/a` honestly rather than inventing a mechanism. `local_stack` is the one that
decides most here: an issuer that cannot be run or faked locally makes every
acceptance run depend on a shared environment, and that has to be stated rather
than discovered.

Never name a test runner or a browser driver here — those belong to the project
axis's plugin, not to us.
