---
name: flutter-stack-template
description: Return one Flutter stack template as a vwf template payload — its
  axis fields, per-capability harness mechanisms, and conventions. Invoked by
  vwf-architecture and /vwf-setup after the user picks from the flutter menu —
  not a general-purpose skill.
---

# flutter-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The valid slugs are **exactly** the ones
`flutter-stack-menu` lists, and nothing else. An unknown slug is an
error: name the slugs that do exist and stop.

> **`invocation` must stay `both`** — see `flutter-stack-menu`.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/project/<slug>.md` — flat since format 22 — the template file,
   whose own `platforms:` frontmatter key is authoritative for which platforms
   it serves. Read that
   one file and nothing else; the deep Flutter doctrine lives in this plugin's
   `dart`, `pubspec`, `analysis-options` and `internationalization` skills and
   is loaded when it is needed, not here.
2. Return **only** the payload below, filled from it. No prose around it, no
   summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: project
platforms: <the file's own platforms: list>
languages: [ <the file's languages:> ]
optional_languages: [ <the file's optional_languages:> ]
frameworks: [ <the file's frameworks:> ]
dependencies: [ <the file's dependencies:> ]
harness: # how THIS stack satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — layout, tooling, testing, the changelog and store-note
  discipline. Verbatim from the file; do not summarize it away.>
```

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface. vwf's callers have Context7
for the second kind and will fetch it themselves.

| Include                                                    | Leave out                             |
| ---------------------------------------------------------- | ------------------------------------- |
| Where a decision has more than one defensible answer       | Widget constructor signatures         |
| The single-package rule and why the app is its own repo    | `pubspec.yaml` field reference        |
| Which layer talks to a backing service, and which does not | Client-SDK setup for a given provider |
| The release-notes discipline the store submission needs    | `flutter` CLI flag lists              |

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge now lives. Answer for every capability the stack touches, and use
`n/a` honestly rather than inventing a mechanism.

The one that separates this stack from a web one is **`goldens` rather than
`screenshots`**: a Flutter app is a native `frontend`, so its UI evidence comes
from golden/snapshot tests plus the framework's own accessibility assertions,
never from a browser driver. Answer `screenshots: n/a` and say why — vwf treats
a silent gap on a UI slice as a finding, so an honest `n/a` with a reason is
what keeps the gate meaningful.

`health` and `local_stack` are the backing side's, not ours: an on-device app
publishes no readiness endpoint, and whatever services it calls are stood up by
the `backing` template the product picked.
