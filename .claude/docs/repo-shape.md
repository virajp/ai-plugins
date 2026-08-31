# Repo shape

How this repo is laid out, what generates what, the mise tasks that validate it,
and the traps that bite. Linked from [`CLAUDE.md`](../../CLAUDE.md); read it
when you need more than the one-line summary there.

## One authored tree

Plugins are **authored natively for Claude Code**, once, and installed by
Claude's own plugin commands. What you edit is exactly what a user gets. The
tree diagram is [`CLAUDE.md`](../../CLAUDE.md)'s and is not repeated here.

**One file is generated**: the marketplace manifest, a projection of the 3
plugin manifests. It lives at the repo **root**, not under `plugins/`, because
that is where Claude looks when this repo is added as a marketplace. It is
committed so what users install is inspectable and diffable, and
`plugins:marketplace --check` asserts it matches a fresh generation.

Note the two neighbours that read confusingly: `.claude-plugin/` is that
generated manifest, while `.claude/` is this repo's own skills, docs, agents and
worktrees. Neither is `plugins/`.

> **Authoring one:** the ten checker rules, the invocation frontmatter, the
> plugin-root trap and the dprint exclusion live in
> `.claude/skills/plugin-authoring/`, which auto-applies while you edit
> `plugins/`.

**This replaced a template layer and four render trees**, and the shape of what
went is worth knowing, because a fair amount of this file used to describe it.
Plugins were authored target-agnostically in `templates/` with Eta helpers, a
`renderer/` package rendered them into committed `claude/`, `cursor/`, `ohmypi/`
and `opencode/` trees, `schema/` held the neutral contract, and the CLI
installed from those trees through four adapters. It was the repo's single
largest complexity bill, paid for support that was limited anyway — the coverage
report conceded 17–18 dropped and 20–30 degraded features on the flat targets
every build. Other agents are now served by
[a documented prompt](../../readme.md), not a bespoke render. Do not reconstruct
any of it from this paragraph; git has it.

## Installing, and the receipts nothing writes

The CLI installs plugins as a **thin wrapper** — `--all` / `--user <name>` /
`--project <name>` drive `claude plugin marketplace add` and
`claude plugin install`, reading the manifest on this repo's `main` (which then
pins each plugin to its own tag), and Claude's own commands work just as well
directly. It also wires graphify, and removes whatever the toolkit put on the
machine.

**Nothing it does writes a receipt.** Both install paths belong to another tool
— `claude` for plugins, `graphify` for its own wiring — and each keeps its own
records, which is what `--uninstall` reads live.

What survives is the **reader**, and it is load-bearing rather than vestigial: a
machine that installed an earlier version still carries receipts recording what
was there *before* that install, and `--uninstall` replays them so the user gets
their own state back rather than a deletion. What it can still meet are the
retired render targets' receipts — `claude.json`, `cursor.json`, `ohmypi.json`
and `opencode.json` among them. Nothing this CLI does adds to that pile, and
**it deletes only what it wrote** — which, since it writes nothing, means it
deletes nothing a receipt or another tool does not account for.

> **Working on it:** the receipt entry kinds, the interactive uninstall and the
> packaging traps are in `.claude/skills/installer-cli/`, which auto-applies
> while you edit `cli/`.

## Tasks

Run locally via pre-commit **and** in `plugins.yml` (never in `release.yml`,
which is the installer's and whose trigger surface must stay untouched — npm
allows one Trusted Publisher and validates the entry-point filename):

- **`plugins:marketplace`** — generates `.claude-plugin/marketplace.json` from
  the 3 `plugins/*/.claude-plugin/plugin.json` manifests, mapping `keywords` →
  `tags` and supplying what no manifest holds: the marketplace header, and the
  per-entry `category`, `strict` and `source`. **`--check`** regenerates in
  memory and fails if the committed file differs. That mode is the only guard on
  a file that is generated **and** committed — a manifest edited without a
  regenerate is invisible to every other check, and the committed manifest keeps
  advertising the old version. It is what `plugins:render-clean` narrowed down
  to.
- **`plugins:check`** — validates the authored tree. Ten rules: manifest
  name↔dir; dependencies resolving within the marketplace; hook scripts existing
  and executable; **strict-YAML frontmatter**; relative links under
  `assets/examples/**`; **root-relative reference resolution** (every such
  reference resolves inside the plugin that wrote it); **agent cross-reference
  resolution** in both directions (every role-shaped `` `token` `` in a plugin's
  own prose names a real agent, and every declared agent is referenced at least
  once — the two directions cover each other on a rename); the vwf
  design-adapter contract (all **three** import skills present and
  model-invocable); the vwf **stack-adapter** contract (both
  `<plugin>-stack-menu` and `<plugin>-stack-template` present and
  model-invocable on every plugin keyworded `vwf-stack-adapter`, **and** the
  keyword declared by every plugin shipping either skill — the same
  two-directions-cover-each-other idiom, since `stackgen` is now the only
  adapter left and dropping that one keyword would otherwise have turned the
  rule off entirely while `check()` still passed); and the **technology-free
  vwf** guard.

  Two of those are worth the extra sentence. The technology-free guard bans vwf
  naming a concrete technology **only where the mention prescribes**, which is
  subtler than it sounds — and it reads the manifest's `mcpServers` invocations
  beside the prose, where the bar is not "names no tool" (a manifest must name
  something executable) but that the runner is **overridable**. And the
  plugin-root rule caught a defect that had shipped in all four render trees for
  months: `${CLAUDE_PLUGIN_ROOT}` names only its *own* plugin, so `typescript`
  pointing at vwf's `delivery-pipeline.md` resolved to nothing at runtime. Both
  are in `.claude/skills/plugin-authoring/references/checks.md`, along with the
  eight rules that retired.
- **`plugins:npm-normalize-test`** — table-tests the `npm-normalize.sh` hook
  through the system sed (the BSD-sed portability guarantee), for **both**
  package managers: each table runs in a temp dir seeded with the lockfile that
  selects pnpm or bun, so resolution is exercised alongside the rewrite. It runs
  against `plugins/stackgen/stacks/package-manager/pnpm/hooks/`, which is both
  the source and what the pack copies into a target repo. The hook lives with
  the **package manager** it rewrites for, not in `vwf`: a JS/TS rewrite has no
  business in a language-agnostic workflow plugin.
- **`vitest run`** — the `scripts/` and `cli/` suites.
- **`tsc --noEmit`** per TypeScript project — `cli/` and `scripts/`. Nothing
  emits, so `tsc` is only ever a checker, and there are no project references to
  walk.

`plugins:check` is deliberately much smaller than the checker it replaced, and
smaller again than the Python task before that. Whole families of assertion
became *unrepresentable* rather than merely unchecked — the two dependency lists
kept identical by hand, marketplace registration in both directions, skill
`name:`/`description:`/`model:` shape, and everything that existed to compare
four render trees. What remains is what no format and no type can state.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

The traps — the committed manifest vs the gitignored bundles, which markdown
dprint formats, and the authoring traps — are in [`CLAUDE.md`](../../CLAUDE.md)
and the `plugin-authoring` skill.
