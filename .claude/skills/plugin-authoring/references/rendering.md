# Rendering

How `templates/` becomes four trees, and what may and may not vary between them.

## The pipeline

```text
templates/<plugin>/        authored source — plugin.yaml + skills/ + agents/
  ↓  build/src/            TypeScript, no build step (node strips the types)
claude/plugins/**          committed, one tree per target
{opencode,cursor,ohmypi}/**
plugins.json               the target-agnostic index the installer CLI reads
.claude-plugin/marketplace.json    generated, at the repo root
.cursor-plugin/marketplace.json    likewise
```

A **Target** (`build/src/targets/`) is build-time and pure: templates → the
render tree. An **Adapter** (`cli/src/adapters/`) is install-time and effectful:
that tree → the user's machine. Keep them apart — format-preserving config
mutation belongs in the adapter, never in a target.

## The Eta helpers

Prose is authored once and spelled per target through helpers, never through
per-target conditionals:

| Helper                        | Use for                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `<%= it.root %>`              | the plugin root, for an asset path                             |
| `<%= it.cmd('vwf:plan') %>`   | an **invocation** — `/vwf:plan`, `vwf-plan`, `/skill:vwf-plan` |
| `<%= it.skillName('plan') %>` | a **location** — a skill directory inside an `it.root` path    |

A link into a skill's own `references/` is plain relative (`references/x.md`)
and needs no helper — it is correct on every target.

Both helpers route through `flatSkillName` in `build/src/target.ts`, which is
the single point where the three things that must agree — the directory, the
frontmatter `name:`, and every cross-reference — are kept in sync.

**Eta configuration is load-bearing.** `autoEscape: false` and
`autoTrim: false`, both. `autoTrim` strips the newline adjacent to a tag, which
silently reflows a folded YAML scalar: the same text, different bytes, and a
frontmatter block that no longer round-trips.

## Frontmatter is re-emitted verbatim

Frontmatter is modelled as ordered `(key, raw)` pairs and emitted byte for byte
— never round-tripped through a YAML serialiser. The corpus uses nine key orders
and folds descriptions at irregular widths, and normalising them would churn
every rendered file. `schema/src/frontmatter.test.ts` proves
`emit(parse(x)) === x` over every authored document; that property is the
successor to the retired byte-parity gate, and the part of it that generalised.

It must also be **strict-YAML valid**. Claude's parser is lenient and accepts
what a strict parser rejects — and a rejected skill is dropped silently, with no
error and no warning.

## What `plugins:check` asserts

On the source:

- manifest name ↔ directory, and dependencies resolving within the marketplace
- hook scripts existing and executable
- **agent cross-references**, both directions — every role-shaped `` `token` ``
  in a plugin's prose names a real agent, and every declared agent is referenced
  at least once (either direction alone misses a rename)
- cross-plugin skill-name uniqueness (skills share one flat namespace on
  OpenCode and Oh-My-Pi)
- the vwf design-adapter contract: all three import skills present and
  `invocation: both`
- the **technology-free vwf** guard
- relative links under `assets/examples/**`, and strict-YAML frontmatter

On each rendered target: no surviving template tags, strict-YAML frontmatter,
and every root-relative reference resolving to something actually emitted.

### The technology-free guard

`TOOL_TOKENS` bans vwf prose from naming a concrete technology, **but only where
the mention prescribes**. An occurrence is exempt when another token of the same
vocabulary sits within 100 characters — listing the alternatives describes the
domain of a config key vwf owns rather than recommending one. Fenced blocks are
stripped first, since a config example must show real values. The window is
character-based because every real enumeration in the corpus wraps mid-list.

`mcp__plugin_design-tools_` is banned outright in vwf prose: it names no tool,
so it covers a fourth design tool the day one is added.

**Two design tokens are deliberately unbannable** and live in
`ENUMERATION_PEERS` instead — `stitch` (an ordinary English word the screens
doctrine leans on) and `lovable` (an ordinary adjective). They prove an
enumeration without being policed. The evidence set is wider than the
prohibition set on purpose.

## Formatting

dprint excludes `templates/**/*.md`, all four rendered trees, and
`plugins.json`. It re-wraps markdown, and Eta expressions are wider than what
they render to — formatting a template mis-wraps the output, and formatting the
output makes it differ from a fresh render. Match the existing fold width by
hand.

`CLAUDE.md` and `readme.md` **are** formatted, so widening one table cell
re-pads every row of that table.

## Related tasks

| Task                   | Does                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `plugins:build`        | renders every target; removes each target dir first, then sorts the Oh-My-Pi `package.json` files |
| `plugins:render-clean` | runs the **task** (not the renderer) and fails on anything unstaged                               |
| `plugins:check`        | source + rendered validation, then the per-target coverage report                                 |
| `typescript:test`      | table-tests the `npm-normalize.sh` hook through the system sed                                    |
| `pnpm vitest run`      | the schema, renderer and checker suites                                                           |

`plugins:render-clean` calls the task rather than the renderer because rendering
stopped being the whole pipeline when the `package.json` sort was added —
invoking the renderer directly would fail on the sort every time.
