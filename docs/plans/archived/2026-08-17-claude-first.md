# Plan: Claude-first — retire the renderer, the multi-target trees, and the multi-target CLI

**Status: landed** — shipped as v5.0.0 (the cutover) and v5.1.0 (plugin installs
restored to the CLI as a thin wrapper over `claude plugin`, a post-landing
correction: removing them was an unwanted capability cut).

**Sequencing: this lands before the stackgen plan
([2026-08-17-stackgen.md](./2026-08-17-stackgen.md)) is implemented** — every
plugin stackgen would touch gets simpler once there is one authored tree instead
of a template layer and four renders. The stackgen plan is written against the
template layer, so it takes a path/terminology pass once this lands, before its
own approval gate.

## Why

Users are already installing Claude-format plugins into other tools by giving
the tool (Codex, Cursor, …) the plugin's GitHub link and asking it to install —
and it works. The Claude plugin layout is becoming the de-facto standard that
other agents can consume directly. Meanwhile this repo pays its single largest
complexity bill — `templates/` + Eta helpers + `renderer/` + four committed
render trees + byte-parity CI + per-target verification — for support that is
*limited anyway*: the coverage report concedes 17–18 dropped and 20–30 degraded
features on the flat targets every build.

Claude-first inverts the bet: author for Claude Code natively, and serve every
other tool with a documented install prompt instead of a bespoke render.

**Revised 2026-08-17 (same day, after review): the cut goes deeper than the
first draft.** The statusline's OpenCode and Oh-My-Pi surfaces retire along with
the plugin adapters, and the CLI stops installing plugins entirely — the native
`claude plugin marketplace add` + `claude plugin install` commands are the whole
install story. That flips distribution from npm to GitHub: the npm package no
longer carries plugin content at all.

## End state

- **One authored tree: `plugins/<name>/` at the repo root.** The current
  `claude/plugins/*` render (already valid, Eta-resolved Claude plugins) is
  promoted to the authored source. No `templates/`, no Eta tags, no `renderer/`,
  no neutral `plugin.yaml` — each plugin's manifest is its native
  `.claude-plugin/plugin.json`, hooks are authored directly as
  `hooks/hooks.json`, and skills say `/vwf:plan` in plain text. The `schema/`
  package retires with the neutral manifest; what validation survives moves into
  the checker.
- **`claude/`, `cursor/`, `ohmypi/`, `opencode/` and `.cursor-plugin/` are
  deleted** (the `claude/` content is what moves to `plugins/`). So are
  `plugins.json` and `templates/marketplace.yaml` — both existed for the CLI's
  multi-target install, which no longer exists.
  `.claude-plugin/marketplace.json` stays at the repo root, regenerated to point
  at `./plugins/<name>`, produced from the per-plugin `plugin.json`s by a small
  script — the one generation step worth keeping, because it kills the
  register-in-two-places drift the template layer was built to prevent.
- **Install is the native Claude CLI, from GitHub.**
  `claude plugin marketplace add virajp/ai-plugins` +
  `claude plugin install <name>@virajp-plugins`. Consequences, each deliberate:
  - Plugin content leaves the npm tarball (~12 MB → the statusline and its
    tools). The committed-tree-validated-by-CI guarantee survives with a new
    channel: what users install is `main`, and `plugins.yml` validates `main` on
    every push.
  - Upgrades are `claude plugin marketplace update` + `claude plugin update`,
    not a re-run of the npm CLI. The Claude version-cache nudge retires — it
    existed to reconcile Claude's cache against a newer npm payload, and there
    is no npm payload.
  - `--all` and the `defaultInstall` list retire. The readme states the two
    commands and notes that installing `vwf` auto-installs `devtools` (native
    Claude dependency behavior, ≥ 2.1.143 — this survives without the CLI).
  - The `requires:` hard install gate and `deps.ts`/`DEP_HINTS` retire. A
    missing binary (`mise`) now surfaces at first use as a `/vwf:doctor`
    **blocking** finding rather than at install time. Accepted trade: doctor
    already blocks `setup` and `execute` on it.
- **The CLI narrows to three jobs**: the **Claude** statusline (consent gating,
  ownership rules, and its receipt unchanged), graphify wiring
  (`graphify install` + `hook install`), and an overhauled `--uninstall`.
  Removed: all four plugin adapters and their install-path receipts, the
  OpenCode TUI statusline plugin and its installer, the Oh-My-Pi statusline
  config surface, and every non-Claude code path in `args.ts`/`index.ts`
  (`--platform` retires). Major version bump of the npm package.
- **`--uninstall` becomes interactive and location-aware.** Today's flag is
  receipt-driven and all-or-nothing per target; the overhaul makes it enumerate
  and let the user choose. It enumerates every piece of toolkit configuration it
  can see from where it runs — user level: the `virajp-plugins` marketplace
  registration, user-scoped plugin installs, the Claude statusline and its
  receipt; repo level, when run inside a repo: project-scoped plugin installs
  and the graphify hook/graph/`.graphifyignore`; **plus anything a legacy
  multi-target receipt describes** (the copied OpenCode plugin tree, the
  OpenCode and Oh-My-Pi statuslines) — and presents the list with everything
  selected, so the user deselects what stays. Removal goes through whatever owns
  each piece: `claude plugin uninstall` / `claude plugin marketplace remove` for
  plugins, receipt-restore for the statusline (prior state comes back, never a
  bare delete), the old receipts for the legacy surfaces. With no TTY it fails
  rather than guesses — the same rule the statusline consent already follows.
  The legacy-receipt reading is the one piece of multi-target code deliberately
  kept, for a release or two, so existing installs migrate cleanly instead of
  being orphaned; it is dropped once that window passes.
- **The statusline self-reports its version, and `--version` reads it.** Today
  the CLI's `--version` prints the running package's own version for the
  statusline line, annotated "bundled with the CLI" — under `pnpx` that is
  whatever was just downloaded, and the version actually installed on disk is
  never shown. The fix puts the version in the artifact rather than in a
  receipt: the statusline script gains a `--version` flag printing a hardcoded
  version constant, the `i:release` bump step rewrites that constant alongside
  `package.json` (bump-time, not build-time — the script is a committed static
  asset, and stamping at build would split committed from published), and
  `i:test` asserts the script's reported version equals `package.json`'s, which
  is what makes a hand-synced second copy safe. The CLI's `--version` then runs
  the installed script with `--version` and prints installed vs bundled;
  installs old enough to lack the flag degrade to "unknown (predates
  self-reporting)". No receipt change. Independent of the retirement — can ship
  as a patch release before the major.
- **Every call to GitHub sends `$GITHUB_API_TOKEN` when set.** The remote
  manifest read (`raw.githubusercontent.com` today, plus whatever the
  GitHub-served marketplace adds) attaches
  `Authorization: Bearer $GITHUB_API_TOKEN` when the variable is present, so
  users behind shared egress stop hitting unauthenticated rate limits; absent
  the variable, behaviour is unchanged and nothing suggests setting it. Only
  when a GitHub call comes back rate-limited — `429`, or GitHub's other
  spelling, `403` with `x-ratelimit-remaining: 0` — does the error message add
  the hint: set `$GITHUB_API_TOKEN` to a read-only (public-repo) token and
  re-run. The npm registry call is not GitHub and stays tokenless. Also
  independent of the retirement — patch-releasable.
- **A slim checker survives.** `plugins:check` collapses to one tree:
  strict-YAML frontmatter, agent cross-reference resolution (both directions),
  intra-marketplace dependency resolution, hook scripts existing and executable,
  the vwf design-adapter and technology-free contracts, relative links under
  `assets/examples/**`, and root-relative reference resolution. Retired with the
  flat targets: cross-plugin skill-name uniqueness, `prefixSkillNames`,
  invocation projection, `it.cmd()` resolution (an Eta construct), the
  no-surviving-template-tags pass, and the Oh-My-Pi `package.json` sort. The
  render-clean gate disappears (nothing renders); the renderer vitest suite goes
  with the renderer.
- **`typescript:test` repoints** to `plugins/typescript/hooks/` — the hook
  scripts are now authored in place rather than copied byte-for-byte from a
  template.
- **readme gains an "other tools" section** with a copy-paste prompt per tool
  family: point your agent at this repo's URL (or one plugin's subdirectory),
  ask it to install/adapt the plugin for your tool, with stated caveats — hooks
  and MCP wiring vary per tool, `invocation: user` semantics may be
  approximated, and the result is the tool's best effort rather than a verified
  install.

## Steps

1. **Promote the render.** Move `claude/plugins/<name>` to `plugins/<name>`,
   verify against the live Claude install, and delete `templates/`, `renderer/`,
   `schema/`, the other three render trees, `.cursor-plugin/`, `plugins.json`,
   and `templates/marketplace.yaml`.
2. **Rebuild the toolchain.** Marketplace-manifest generation script reading the
   per-plugin `plugin.json`s; `plugins:check` rewritten against the single tree;
   `plugins:build` and `plugins:render-clean` retired; `typescript:test`
   repointed; CI (`plugins.yml`) updated. `release.yml`'s trigger surface stays
   untouched (the Trusted Publisher constraint) — it now publishes a much
   smaller package, nothing else changes.
3. **Narrow the CLI.** Remove the four plugin adapters, their install-path
   receipt kinds, the dependency gate, and the OpenCode/Oh-My-Pi statusline
   surfaces; keep the Claude statusline and graphify wiring. Build the
   interactive `--uninstall` (enumerate → deselect → remove via each piece's
   owner), including the legacy-receipt reader for the retired surfaces. Land
   the statusline `--version` flag + release-bump version stamp + the CLI's
   installed-version line, and the `$GITHUB_API_TOKEN` header on GitHub fetches
   (or ship both earlier as a patch release — they do not depend on anything
   else here). Re-verify `package.json`'s `files` list — the tarball is now
   `bin` + `tools/statusline` and must not silently drop something the
   statusline reads at runtime. Update `cli/` tests; `i:test` still smoke-tests
   the built bundle. First live run of `--uninstall` is on the maintainer's
   machine, clearing the OpenCode/Oh-My-Pi statuslines and the copied OpenCode
   tree.
4. **The prompt-install section** in readme, plus per-tool caveats.
5. **Docs reconciliation** — CLAUDE.md's whole templates/targets narrative,
   `docs/cli/*` (the targets page shrinks to one), `docs/plugins/*` install
   sections, and a rewrite of the `plugin-authoring` and `installer-cli` skills
   (the authored-vs-rendered split, the invocation projection, and the
   per-target statusline facts all disappear).
6. **Release** as a major CLI version; GitHub Release notes state the migration
   for any non-Claude installs — plugins: re-install via your tool's prompt
   route or drop to the Claude CLI; statuslines: OpenCode/Oh-My-Pi surfaces are
   discontinued, run `--uninstall` to remove them cleanly (it reads the old
   receipts for a release or two).
7. **Stackgen plan pass** — update
   [2026-08-17-stackgen.md](./2026-08-17-stackgen.md)'s paths and template-layer
   references to the single-tree world before that plan goes for approval.

## What is lost, stated plainly

- **Verified parity.** Prompt-installs are best-effort; nothing here tests what
  Cursor or Codex produces from the prompt. The `target-verifier` agent retires
  with the adapters.
- **The non-Claude statuslines, including the maintainer's own OpenCode TUI
  bar** (restyled as recently as v4.3.2/v4.3.3). They are removed cleanly rather
  than orphaned — `--uninstall`'s legacy-receipt mode is what does it — but the
  surfaces themselves are gone and do not come back.
- **OpenCode specifics.** The copy install, its receipts/uninstall, and the
  `opencode-plugin/*.ts` modules (mempalace autosave, statusline TUI feed) as
  *auto-wired* pieces — the prompt route may or may not reproduce them.
- **Hook projection.** The deny-with-correction hook rewrites for targets that
  cannot rewrite commands were renderer output; other tools get hooks only if
  their agent adapts them from the Claude `hooks.json`.
- **Install-time dependency gating.** A missing required binary is now a runtime
  `/vwf:doctor` blocking finding, not an install refusal with a fix-it hint.

## Risks

- Known non-Claude installs today are effectively the maintainer's own; the
  blast radius of dropping verified support is small, and the prompt route
  remains for everyone else.
- The promote-then-delete step is the point of no return for the template layer;
  it lands as one reviewed commit so `git revert` remains a real escape hatch.
- Serving the marketplace from GitHub means `main` must always be installable.
  `plugins.yml` already validates every push to `main`; the residual risk is the
  window between a bad merge and the red build, same as any git-served
  marketplace.
- The npm tarball shrinks to the statusline; the `files` list re-verification in
  step 3 is what keeps that from silently dropping a runtime asset.
