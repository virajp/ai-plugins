# Plan: generalize vwf, finish the onboarding, release once

**Status: 2026-08-25. WS0 and WS3 are DONE — the flag shipped and `6.0.0` is
released. WS1 and WS2 remain DEFERRED: they move to their own plan, to be
written when the work is picked up.**

Supersedes the pending half of `docs/plans/plugin-support/`. WS1, WS2 and WS3 of
that series landed; only its WS4 remains, and it is restated here — deferred
rather than scheduled.

This plan is written to be executed from cold. Read it end to end before
touching anything.

## What is live, and what is not

| WS | Scope                       | State                                        |
| -- | --------------------------- | -------------------------------------------- |
| 0  | The statusline pointer flag | **Done** — this is the only work that ran    |
| 1  | Generalize vwf              | **Deferred** — its own plan, not yet written |
| 2  | Finish onboarding this repo | **Deferred** — blocked on WS1                |
| 3  | Release `6.0.0`             | **Released 2026-08-25** — the gate cleared   |

WS1 and WS2 are kept here as the **record of what was found**, not as scheduled
work. Do not start either from this document: the decision on 2026-08-24 was to
take vwf's generalization separately, with a fresh plan written when it begins.
What is below is the evidence that plan will be built from.

## WS0 — The statusline pointer flag (done)

A user who has not heard the statusline moved will still type `--statusline`.
Retiring the flag outright answered them with `unknown option` and nowhere to
go, which is precisely the population that needed the pointer most.

The flag is restored, installs nothing, and reports where the bar went:

- Alone: prints the notice, exits **1**. No usage wall — it is a request, so it
  gets an answer rather than the flag table.
- With a real install (`--all --statusline`): the installs still run and report
  first, the notice prints **last**, and the run exits **1** because the
  statusline half of the request did not happen.
- `--platform`, `--upgrade`, `--force` and `--no-statusline` stay retired.

The URL `https://claude-status.virajp.dev` is **live as of 2026-08-25**, and the
notice now prints `brew install virajp/tap/claude-status`. The placeholder
comment is gone.

**The install command it originally printed was wrong** —
`@askviraj/claude-status` was never published to npm, so
`pnpx @askviraj/claude-status --install` would have failed for every user who
ran it. Nine files carried that command; all were corrected before the release,
which is the reason the release did not go out on the day the flag landed.

## Why WS1 and WS2 exist

An attempt to onboard this repo onto its own workflow (the old WS4) reached
`/vwf:product` and stopped inside `/vwf:architecture`. It stopped because the
onboarding kept hitting places where vwf's closed menus had no honest answer for
a repo of this shape — four in two commands, two of which had to be fixed before
the step could proceed at all.

The diagnosis is not that vwf is wrong. It is that **vwf's menus were populated
from one reference stack**, which is exactly what the 2026-08-17 north-star
record predicted when it said a closed stack menu forces the maintainer's own
choices on users. The fix is to widen the menus and the registry vocabulary
deliberately, rather than to keep authoring a template mid-onboarding each time
one is missing.

So: generalize first, then finish the onboarding, then release everything
together.

## The hard constraint

**RESOLVED 2026-08-25 — claude-status shipped, and this constraint is lifted.**
What it said, kept because it is why the release waited:

**Nothing is released until `claude-status` is ready.** The statusline and its
caps hook moved to that package; this repo's `main` already carries the breaking
removal. Publishing `6.0.0` before the replacement exists would leave a user
whose statusline stops working with nothing to install instead.

This is why the version bump and the release sit at the end of this plan rather
than shipping on their own — they are finished work, deliberately held.

## What is already done — do not redo it

Verified against the tree on 2026-08-24, not taken from a status line:

| Work                                    | Evidence                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Statusline removal (old WS1)            | `b142397`; `tools/`, `statusline.ts`, `statusline-consent.ts` all gone |
| Installer rename (old WS2)              | `bin` key `ai-plugins` → `./bin/installer.mjs`, `files: ["bin"]`       |
| `plugin` platform first-class (old WS3) | `claude-code` 0.1.0 ships `claude-code-plugin.md`; flows cover plugins |
| Statusline cleanup paths                | `ce20863`, 21 files, −929 lines                                        |
| Plugin version bumps                    | vwf 19.0.0, claude-code 0.1.0, typescript 3.3.0                        |
| Onboarding: `/vwf:setup`                | `f6fb407` — `.config/vwf.yaml` stamped, both projects, stacks recorded |
| Onboarding: `/vwf:product`              | `1c56902` — eight goals, reviewer returned NO GAPS first round         |

At the time of writing the installer was `5.2.0`; `6.0.0` released on 2026-08-25
once `claude-status` shipped.

## WS1 — Generalize vwf (DEFERRED)

Three gaps are known now. Each is general — none is specific to this repo.

### 1a. The backing menu has no non-cloud document store

The menu ships `postgres`, `cloud-sql`, `firebase`, `oidc`, `otel-lgtm`,
`temporal`. A project declaring `document-datastore` backed by a local,
embedded, or vector store has nothing honest to pin. This repo hit it with its
memory layer; it bites anyone not on a managed cloud document store.

Decide first **whether it is a template or a vocabulary problem** — a semantic
or vector store may not be a `document-datastore` at all, in which case the
vocabulary needs the token rather than the menu needing the file.

### 1b. `doc_unit` for `cli` falls through a catch-all

The documented defaults map `site`/`webapp` → `page` and
`packages`/`iac`/`plugin` → `module`; everything else lands on `entity`. For a
CLI that is a fall-through, not a decision, and `entity` is a poor fit for a
project whose contract is commands rather than records. Make it deliberate,
whichever way it lands.

### 1c. The registry cannot express supporting tooling

A project that exists to deliver another one — a build tool, an installer, a
scaffolder — is indistinguishable in the registry from a product surface. Both
carry a `role` and `platforms` and nothing else. The question raised while
walking this repo's `installer` was where that distinction belongs: a registry
field, a prose concern, or nothing at all.

**This one needs a decision before it needs an implementation.** Adding a
registry field is the expensive answer and may be the wrong one.

### 1d. Unknown: does the blueprint format fit a plugin product?

WS3 made `plugin` a covered platform and wrote a contract bar for it, and that
bar **has never been exercised**. It is recorded as the top risk in
`docs/blueprint/product.md`. It cannot be answered by inspection — only the
sweep in WS2 answers it, which is why WS1 cannot be finished before WS2 starts.

### The discovery loop, stated plainly

WS1's scope is partly defined by what WS2 discovers, and WS2 is blocked on WS1.
That is circular if taken literally, so it is not taken literally:

- **WS1 fixes what is known** (1a–1c) and stops.
- **WS2 proceeds** and logs every new gap to `docs/memory/gaps/` as it surfaces,
  rather than fixing it inline — which is what the previous attempt did, and is
  why it stalled twice.
- **WS1b** batches whatever WS2 found, once the sweep has run and the list is
  real.

The rule that makes this work: **during WS2, a missing template or vocabulary
token is recorded and worked around, never authored mid-sweep.**

## WS2 — Finish the onboarding (DEFERRED)

Resume the chain. `setup` and `product` are done.

| Step                 | Note                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/vwf:architecture`  | Derivation mode. Two projects and all four stack pins are already decided and recorded — give them as answers, do not re-elicit              |
| `/vwf:doctor`        | **Immediately after the registry exists.** This is the first run where §§3–5 execute, and the `markdown` unknown-language check finally runs |
| `/vwf:design-system` | Text-only Terminal UX path — no canvas, no mockups, no scratchpad. `ui: false`                                                               |
| `/vwf:blueprint`     | The sweep. Flows are extension points; entities are the artifacts with real lifecycles. Log gaps, do not fix them                            |

**Carried forward from the stopped attempt** — these were elicited and are not
to be re-asked: both projects declare `depends_on: []`; `installer` declares
`capabilities: []`; `plugins` declares
`[runtime-settings, audit-log, document-datastore]`.

**One accepted debt.** `document-datastore` was declared on `plugins` with
`backing_template: []` by explicit decision, knowing `/vwf:doctor` reports the
missing pin every run until 1a lands. It is a known finding, not a regression.

## WS3 — Release, once (DONE)

Gate cleared 2026-08-25 — `claude-status` ships from `virajp/homebrew-tap`
(macOS on Apple silicon only) and its site is live.

- Bump `@askviraj/ai-plugins` 5.2.0 → **6.0.0** (breaking: retired flags,
  `--uninstall` no longer restores a pre-statusline bar).
- Re-run `mise run plugins:marketplace` if any plugin version moved.
- `mise run i:release`, then a GitHub Release for the tag — **ask before running
  it**, every time.
- Release notes must name `claude-status` as the way back for anyone whose
  statusline stops working.

## Parked — decide before acting

Both predate this plan and neither is its business:

- **`smol-toml` has zero importers** in `cli/` or `scripts/` — dead since the
  renderer retired. One-line removal, but it is not this change's scope.
- **`plugins/typescript/skills/typescript-stack-menu/SKILL.md` carries stale
  format-21 language**: "Every project entry carries a `role`, and no two share
  one." Format 22 replaced `role` with `platforms`, and two `cli` templates now
  ship, which that rule forbids.

## Housekeeping this plan assumes

- `docs/plans/2026-08-23-statusline-cleanup/` and old WS1–WS3 are archived via
  `/vwf:archive` (user-invoked; it is not model-invocable).
- `docs/plans/plugin-support/index.md` is corrected or retired — it currently
  reads "WS4 in progress" and says the marketplace is built from "14 plugin
  manifests" where there are 15.

## Definition of done

| WS | Done when                                                                                                                |
| -- | ------------------------------------------------------------------------------------------------------------------------ |
| 1  | 1a–1c each resolved or explicitly declined with the reason recorded; 1d still open, by design                            |
| 2  | `/vwf:doctor` reports no blocking findings beyond the accepted `document-datastore` debt; `blueprint.coverage: complete` |
| 1b | Every gap logged during WS2 is triaged — fixed, parked with a reason, or declined                                        |
| 3  | `6.0.0` published, GitHub Release cut, notes naming the replacement package                                              |
