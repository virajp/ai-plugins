# The checks

What `plugins:check` asserts, why each rule cannot be replaced by a type or a
format, and the one generated file that needs a freshness gate of its own.

## The two tasks

| Task                          | Does                                                                      |
| ----------------------------- | ------------------------------------------------------------------------- |
| `plugins:check`               | validates the authored tree; non-zero on any finding                      |
| `plugins:marketplace`         | regenerates `.claude-plugin/marketplace.json` from the 2 plugin manifests |
| `plugins:marketplace --check` | asserts the committed manifest matches a fresh generation                 |
| `plugins:npm-normalize-test`  | table-tests the pnpm pack's `npm-normalize.sh` through the system sed     |
| `pnpm vitest run`             | the `scripts/` and `installer/` suites                                    |

Both `plugins:check` and the `--check` mode run in pre-commit and in
`plugins.yml`, in that order: **freshness before validity**, so a stale manifest
fails as staleness rather than as a confusing downstream assertion.

`--check` exists because `marketplace.json` is generated **and** committed. That
combination has no other guard — a `plugin.json` edited without a regenerate is
invisible to every other check, and the committed file keeps advertising the old
version. It is the surviving fragment of the retired `plugins:render-clean`,
narrowed to the one file that still has the problem.

## The eleven rules

Each is something no format and no type can state. The checker is deliberately
much smaller than the one it replaced: whole families of assertion became
*unrepresentable* rather than merely unchecked.

1. **Manifest name ↔ directory.** A plugin whose `name` disagrees with its
   directory installs under one and is referenced by the other.
2. **Dependency resolution.** Every `dependencies[].name` resolves to a plugin
   in this marketplace, with `"marketplace": "virajp-plugins"`. The marketplace
   entry is generated from the manifest, so the two can no longer disagree —
   what is left to check is that the name points at something.
3. **Hook scripts exist and are executable.** A `hooks.json` naming a script
   that is missing or non-executable fails at hook time, in a context with
   nowhere good to report it.
4. **Strict-YAML frontmatter.** Claude's parser is lenient and accepts what a
   strict parser rejects — and **a rejected skill is dropped silently**. This is
   the highest-value rule in the file.
5. **Example-bundle links.** Relative links under
   `plugins/vwf/assets/examples/**` resolve. That bundle is the worked "what
   good looks like" for a blueprint, so a broken link there teaches the wrong
   shape.
6. **Root-relative reference resolution.** Every root-relative reference in a
   plugin's prose resolves inside **that** plugin. See the trap below.
7. **Agent cross-references, both directions.** Every role-shaped `` `token` ``
   in a plugin's prose names a real agent of that plugin, and every declared
   agent is referenced at least once. Either direction alone misses a rename.
8. **The vwf design-adapter contract.** Every `design-tool` pack ships all three
   `design-import-*` skills, model-invocable. The checker discovers packs from
   `stacks/design-tool/<tool>/pack.yaml`, so adding a tool extends the rule
   without touching it — see stackgen's
   [artifact doctrine](../../../../plugins/stackgen/assets/artifact-doctrine.md)
   §2 for why a user-only adapter skill is worse than a missing one.
9. **The vwf stack-adapter contract, in both directions.** Every plugin
   keyworded `vwf-stack-adapter` ships `<plugin>-stack-menu` and
   `<plugin>-stack-template`, both model-invocable — **and** every plugin
   shipping either of those skills declares the keyword. Same failure as rule 8
   on the other constructed name: vwf never reads an adapter name from config,
   so a skill the model cannot see yields an **empty menu** rather than an error
   — and because the stack menu is closed, that silently removes every option
   the plugin was the only source of.

   The converse direction is what keeps the rule alive. With `stackgen` the only
   adapter left, deleting that one keyword would have switched the whole rule
   off while `check()` still passed green. Now: drop the keyword and the skills
   still fire it; drop a skill and the keyword still fires it. Only removing the
   keyword *and* both skills clears it, which is a deliberate, visible
   retirement rather than an accident. It is the same
   two-directions-cover-each-other-on-a-rename idiom rule 7 uses for agent
   cross-references.
10. **The technology-free vwf guard.** Below.
11. **Pack task files are executable.** Every file a stackgen pack ships under
    `config/.config/mise/tasks/**` carries its exec bit. That tree is a
    *file-based* task library — mise runs each file directly — so one landing
    644 fails as an **unknown task** rather than as a permission error, which
    reads as a pack that never shipped it. The walk is its own rather than the
    plugin file reader's, because every one of these paths runs through a dot
    segment the reader's glob does not descend into. `plugins:check` is the only
    reader that sees the bit before it lands in someone's repo.

### The plugin-root trap (rule 6)

`${CLAUDE_PLUGIN_ROOT}` resolves to **the plugin the file lives in**, and
nothing spells another plugin's root. So a reference to an asset a different
plugin owns resolves to nothing at runtime, silently.

This is not hypothetical. `plugins/typescript/stacks/deploy/npm-package.md`
pointed at `assets/delivery-pipeline.md`, which only vwf has. The template
spelled it with the own-plugin token, so it shipped broken in **all four**
render trees and no per-target check caught it, for months. The fix is to name
the contract and rely on the caller having it — vwf is what fetches those
conventions, and vwf owns the file.

### The technology-free guard (rule 10)

`TOOL_TOKENS` bans vwf prose from naming a concrete technology, **but only where
the mention prescribes**. An occurrence is exempt when another token of the same
vocabulary sits within 100 characters — listing the alternatives describes the
domain of a config key vwf owns, rather than recommending one. Fenced blocks are
stripped first, since a config example must show real values. The window is
character-based because every real enumeration in the corpus wraps mid-list.

The anchors are **asymmetric on purpose**: a banned token heading a hyphenated
compound is a hit (`grafana-side`, `npm-package`, `docker-compose`), one sitting
at the tail is not (`pnpm-workspace` is not an `npm` mention). The symmetric
form this started as let every compound head through — two escapes shipped in
vwf before it was tightened.

The MCP-server rule was **generalized at Wave D**. It used to match only
`mcp__plugin_design-tools_<token>`, the plugin-scoped prefix — but a design tool
now lands in the project's own `.mcp.json`, which scopes its server
`mcp__<token>__` instead, so matching the old prefix alone would have quietly
stopped catching anything. Both spellings are banned in vwf prose, which covers
a fourth design tool the day one is added.

**The manifest half is a different bar, on purpose.** The guard also reads vwf's
`mcpServers` `command`/`args` as one string per stdio server (an `http` server
has no runner in it to hardcode). A manifest has to name something executable —
`sh` is a tool name too — so the bar is not "names no tool" but **"the name is
overridable"**: `${VAR}` and `${VAR:-default}` expansions are elided before the
token scan, so a runner behind one passes and a fixed one is a finding. It was
added after `"command": "pnpm"` sat unnoticed in the context7 entry, which a bun
user cannot satisfy and which fails as a dead MCP server rather than as a
missing prerequisite; `${CONTEXT7_RUNNER:-pnpm dlx}` keeps pnpm as the
recommendation while letting another runner answer.

**Two design tokens are deliberately unbannable** and live in
`ENUMERATION_PEERS` instead — `stitch` (an ordinary English word the screens
doctrine leans on) and `lovable` (an ordinary adjective). They prove an
enumeration without being policed. The evidence set is wider than the
prohibition set on purpose.

## What retired, and why it is not a regression

Deleting these was the point of the cutover. They described mechanisms that no
longer exist:

| Rule                               | Went with                                         |
| ---------------------------------- | ------------------------------------------------- |
| cross-plugin skill-name uniqueness | the flat namespaces (Claude scopes per plugin)    |
| `prefixSkillNames`                 | the same                                          |
| invocation projection              | the neutral three-valued key                      |
| `it.cmd()` target resolution       | Eta                                               |
| no-surviving-template-tags         | Eta                                               |
| the Oh-My-Pi `package.json` sort   | the Oh-My-Pi render                               |
| the per-target coverage report     | having targets to compare                         |
| vwf declares no `languages`        | the neutral manifest key (folded into `keywords`) |

## Formatting

dprint excludes `plugins/**/*.md`. Match the existing fold width by hand.

The exclusion has **outlived its original reason** — it existed because Eta
expressions are wider than what they render to, so formatting either side broke
the other. Nothing renders now. It stays because reformatting roughly 2000
authored prose files is a decision to take deliberately, not a side effect of
this migration.

`CLAUDE.md` and `readme.md` **are** formatted, so widening one table cell
re-pads every row of that table.
