---
name: stackgen-plugin
description: The stackgen plugin's own shape — the dispatch rule, the pack and
  bundle model, the kind vocabulary, where a materialization lands and the
  consent tiers around it, the two scripts it ships as pack payloads, and the
  one contract vwf holds it to. Auto-applies when editing anything under
  plugins/stackgen/.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/stackgen/**"
---

# The stackgen Plugin

`stackgen` is the **principles-driven stack materializer** and the only stack
plugin left — vwf's one dependency. It implements vwf's stack-adapter contract:
`skills/stackgen-stack-menu` returns the stack options as a vwf menu payload,
`skills/stackgen-stack-template` returns one stack as a template payload, and
both are called by `/vwf:architecture`, `/vwf:setup`, `/vwf:plan` and
`/vwf:execute` rather than by users. `skills/stackgen-sync` is the one user-only
skill: the explicit, lockfile-diffed re-sync. Since `devtools` dissolved into
it, stackgen also carries the repo's own toolchain manager and gate doctrine as
packs.

**Each asset is authoritative for its own subject.** This file is a map; do not
restate a count or a rule that an asset below already owns.

| Read                          | For                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `assets/taxonomy.md`          | the closed component **types** and **categories**; capability tokens stay vwf's             |
| `assets/kinds.md`             | the **kind vocabulary** — each kind a closed topic bar, one artifact per topic              |
| `assets/pack-format.md`       | the shape of a pack: `<type>/<slug>/pack.yaml` + prose + optional skills/agents/`config/`   |
| `assets/output-tree.md`       | where a materialization lands, the lockfile, the three targets outside `.claude/`           |
| `assets/artifact-doctrine.md` | the **host rules** deciding whether a generated skill, agent or hook is valid at all        |
| `assets/contracts/`           | the provider-neutral doctrine per capability or kind that instance packs cite and stay thin |
| `stacks/inventory.md`         | **generated** — every pack, bundle and kind with counts; `mise run plugins:inventory`       |
| `stacks/readme.md`            | the narrative — which wave landed what, and why                                             |
| `agents/`                     | `stackgen-skill-reviewer`, the generator's gate                                             |

The user-facing reference is `site/src/content/docs/plugins/stackgen.md`. The
checker rules, the two mise gates and the authoring traps are the sibling
`plugin-authoring` skill, which also applies here.

## The dispatch rule

A **component** is the atom (a language, its package manager, a framework, a
gate, a datastore instance, a cloud service); a **bundle** is a recorded
composition of component refs — never a directory. Given a bundle a project
pins, stackgen resolves its composition and dispatches **per component**:

1. A component a shipped **pack** covers is **copied verbatim** from `stacks/`.
2. An uncovered component is **generated**: resolve the kind and its topic bar →
   detect the real stack → one Context7 research pass per topic → instantiate
   vwf's principles catalog with citations → the `stackgen-skill-reviewer` gate,
   capped at **four rounds**, after which residuals are reported rather than
   looped. Context7 unreachable → **halt, never guess**.

Mixed compositions are the ordinary case, with one consent and one landing per
bundle, so a later re-sync can act on one component alone. Packs are **assets,
not live skills** — installing stackgen floods no session with every stack's
doctrine.

`mise`, `repo-gates` and `repo-hygiene` are **unconditional** bundles: left out
of the menu payload and fetched by `/vwf:init` at their fixed slugs, because a
repo that has picked no stack still has to run its gates by name. `/vwf:setup`
no longer fetches them — it checks the adapter's lockfile for all three and
offers `/vwf:init` when one is missing.

## Where it lands, and the consent tiers

Both paths land **directly in the repo's committed `.claude/` tree** — output
closed to skills, agents, hooks and rules — recorded per component in
`.claude/stackgen/lock.yaml`. Three targets sit outside it, each **merging,
never owning**, removed only by subtraction of the keys the lockfile recorded:

- the project's own `.mcp.json`;
- a generated **local plugin** at the fixed path
  `~/.claude/plugins/local/stackgen-lsp/`, which exists because `lspServers` is
  a manifest-only feature no project file can express — the one way to provide a
  language server is to *be* a plugin. User scope is safe because every
  generated `lspServers` entry **must** carry an `extensionToLanguage` map;
- a pack's own **`config/` tree**, mirroring the repo root, for the repo config
  a component genuinely owns — **mode preserved**, so a task file lands 755. Six
  kinds of entry: **(a)** the toolchain manager's own config and its task
  library (`.config/mise*.toml`, `.config/mise/tasks/**`); **(b)** a gate's own
  config (`.config/dprint.json`, `.config/pre-commit-config.yaml`,
  `.config/gitleaks.toml`, `.config/grype.yaml`, …); **(c)** the hygiene files
  (`.gitignore`, `.editorconfig`, `.gitattributes`, `SECURITY.md`,
  `.config/renovate.json`, the licence texts); **(d)** a provider's environment
  fragment at `.config/mise/conf.d/<pack>.toml`, auto-loaded, so no component
  edits `mise.toml`; **(e)** a hook fragment at
  `.config/pre-commit.d/<pack>.yaml`, copied verbatim — **`/vwf:init` merges
  it**, nothing in stackgen edits the pre-commit config, which is what keeps a
  fragment a fragment; and, since 2026-09-05, **(f)** a deploy target's own
  config and its deploy task — `cloud-service/workers-static-assets` ships
  `wrangler.jsonc` at the root and a `.config/mise/tasks/p/_project/deploy`
  overlay, the first `cloud-provider`/`cloud-service` pack to ship a `config/`
  tree at all, which is also what put those two types on the composition order
  (**last**, after `capability-provider`). Note the second underscore rule:
  `config/_<name>/` at the top of the tier is pack-private and never copied, but
  nested deeper `p/_project/` is a **marked position**, copied and renamed to
  the pinned project's id. Still fenced out: `package.json`, any language
  manifest or lockfile, and CI workflows. What lands at the repo **root** is
  capped by a fixed allowlist (`plugins:check` rule 11 enforces it); `readme.md`
  and `CLAUDE.md` are on that list only because a shaped repo has them — **no
  pack may ship either**.

**Three consent tiers**: the `.claude/` files ride the ordinary dry-run gate;
`settings.json`, `.mcp.json` and a pack's `config/` tree are never written
without their own separate consent lines; and the local plugin is two separately
declinable items — the manifest write, and the user-scoped registration, whose
two `claude plugin` commands are **printed and confirmed, never auto-run**.
CLAUDE.md is vwf's: the materializer recommends `/vwf:setup`.

## Authoring a pack

- **The whole `config/` payload tier is checked before it ships.**
  `plugins:check` rule 11 asserts the exec bit and a known shebang on every task
  file (mise reports a 644 task as an *unknown* one rather than a permission
  error) and on every `hooks/*.sh`, the root allowlist over the tier's top
  level, and that each `.config/pre-commit.d/*.yaml` parses with a top-level
  `repos:` list. `plugins:shellcheck` runs `shellcheck -x` and `shfmt -d` over
  the same shell, in two groups — task libraries with the pack's `_scripts/`
  beside them, hooks with no flags, since a hook lands alone and may declare
  `sh`.
- **Never format a payload file with this repo's dprint config.** The tier is
  excluded from it on purpose: the target repo formats these files with the
  *shipped* config, which omits settings this repo sets, so formatting one here
  makes a freshly initialised repo fail its own first hook run. Run the shipped
  config when a payload file needs formatting.
- **A pack carries judgment, never the vendor's syntax** — worked YAML comes
  from Context7 at use time. Category-level doctrine is written once, in
  `assets/contracts/`; instance packs cite it.
- **The no-skill-lost rule runs backwards**: a pack is the destination that has
  to exist *before* a source retires, never a replacement on landing. Every
  curated stack plugin has now retired, so for every pack here the pack is the
  only home.
- A generated artifact is **lazily hung and never line-capped** — a large one is
  decomposed into a router skill plus on-demand references, never trimmed.
- The `vwf-stack-adapter` keyword in `plugin.json` is load-bearing:
  `plugins:check` requires the menu + template pair on every plugin carrying it,
  **and** the keyword on every plugin shipping either skill, so dropping one
  side cannot silently turn the rule off.

## Two scripts that are not plugin hooks

Two hook scripts ship here as **pack payloads**, copied into the target repo by
a materialization rather than discovered from a `hooks/hooks.json`:

- the `capability-provider/fnox` pack's git pre-commit gate;
- the `package-manager/pnpm` pack's npm→pnpm/bun normalizer (`PreToolUse` on
  `Bash`, via `updatedInput`), which moved here from the retired `typescript`
  plugin with the package manager it rewrites for — a JS/TS rewrite has no
  business in vwf.

Both are still gated here, as payload rather than as hooks: rule 11 asserts each
script's exec bit and its shebang, and `plugins:shellcheck` lints the body. What
no rule reads is the `hooks.yaml` beside them — `checkHookScripts`, the older
rule, follows only a plugin's own `hooks/hooks.json`, so the event and matcher a
payload hook is wired to are asserted by nothing in this repo.
`mise run plugins:npm-normalize-test` covers the normalizer's behaviour: it
table-tests the script through the **system sed** for both package managers,
each table in a temp dir seeded with the lockfile that selects pnpm or bun. Hook
scripts must stay portable to macOS BSD `sed` — no `\s`, no `\b`.

## Documentation

Any change to stackgen's behaviour must reconcile `readme.md`, `CLAUDE.md` and
`site/src/content/docs/plugins/stackgen.md` in the **same commit** — the repo's
hard rule. Delegate the sweep to the `docs-reconciler` agent. A behaviour change
also bumps `version` in `plugin.json` (plain `X.Y.Z`) and regenerates the
marketplace with `mise run plugins:marketplace`. A new pack, bundle or kind
regenerates `stacks/inventory.md` with `mise run plugins:inventory` — never type
a count into prose; `--check` in pre-commit and CI fails a stale inventory, and
the generator throws on a `kind` that `assets/kinds.md` does not define.
