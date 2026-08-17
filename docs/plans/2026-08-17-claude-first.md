# Plan: Claude-first — retire the renderer and the multi-target trees

**Status: proposed — awaiting approval. Nothing in this plan is built.**

**Sequencing: this lands before the stackgen plan
([2026-08-17-stackgen.md](./2026-08-17-stackgen.md)) is implemented** — every
plugin stackgen would touch gets simpler once there is one authored tree instead
of a template layer and four renders.

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

## End state

- **One authored tree.** The current `claude/plugins/*` render (already valid,
  Eta-resolved Claude plugins) is promoted to the authored source. No
  `templates/`, no Eta tags, no `renderer/`. Skills say `/vwf:plan` directly.
- **`cursor/`, `ohmypi/`, `opencode/` trees and `.cursor-plugin/` are deleted.**
  `.claude-plugin/marketplace.json` stays, generated from the plugin manifests
  by a small script (the one generation step worth keeping — it kills the
  register-in-two-places drift the template layer was built to prevent).
- **A slim checker survives.** `plugins:check`'s per-tree assertions collapse to
  one tree: strict-YAML frontmatter, agent cross-reference resolution,
  skill-name checks, link resolution, the vwf contract checks. The render-clean
  gate disappears (nothing renders); the vitest renderer suite goes with the
  renderer, the schema suite shrinks to manifest validation.
- **The CLI narrows.** `@askviraj/ai-plugins` keeps the Claude adapter
  (marketplace registration, the version-cache nudge), graphify wiring, and
  **all three statusline surfaces** (the statusline never depended on the
  renderer — OpenCode/Oh-My-Pi statusline users lose nothing). The Cursor,
  OpenCode, and Oh-My-Pi *plugin* adapters and their receipts are removed. Major
  version bump of the npm package.
- **readme gains an "other tools" section** with a copy-paste prompt per tool
  family: point your agent at this repo's URL (or one plugin's subdirectory),
  ask it to install/adapt the plugin for your tool, with stated caveats — hooks
  and MCP wiring vary per tool, `invocation: user` semantics may be
  approximated, and the result is the tool's best effort rather than a verified
  install.

## Steps

1. **Promote the render.** Move `claude/plugins/<name>` to the new authored
   location (proposal: top-level `plugins/<name>/` — approvable), verify it
   against the live Claude install, and delete `templates/`, `renderer/`, the
   three other render trees, and `.cursor-plugin/`.
2. **Rebuild the toolchain.** Marketplace-manifest generation script;
   `plugins:check` rewritten against the single tree; `plugins:build` and
   `plugins:render-clean` retired; CI (`plugins.yml`) updated. `release.yml`'s
   trigger surface stays untouched (the Trusted Publisher constraint).
3. **Narrow the CLI.** Remove the three plugin adapters + their receipt paths;
   keep Claude, graphify, statusline. Update `cli/` tests; `i:test` still
   smoke-tests the built bundle.
4. **The prompt-install section** in readme, plus per-tool caveats.
5. **Docs reconciliation** — CLAUDE.md's whole templates/targets narrative,
   `docs/cli/*`, `docs/plugins/*` install sections, and a rewrite of the
   `plugin-authoring` and `installer-cli` skills (the four traps shrink to two;
   the authored-vs-rendered split disappears).
6. **Release** as a major CLI version; GitHub Release notes state the migration
   for any non-Claude installs.

## What is lost, stated plainly

- **Verified parity.** Prompt-installs are best-effort; nothing here tests what
  Cursor or Codex produces from the prompt. The `target-verifier` agent retires
  with the adapters.
- **OpenCode specifics.** The copy install, its receipts/uninstall, and the
  `opencode-plugin/*.ts` modules (mempalace autosave, statusline TUI feed) as
  *auto-wired* pieces — the prompt route may or may not reproduce them. The
  statusline TUI plugin itself stays available via the CLI.
- **Hook projection.** The deny-with-correction hook rewrites for targets that
  cannot rewrite commands were renderer output; other tools get hooks only if
  their agent adapts them from the Claude `hooks.json`.

## Risks

- Known non-Claude installs today are effectively the maintainer's own; the
  blast radius of dropping verified support is small, and the prompt route
  remains for everyone else.
- The promote-then-delete step is the point of no return for the template layer;
  it lands as one reviewed commit so `git revert` remains a real escape hatch.
- The npm tarball shrinks (~12 MB → one tree); the packaging list in
  `package.json` must be re-verified so nothing the CLI reads at runtime
  (`plugins.json`, the marketplace manifest) is dropped by accident.
