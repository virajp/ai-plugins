# Platforms & Doc Units

Read this at §2 when the flow touches a project declaring a **screen platform**
(to settle its platform set) or when a project's `doc_unit` is anything other
than the obvious one. A screenless flow of an `entity`-unit project needs
neither.

## Platform extensions

Read the registry project's `platforms:` — the single source (it is not in
`.config/vwf.yaml`) — and take its **screen platforms**: `site`, `webapp`,
`desktop`, `mobile`, `tablet`, `auto`. Every other token it declares
(`service`, `worker`, `packages`, `cli`, and every `data`/`system` platform) is
screenless and contributes no platform file. When a project declares targets
beyond its stack's default, the Screens elicitation covers what genuinely
differs per platform —
navigation/input idiom, window/layout behavior, platform-specific states — and
records only the differences, never a per-platform copy.

## Which platforms implement this flow

A journey is one flow; each **screen** platform that implements it gets a
`<platform>.md`.
**Elicit the platform set per flow** — a product decision, bounded by the
registry project's declared screen platforms. A project whose platforms are all
screenless produces `index.md` alone, however many of them there are. Most flows implement the project's
primary platform only; `auto` in particular is selective (signing in or
onboarding while driving makes no sense). Record the set in `index.md`'s
**Platforms** table with a one-line note per platform on how its take differs.
Steps, acceptance, and jobs stay in `index.md` and are **never forked per
platform** — a platform that cannot perform a step omits the screens for it and
says so in its note.

## In-car (`auto`)

`auto` covers **CarPlay and Android Auto together** (the vocabulary names form
factors, not vendors). An in-car take is a *platform file*, not its own flow —
the pre-format-15 "in-car subset flow" with its `Subset of:` link is retired.
Its Screens elicitation pins the in-car specifics per screen: the OS
**template** it maps to (list / grid / map / now-playing / …), the glanceable
content subset vs the phone screen, and the driver-distraction constraints —
recorded under the platform file's **Platform deviations**, noting any
CarPlay-vs-Android-Auto difference there. In-car UIs are template-constrained by
the OS; custom layout does not apply.

## Doc unit

Each registry project declares a `doc_unit` (`entity` / `page` / `module`).
Under format 9 these map as: `page` doc units (typically a project declaring the
`site` platform) are authored as **flows** — a page journey is a flow; `module`
doc units (a `packages`, `iac`, `plugin` or `cli` platform) stay under
`entities/` — a module boundary is a supporting contract, with `schema.yaml`
written as `N/A — <reason>` when the module has no data shape. The same section
structure and completeness bars apply; an inapplicable surface is
`N/A — <reason>`, never silently omitted.

A **`cli`** project is the clearest case for that `N/A`: its contract is a set
of commands, flags and exit codes, none of which has a data shape.
