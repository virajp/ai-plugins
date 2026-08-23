# Plan: plugin support — statusline removal, installer rename, `plugin` platform

**Status: approved 2026-08-21. WS1, WS2 and WS3 landed. WS4 in progress —
`/vwf:setup` done (`f6fb407`); `/vwf:product` next.**

This index is written to be executed from cold, by a session with no prior
context. Read it end to end before touching anything, then read the workstream
doc you are about to execute.

## Orientation

The repo is `virajp/ai-plugins` — a Claude Code plugin toolkit. Plugins are
**authored natively** under `plugins/<name>/` and that authored tree *is* what a
user installs; there is no render step and no template layer (one existed and
was deleted — do not reconstruct it). Exactly one file is generated:
`.claude-plugin/marketplace.json` at the repo root, projected from the 14 plugin
manifests by `mise run plugins:marketplace`, and committed.

`CLAUDE.md` at the repo root is the authoritative description of all of this and
should be read before the first edit. Two doctrine skills auto-apply while you
work and are authoritative for their areas: `.claude/skills/plugin-authoring/`
(editing `plugins/`) and `.claude/skills/installer-cli/` (editing `cli/` or
`tools/`).

### Hard rules — these override convenience

- **Never commit, push, tag, or release without explicit consent in the
  moment.** Consent for one action is not consent for the next. The `i:release`
  task in particular must be asked for every time.
- **Docs ship with the change.** Any change to plugin or installer behaviour
  reconciles `readme.md`, `CLAUDE.md` and `docs/` **in the same commit**. Stale
  docs here are worse than no docs.
- **Use the `git-workflow` skill for all git interactions.** Work in a worktree,
  not the main checkout.
- **Use `mise` for every task** — `mise tasks` lists them. Never call the
  underlying tool directly when a task wraps it.
- **Ask rather than assume.** Where this plan is silent on a judgment call, stop
  and ask; do not pick silently.

### Formatting trap

`CLAUDE.md`, `readme.md` and everything under `docs/` **are** dprint-formatted —
run `mise run code:format` (or `dprint fmt <path>`) after editing, and note that
widening one table cell re-pads every row. `plugins/**/*.md` is **excluded**
from dprint; match the surrounding fold width by hand there.

### The gate that must stay green

```sh
mise run plugins:marketplace --check   # committed manifest == fresh generation
mise run plugins:check                 # the nine authored-tree rules
mise run i:test                        # installer smoke tests + vitest
mise run typescript:test               # the npm-normalize hook table tests
```

`plugins.yml` runs these on every push, and users install `main` directly — a
red build is an installable bad state. Run them locally before proposing a
commit.

## The four workstreams

| Doc                                                    | Workstream                                     | Depends on                 |
| ------------------------------------------------------ | ---------------------------------------------- | -------------------------- |
| [01-remove-statusline.md](01-remove-statusline.md)     | Remove the statusline and context-caps         | —                          |
| [02-rename-installer.md](02-rename-installer.md)       | `bin/ai-plugins.mjs` → `bin/installer.mjs`     | —                          |
| [03-vwf-plugin-platform.md](03-vwf-plugin-platform.md) | Make `plugin` a first-class blueprint platform | —                          |
| [04-onboard-this-repo.md](04-onboard-this-repo.md)     | Build this repo as a vwf product               | WS3 (hard), WS1+WS2 (soft) |

```text
WS1 ──┐
      ├── one branch, one release (6.0.0)
WS2 ──┘

WS3 ── independent of WS1/WS2 ── hard gate on WS4

WS4 ── needs WS3's doc shape and both stack templates;
       should follow WS1+WS2 so the registry describes
       the repo as it will be, not as it was
```

Each workstream is its own branch and its own commit series. **Stop at the end
of each and report** — do not chain into the next without a go-ahead.

## Context — why this is being done

Three changes, one thread: **this repo is a Claude Code plugin toolkit, and
everything else it carries is either leaving or being renamed to say what it
is.**

1. **The statusline has moved to another project.** It is the CLI's largest
   surface — 5 source modules, 5 test files, the whole `tools/` tree, a JSON
   schema, a 23 KB user doc, and roughly half of `i:test` and `i:version`. It is
   also the CLI's *only* receipt-writing surface, so removing it changes what
   `--uninstall` is for.
2. **`bin/ai-plugins.mjs` is the installer**, and after (1) that is all it is —
   plugin installs, graphify wiring, and uninstall. The filename should say so.
3. **vwf cannot currently blueprint this repo.** vwf has a `plugin` platform
   (`system` role) with a full detection definition — see the "Platforms by
   evidence" table in
   `plugins/vwf/skills/setup/references/topology-detection.md` — but every
   `system` platform is explicitly *exempt from blueprint coverage*, with the
   exemption's own comment conceding "a doc shape for them is a later effort."
   So `product` → `architecture` works and `blueprint` has nothing to say about
   the 15 plugin directories that are the repo's whole point.

**Outcome:** a CLI that is only an installer, named as one; vwf able to author a
`plugin` project's contract; and this repo onboarded onto its own workflow end
to end, with `blueprint.coverage: complete` and `/vwf:plan` + `/vwf:execute`
usable against it.

## Decisions already taken — do not re-litigate

- **The Claude Code plugin stack template gets its own plugin**, `claude-code`,
  the 15th. vwf's own rule is that stack templates live in a stack plugin, never
  in vwf, so a `plugin`-platform template needs a home. It also absorbs this
  repo's private `.claude/skills/plugin-authoring/`, so the authoring doctrine
  ships to any repo writing Claude Code plugins instead of living in one
  checkout. (`devtools` was considered and rejected.)
- **The rename is file-only.** The `bin` **key** in `package.json` stays
  `ai-plugins` — it is the command users invoke, and npm's Trusted Publisher is
  bound to the package. Only the artifact filename changes.
- **`statusline.json` becomes a legacy receipt**, joining the OpenCode and
  Oh-My-Pi entries `cli/src/uninstall.ts` already reads.
- **Only `plugin` loses the blueprint-coverage exemption.** `packages`, `iac`,
  `misc`, `cicd` and every `data` platform stay exempt. Surgical carve-out, not
  a rewrite of the exemption rule.
- **Registry shape for WS4**: ~~three projects — `vwf` (`system`/`[plugin]`),
  `plugins` (`system`/`[plugin]`, the other 14), `installer`
  (`frontend`/`[cli]`)~~ — **superseded at setup time (2026-08-23): two
  projects.** `vwf` folds into `plugins`; the size argument for splitting it out
  did not outweigh a second `[plugin]` project the blueprint would have to keep
  disambiguating. `scripts/` and `.config/mise/tasks/` still get **no** project
  entry; they are repo tooling.
- **Full scope for WS4** — the whole vwf chain, not foundations only.

## Findings that a fresh reading will miss

These came out of the research behind this plan and are the three places it is
easiest to do the wrong thing.

**1. Removing the statusline can silently orphan existing users.**
`cli/src/statusline.ts` holds the only `new ReceiptBuilder()` and the only
`writeReceipt` call in the codebase, so after WS1 *nothing writes a receipt*. A
user on v5.2.0 has our bar installed and a receipt recording the bar they had
before it. If `statusline.json` is not moved into `LEGACY_RECEIPTS`,
`--uninstall` stops finding it and their own statusline never comes back — while
reporting a clean uninstall. This is the one thing WS1 can break invisibly, and
it is why the gutted `i:test` E2E is *replaced* rather than deleted.

**2. `/vwf:design-system` blocks WS4 as it stands.** Its §1 offers to proceed
when no project declares a screen platform, but §3 then preflights the design
adapter and **halts** on "no `design` on any screen-platform project" — which is
vacuously true for a repo with none. Meanwhile a `cli` project still requires
the doc's Terminal UX section, which §1 itself says is "always elicited in text;
the canvas neither designs nor imports it." WS3 adds the text-only path. Without
it, this repo cannot get a design system at all and `blueprint` will want one.

**3. `languages:` is what keeps `/vwf:doctor` from blocking.** Since
`config_format` 14 the language menu is closed to what the installed stack
plugins declare, and a token no plugin claims is `unknown` = **blocking**
(`setup` and `execute` both halt). The `claude-code` template declaring
`languages: [ markdown ]` is what makes the token known. Its facts: LSP *none —
unavailable in this marketplace* (reported, never a finding), manifest
`.claude-plugin/plugin.json`, toolchain not mise-managed.

## Version bumps

| Package                | From   | To         | Why                        |
| ---------------------- | ------ | ---------- | -------------------------- |
| `@askviraj/ai-plugins` | 5.2.0  | **6.0.0**  | Retired flags are breaking |
| `vwf`                  | 18.4.0 | **19.0.0** | Blueprint format 22 → 23   |
| `typescript`           | 3.1.0  | **3.2.0**  | One added template         |
| `claude-code`          | —      | **0.1.0**  | New                        |

`config_format` stays **15** — nothing in the config schema changes. Precedent:
blueprint format 21 shipped without a config bump. Plugin versions and skill
versions are independent by design and are not cross-checked.

Bumping a plugin's manifest version requires re-running
`mise run plugins:marketplace` — the committed marketplace manifest carries the
version, and `--check` fails otherwise.

## Definition of done

| WS | Done when                                                                                                                                                                                   |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | `grep -ril statusline` returns only dated records under `docs/memory/` and `docs/plans/`; `i:test` passes including the new legacy-receipt E2E; `pnpm pack --dry-run` lists `bin` only      |
| 2  | `mise run i:build` emits `bin/installer.mjs`; `grep -rn "ai-plugins.mjs"` returns nothing; the published command is still `ai-plugins`                                                      |
| 3  | `plugins:check` and `plugins:marketplace --check` pass with 15 plugins; both new stack menus return their entries; a `cli`-only registry reaches Terminal UX elicitation instead of halting |
| 4  | `/vwf:doctor` reports no blocking findings; `.config/vwf.yaml` reads `blueprint.coverage: complete`; `/vwf:plan` on one slice completes without halting                                     |

Full per-workstream verification steps are in each doc.

## Parked — ask before acting

Two items were deliberately left out of scope. Raise them with the user rather
than deciding:

- **`smol-toml` is a runtime dependency with zero importers** anywhere in `cli/`
  or `scripts/` — dead before this change, left over from the retired renderer.
  Removing it is a one-line win but is not this plan's business.
- **`plugins/typescript/skills/typescript-stack-menu/SKILL.md` carries stale
  format-21 language** in its Rules section: "Every project entry carries a
  `role`, and no two share one." Format 22 replaced `role` with `platforms` in
  the payload, and WS3 adds a second `cli` template, which that rule would
  forbid. WS3 touches this file anyway, so correcting it there is cheap — but it
  is a pre-existing defect, not part of the ask.
