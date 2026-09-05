# The checks

What `plugins:check` asserts, why each rule cannot be replaced by a type or a
format, and the one generated file that needs a freshness gate of its own.

## The gates

| Task                          | Does                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `plugins:check`               | validates the authored tree; non-zero on any finding                                                                  |
| `plugins:marketplace`         | regenerates both marketplace manifests from the 2 plugin manifests, plus the `.dev-marketplace/plugins/` staging dir  |
| `plugins:marketplace --check` | asserts the committed manifest matches a fresh generation                                                             |
| `plugins:inventory`           | regenerates `plugins/stackgen/stacks/inventory.md` from the stacks tree; `--check` asserts the committed file matches |
| `plugins:shellcheck`          | `shellcheck -x` + `shfmt -d` over every shell file a pack ships — task libraries and `_scripts/*`, then `hooks/*.sh`  |
| `plugins:npm-normalize-test`  | table-tests the pnpm pack's `npm-normalize.sh` through the system sed                                                 |
| `pnpm vitest run`             | the `scripts/` and `installer/` suites                                                                                |

`plugins:marketplace --check`, `plugins:inventory --check` and then
`plugins:check` run in that order — **freshness before validity**, in pre-commit
and in `plugins.yml` alike — so a stale generated file fails as staleness rather
than as a confusing downstream assertion.

`--check` exists because `marketplace.json` is generated **and** committed. That
combination has no other guard — a `plugin.json` edited without a regenerate is
invisible to every other check, and the committed file keeps advertising the old
version. It is the surviving fragment of the retired `plugins:render-clean`,
narrowed to the one file that still has the problem.

## The twelve rules

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
11. **A pack's `config/` payload tier is materializable as-is.** Five
    assertions, every one of them about a file whose failure mode in the
    *target* repo is silence rather than an error:
    - a **task file lands executable**. `config/.config/mise/tasks/**` is a
      *file-based* task library — mise runs each file directly — so one landing
      644 fails as an **unknown task** rather than as a permission error, which
      reads as a pack that never shipped it;
    - and **starts with a known shebang** (`bash`, `node`, `python3`). mise
      execs the file, so a missing or exotic one is an exec-format error at the
      first `mise run`, and the shell gate picks its dialect from the same line;
    - a **hook script** lands executable and shebanged too (`bash` or `sh`, a
      narrower set because a hook is wired into `settings.json` as a bare path).
      Same reasoning from the other end: a hook fault is the quietest fault
      there is, since nothing downstream ever reports that it did not run;
    - the tier's **root stays allowlisted** — `.gitignore`, `.editorconfig`,
      `.gitattributes`, `LICENSE`, `SECURITY.md`, `readme.md`, `CLAUDE.md`,
      `fnox.toml`, `eslint.config.mjs`, `wrangler.jsonc` and a language's
      mandated manifests. Everything else belongs under `.config/`, and a pack
      landing one more dotfile beside them is widening the root of every repo it
      materializes into. `wrangler.jsonc` joined on 2026-09-05 as the same
      exception `eslint.config.mjs` already is: a tool that discovers its config
      only at the repo root leaves a pack a choice between the root file and
      `--config` on every invocation any caller might type, and the flag is the
      worse of the two;
    - a **pre-commit fragment parses** and declares a top-level `repos:` list,
      because `/vwf:init` concatenates the fragments into one config and a
      malformed one breaks a file no pack owns.

    The walk is its own rather than the plugin file reader's, because every one
    of these paths runs through a dot segment the reader's glob does not descend
    into. `plugins:check` is the only reader that sees any of it before it lands
    in someone's repo.
12. **Retired vocabulary stated as live.** The recurrence class of every drift
    sweep: a token is renamed at its source of truth, the lineage records the
    rename, and a dozen other files keep using the old word as if nothing
    happened — nothing fails, because the old word is prose, not a reference. So
    the checker holds a **closed, case-sensitive list** of the retired spellings
    and scans every `.md`, `.yml` and `.yaml` file a plugin ships, line by line.
    It is the only rule that reports a **line number**, because it is the only
    one that fires on a sentence rather than a file. Below.

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

### The retired-vocabulary rule (rule 12)

`RETIRED_TERMS` in `scripts/src/check.ts` is what it matches — each entry a
class of finding the 2026-09-04 sweep found recurring across files, never a
one-off:

| Term                  | Fires on                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| the `web` platform    | backticked `web` on a line that also carries a backticked `mobile`/`tablet`/`desktop`/`auto` or the word "token"     |
| `-ux-gate`            | any `-ux-gate` suffix except the literal `<plugin>-ux-gate`, which only ever appears where the retired form is named |
| `stacks/project/`     | the flat template path vwf no longer ships or describes                                                              |
| `assets/stacks/`      | the template tree vwf no longer ships                                                                                |
| four axes             | "four axes", "four stack axes", "four independent axes", "four menus", "four stack rounds"                           |
| `private_plane`       | the key dropped from both plugins' template shape                                                                    |
| the `devtools` plugin | backticked `devtools` on a line containing "plugin" but not "uninstall" — the one live sentence that must name it    |

The two bare-word terms carry a second test on the whole line on purpose:
backticked `web` is also a perfectly good registry *project* name, which the
worked example uses, and `devtools` has to survive in the uninstall instruction.
Matching is case-sensitive, since `Web` in a sentence is the ordinary word.

**A line is exempt when it marks itself as history.** `RETIRED_LINE_EXEMPT`
matches `retire`, `migrat`, `dissolved`, `moved`, `→`, `pre-22` or `format 2N`
(any digit, either case of F) — stems rather than words, because the migration
notes conjugate freely. It is tested against the **flagged line alone**: a
migration note wrapped over a dozen lines with its marker on the first has to
repeat a marker on whichever line carries the token, a small tax paid so that a
"retired at format 22" sentence never shields a live claim beneath it.

**Two files are exempt whole**, per `RETIRED_FILE_EXEMPT`, because their entire
job is history: vwf's `skills/setup/references/format-lineage.md`, and any
`changelog.md` (case-insensitive) in any plugin. A second plugin growing a
lineage file is a second entry there, not a wider match.

**A hit on genuine history is fixed by the narrowest exemption, never by
deleting the pattern**: say what replaced the term, or add the one marker word
that makes the line read as history. A pattern that goes is a class of drift
that comes back.

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
