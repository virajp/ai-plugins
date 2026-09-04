# Repo shape

How this repo is laid out, what generates what, the mise tasks that validate it,
and the traps that bite. Linked from [`CLAUDE.md`](../../CLAUDE.md); read it
when you need more than the one-line summary there.

## One authored tree

Plugins are **authored natively for Claude Code**, once, and installed by
Claude's own plugin commands. What you edit is exactly what a user gets. The
tree diagram is [`CLAUDE.md`](../../CLAUDE.md)'s and is not repeated here.

**Two files are generated**, both projections of the same 2 plugin manifests and
differing in exactly one field per entry — `source`. Only the **published** one
is committed, so what users install is inspectable and diffable;
`plugins:marketplace --check` asserts it matches a fresh generation.

`.claude-plugin/marketplace.json` is the **published** one, and it lives at the
repo **root** because that is where Claude looks when this repo is added as a
marketplace. Every `source` is a `git-subdir` fetch pinned to a per-plugin tag,
which is what lets unreleased work sit on `develop`.

`.dev-marketplace/.claude-plugin/marketplace.json` is **local authoring only**,
**gitignored**, and never published. Every `source` is a repo-relative
`./plugins/<name>`, resolved into the `.dev-marketplace/plugins/` staging
directory the same run creates and `plugins:local` fills with `X.Y.Z+N` copies,
so the authoring machine runs the working tree rather than the last release. It
exists because this repo ships a workflow plugin whose author could not
otherwise run the unreleased version of it.

**It is gitignored rather than committed**, which was the reverse of the plan's
D1. Committing it would buy a fresh clone one command, at the price of a second
file in the tree declaring the marketplace name `virajp-plugins` on the branch
users read — a footgun that outweighs the convenience, since regenerating is
`mise run plugins:marketplace`. The consequence is that `--check` has to tell
**absent** (normal in CI and in a fresh clone) apart from **present but stale**
(a real bug on a machine that uses it), which is what `MANIFESTS`'s `tracked`
flag is for.

Three things make that design forced rather than chosen, each probed against the
real `claude` CLI:

- **A path inside the marketplace root is the only way in.** An absolute path, a
  `{"source": "directory"|"local", "path": …}` object and a parent-relative
  `../plugins/<name>` are each rejected with `source: Invalid input`. A
  repo-relative path that stays inside the marketplace root is the one accepted
  form, so the plugins have to be reachable from within `.dev-marketplace/` —
  and as **staged copies**, not a symlink to the tree: for a directory source
  Claude reads the plugin's own `plugin.json` version and ignores the entry's,
  and `update` compares versions only, so a copy is the only place the `X.Y.Z+N`
  it needs to see can be written without touching the tracked manifest.
- **Both manifests carry the same marketplace `name`.** A plugin's
  `dependencies` edge names its marketplace by name, so vwf installed from a
  differently-named dev marketplace would send its `stackgen` edge back to the
  tagged marketplace and fail on a tag that does not exist yet. The consequence
  — one registered at a time, never both — is a feature, not a limitation.
- **A `ref: develop` variant also works** and needs no staging, but it serves
  *pushed* develop. The failure being fixed is "I cannot run what I just
  changed", so the working-tree form won. It stays the fallback if staging ever
  costs more than it does today.

Note the three neighbours that read confusingly: `.claude-plugin/` is the
published manifest, `.dev-marketplace/` is the local one, and `.claude/` is this
repo's own skills, docs, agents and worktrees. None of them is `plugins/`.

Setup and the refresh loop — `mise run plugins:local`, and the three measured
CLI facts that shape it — are [`dev-marketplace.md`](dev-marketplace.md).

> **Authoring one:** the twelve checker rules, the invocation frontmatter, the
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
> packaging traps are in `installer/CLAUDE.md`, which Claude loads whenever it
> works under `installer/`.

## Tasks

Run in `plugins.yml`, the first four also locally via pre-commit, with
marketplace, inventory and check in that order — freshness before validity
(never in `release.yml`, which is the installer's and whose trigger surface must
stay untouched — npm allows one Trusted Publisher and validates the entry-point
filename — and never in `site.yml`, which runs the website's own gate):

- **`plugins:marketplace`** — generates **both** marketplace manifests from the
  2 `plugins/*/.claude-plugin/plugin.json` manifests, mapping `keywords` →
  `tags` and supplying what no manifest holds: the marketplace header, and the
  per-entry `category`, `strict` and `source`. It also creates the
  `.dev-marketplace/plugins/` staging directory the dev sources resolve into.
  **`--check`** regenerates both in memory and fails if the committed published
  file differs, or if a dev manifest that **exists** is stale or its staging
  path is the retired symlink. An absent `.dev-marketplace/` is reported as not
  applicable, since it is gitignored and CI never has one. That mode is the only
  guard on a file that is generated **and** committed — a manifest edited
  without a regenerate is invisible to every other check, and the committed
  manifest keeps advertising the old version. It is what `plugins:render-clean`
  narrowed down to. **There is no `--dev` flag**: both are written together
  because a flag is one more thing to forget, and a stale dev manifest fails as
  a plugin quietly serving yesterday's tree.
- **`plugins:inventory`** — generates `plugins/stackgen/stacks/inventory.md`
  from the stacks tree: every `<type>/<slug>/pack.yaml`, every bundle
  frontmatter, and the kind headings in `assets/kinds.md`. It exists because the
  pack, bundle and kind counts were typed into four prose files and drifted; the
  tree is the only inventory true by construction. It throws on a `kind` no
  heading defines, since the vocabulary is closed. **`--check`** is the same
  byte compare the marketplace task makes, run by pre-commit and `plugins.yml`,
  and `inventory.test.ts` pins it in vitest too.
- **`plugins:check`** — validates the authored tree. Twelve rules: manifest
  name↔dir; dependencies resolving within the marketplace; hook scripts existing
  and executable; **pack task files executable** (every file a stackgen pack
  ships under `config/.config/mise/tasks/**` carries its exec bit, because mise
  reports a 644 task as an *unknown* one rather than a permission error);
  **strict-YAML frontmatter**; relative links under `assets/examples/**`;
  **root-relative reference resolution** (every such reference resolves inside
  the plugin that wrote it); **agent cross-reference resolution** in both
  directions (every role-shaped `` `token` `` in a plugin's own prose names a
  real agent, and every declared agent is referenced at least once — the two
  directions cover each other on a rename); the vwf design-adapter contract (all
  **three** import skills present and model-invocable); the vwf
  **stack-adapter** contract (both `<plugin>-stack-menu` and
  `<plugin>-stack-template` present and model-invocable on every plugin
  keyworded `vwf-stack-adapter`, **and** the keyword declared by every plugin
  shipping either skill — the same two-directions-cover-each-other idiom, since
  `stackgen` is now the only adapter left and dropping that one keyword would
  otherwise have turned the rule off entirely while `check()` still passed); the
  **technology-free vwf** guard; and **retired vocabulary stated as live** (a
  closed list of spellings the corpus stopped meaning, flagged per line and
  exempt on a line that marks itself as history — the only rule that reports a
  line number).

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
- **`vitest run`** — the `scripts/` and `installer/` suites.
- **`tsc --noEmit`** per TypeScript project — `installer/` and `scripts/`.
  Nothing emits, so `tsc` is only ever a checker, and there are no project
  references to walk.
- **`site:*`** — the website's family, all under `.config/mise/tasks/site/` and
  all run from `site/`: `site:dev` (the Astro dev server), `site:build`
  (`astro build` then `pagefind --site dist`), `site:check` (the gate:
  `astro check`, `site:build`, then `scripts/check-links.ts` over
  `dist/**/*.html`, asserting every internal href resolves to a built file and
  every `#fragment` to an id in its target), `site:version` (bumps
  `site/package.json`, no tag) and `site:release` (tags `site-v<version>` from
  `main` and watches `site.yml`). None of them runs in `plugins.yml` or in
  pre-commit — `site.yml` owns them.

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
