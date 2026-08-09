---
name: typescript-stack-template
description: Return one TypeScript stack template as a vwf template payload —
  its axis fields, per-capability harness mechanisms, and conventions. Invoked by
  /architecture and /setup after the user picks from the typescript menu —
  not a general-purpose skill.
---

# typescript-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`/typescript-stack-menu` lists, and nothing else. An unknown slug is
an error, not a guess: name the slugs that do exist and stop.

> **`invocation` must stay `both`** — see `typescript-stack-menu`.

## How to answer

1. Read the template file. Its path depends on the axis:
   - `project` → `%%AI_PLUGINS_ROOT%%/stacks/project/<role>/<slug>.md`
   - `deploy` / `repo` → `%%AI_PLUGINS_ROOT%%/stacks/<axis>/<slug>.md`

   The file's own frontmatter is authoritative for its axis and role.
2. Return **only** the payload below, filled from it. No prose around it, no
   summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: project | deploy | repo
role: <the file's own role: key> # project axis only
languages: [ typescript ]
optional_languages: []
frameworks: [] # the file's frontmatter, verbatim
dependencies: [] # the file's frontmatter, verbatim
artifact: <token> # deploy axis only
package_manager: <token> # repo axis only
harness: # how THIS stack satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — layout, testing, placement, the decisions plan and
  execute need. Verbatim from the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                     | Leave out                                 |
| ----------------------------------------------------------- | ----------------------------------------- |
| Where a file goes and why the directory shape is that shape | Framework API signatures, operator syntax |
| Which seam a third party is reached through                 | The vendor SDK's own setup guide          |
| The coverage bar and what it is scoped to                   | Test-runner CLI flags                     |
| Which decisions the other axes own, so they are not doubled | Release notes, version history            |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the stack touches, and use
`n/a` honestly rather than inventing a mechanism; vwf uses it to decide which
capabilities it can even ask about.

- `e2e_local` and `screenshots` come from the **project** template's own test
  setup. A `packages` project is a library — no dev server, no screens, and
  plain unit tests with no backing services, which makes it the one template
  needing no local stack at all.
- `local_stack` is the **backing** axis's to provide; a project template names
  only that its suites gate on it, never which services run in it.
- `health` is `n/a` for `npm-package`: nothing is running to probe, so the
  post-release check is an install smoke test in the pipeline instead.

Never name a datastore, an identity provider or a hosting target here — those
belong to the backing and deploy axes' plugins, not to us.

## Effect is the through-line, not a separate stack

Most of these templates compose Effect, whose doctrine ships in this same plugin
as the `effect` skill. So `conventions` states *where the DI seam sits* and
*what must go through the common package* — placement decisions a caller cannot
look up — and leaves `Effect.gen`, `Layer` and `Schema` usage to that skill's
references.
