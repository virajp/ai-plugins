# Manifests & marketplaces

## `plugin.yaml` — the neutral manifest

One file per plugin under `templates/<name>/`. Minimal form:

```yaml
name: <plugin-name>
description: <one line>
```

Everything else defaults: `category` to `development`, `source` to local.
`schema/src/manifest.ts` is authoritative for the full shape.

**A manifest declares no install-time eligibility.** There is no `scope`, no
`optIn`, no `userOnly` — the three were removed together, since `scope` and
`optIn` were two spellings of "exclude from `--all`" and `userOnly` was never
set by any plugin. `--all` reads `defaultInstall` in
`templates/marketplace.yaml`; scope is whatever flag the user passed. Adding a
plugin to the default set is an edit to that one list, not to the plugin.

This one file replaced what used to be split between a `plugin.json` and a
hand-written marketplace entry — two files kept in sync by hand, and a whole
class of drift the checker existed to catch. The marketplace manifests are now
**generated**, so a plugin cannot be unregistered, orphaned, or disagree with
its own entry.

Optional blocks:

- **`lspServers`** — keyed by language id; each needs `command`, `args`,
  `extensions`, optionally `startupTimeout` and per-target `idAliases` (OpenCode
  keys LSP config by its own built-in ids, so `typescript-lsp` must be written
  as `typescript` there). Cursor has no LSP surface at all; the build reports it
  as a gap.
- **`mcpServers`** — a discriminated union on `transport` (`stdio` | `http`).
  `templates/vwf/plugin.yaml` declares one of each.
- **`dependencies`** — plain plugin names. `plugins:check` enforces that each
  resolves. A dependency may name another marketplace, but cross-marketplace
  deps are blocked at install time unless the **root** `marketplace.json`
  allowlists it via `allowCrossMarketplaceDependenciesOn` (not transitive — only
  the installing marketplace's allowlist applies). Nothing uses one today, so
  that key is absent.
- **`requires`** — external binaries. This is a **hard install gate**, not a
  bibliography: the CLI takes the union over the dependency-expanded set and it
  is explicitly **not** overridable by `--force`. The test is "does this plugin
  shell out to it", never "does it document it". `devtools` documents `doppler`,
  `dprint`, `eslint`, `gitleaks`, `grype` and `pre-commit` and requires only
  `mise`, because those are executed by the user's own repo — adding one would
  hard-fail a bare `--all` for every user lacking it.
- **`prefixSkillNames`** — see [invocation.md](invocation.md).

Adding a dependency is **one edit**: the name in `dependencies:`. If the dep is
external it also needs its own `templates/<name>/plugin.yaml` carrying
`source: {kind: url, url: …}`, so it resolves within `virajp-plugins` without
vendoring third-party code.

## The generated marketplaces

Three of the four targets have a native marketplace; `plugins:build` generates
one each. **OpenCode has none** — it has no plugin concept, which is why its
installer copies a rendered tree while the other three register a marketplace
and let the tool do the installing.

| Target   | Manifest                          | Plugin source                  |
| -------- | --------------------------------- | ------------------------------ |
| Claude   | `.claude-plugin/marketplace.json` | `./claude/plugins/<name>`      |
| Cursor   | `.cursor-plugin/marketplace.json` | `git-subdir` → `cursor/<name>` |
| Oh-My-Pi | `ohmypi/.omp-plugin/…json`        | `./<name>`                     |

Two of them live at the **repo root**, because that is where the tool looks when
the marketplace is added from this repo, and their sources are root-relative.
Cursor's must be there for a second reason: Cursor accepts
`.claude-plugin/marketplace.json` as a fallback and checks `.cursor-plugin/`
**first** — without ours at the root it would read Claude's and resolve every
plugin to a Claude-rendered bundle.

### Three traps, each verified against the real tool, each silent when wrong

- **Sources resolve against the marketplace root**, not the repo root.
  Oh-My-Pi's were once spelled from the repo root and resolved to
  `ohmypi/ohmypi/<name>`, failing every install. `plugins:check` cannot catch
  this: the path exists, just not where the tool looks.
- **Cursor's sources are git-only** — a bare string, or an object tagged
  `github` / `url` / `git-subdir`. There is no local-path variant, so a Cursor
  install clones this repo and reads whatever ref it resolves rather than the
  `cursor/` tree beside it. It is the one target where the committed-render
  guarantee does not reach, and the only one needing `marketplace.yaml`'s
  `repository` field.
- **Every entry must state its own `version`.** Omitting it does not leave the
  version unset — `omp` falls back, and the fallback resolves by accident: the
  entry's `version`, then `.claude-plugin/plugin.json`, `plugin.json` and
  `package.json` under the bundle, then a git `sha`, then the literal `"0.0.0"`.
  This render emits none of those except a `package.json`, and only for a plugin
  with wired hooks — so `typescript` and `vwf` reported correctly while every
  other plugin listed as `0.0.0`. Nothing fails; the version is simply wrong
  wherever a hook happens to be absent.

Never edit a generated manifest by hand — `plugins:render-clean` will fail.

## Versions

Plugin and skill version numbers are **not** cross-checked; they are independent
by design, since a plugin may hold skills versioned on their own cadence. A
plugin's `version` is what end-user installs pin to — bump it to ship changes.
