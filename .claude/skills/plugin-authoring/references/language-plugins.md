# Language Plugins

The contract for a plugin that owns a toolchain — what `typescript` and
`flutter` are, and what a `golang`, `rust` or `jvm` plugin must be. This is
**prose doctrine, deliberately unenforced for now**: the `plugins:check`
assertions listed at the end are deferred until a real new language plugin has
stress-tested the contract, so revising a rule is an edit here, not a checker
release.

## Boundary: the toolchain, not the language

One plugin per **toolchain/ecosystem**. A language belongs to whichever plugin
owns its dominant toolchain: `typescript` is the Node/TS ecosystem (so it covers
`javascript` too), `flutter` owns everything its toolchain drags along (`dart`,
`kotlin`, `swift`), and a future `jvm` plugin would own gradle-land. Two
corollaries:

- **A framework is never a plugin boundary.** `effect` lives inside
  `typescript`; an `axum` or `gin` skill would live inside `rust` or `golang`.
  Which frameworks a plugin covers is its own discretion.
- **Token collisions are legal and resolved by the pin.** Two installed plugins
  may claim the same token in `languages:` (`kotlin` in `flutter` and a future
  `jvm`). Any claimer makes the token known — the menu is a union, per vwf's
  `stack-vocabulary.md` — and for `doctor`'s per-project facts the plugin that
  owns the project's **pinned stack template** is authoritative. No
  primary/companion machinery exists, on purpose.

## The mandatory core

Every language plugin ships all of:

1. **A `languages:` list in each project template's frontmatter** — the
   token-ownership declaration, and what makes each language *known* to `doctor`
   (an unknown language is a blocking finding that halts `setup` and `execute`).
   Note where this lives: the **template**, not the plugin manifest. The
   manifest carried a `languages:` key of its own until the Claude-first
   cutover, but nothing ever read it — vwf reaches a plugin only at contracted
   skill names, so the token it resolves is always the one the template
   declares. The manifest key was documentation with a single checker assertion
   behind it, and it folded into `keywords`. Do not reintroduce it: two
   declarations of the same fact is the drift this repo keeps deleting.
2. **≥ 1 project-axis stack template plus the adapter pair** —
   `<plugin>-stack-menu` and `<plugin>-stack-template`, both model-invocable
   (`disable-model-invocation: false`), per vwf's `stack-adapter.md`. Under the
   closed menu a language with no template is a dead end — `architecture` can
   never pin a project to it — so the template is what makes the plugin usable,
   not an extra.
3. **A router skill per major language** — lean SKILL.md,
   `user-invocable: false`, `paths:` scoped to the language's extensions,
   loading on-demand references. The minimum reference set is **coding
   standards, testing, and build/packaging**; everything beyond (flutter's
   feature catalog) is discretionary. One router may cover several of the
   plugin's tokens when their doctrine is shared (the `typescript` router covers
   `javascript` too) — but every claimed token must be covered by *some*
   router's `paths:`, and a framework skill scopes to only the languages the
   framework actually supports (`effect` is TS-only by Effect's own
   requirements).
4. **The bundled LSP server(s)**, where one exists — declared in `lspServers:`,
   launched through `mise x`, with an `extensions:` map covering the plugin's
   language tokens.
5. **A config-doctrine skill per config file the toolchain owns**
   (`package-json`, `pnpm`, `tsconfig`, `lint-format` / `pubspec`,
   `analysis-options`) — `user-invocable: false` + `paths:` scoped to that file.

## Conditional and optional

- **`<plugin>-ux-gate` — conditional, but not optional when it applies.**
  Required exactly when one of the plugin's project templates declares a screen
  platform; vwf's `execute-ux-reviewer` delegates rendering and the
  accessibility scan to it by that contracted name. A plugin shipping only
  `service`/`cli` templates ships none.
- **Hooks — optional.** Only where the ecosystem has a real normalization need
  (npm→pnpm/bun has one; `go`/`cargo` almost certainly do not). Portability
  rules per `references/hooks.md`.

## Posture

- **Self-contained: zero `dependencies:`.** Repo-level gates (dprint, eslint,
  gitleaks, grype, pre-commit) stay `devtools`' property — a stack template may
  **name** them as recommendations, never own, restate, or require them. This
  keeps every language plugin independently installable.
- **`requires:` is `mise` plus what mise cannot provide.** Every bundled LSP
  runs through `mise x`, so `mise` is always required; add only binaries mise
  cannot supply to the LSP command (`pnpm` for the TS server, `kotlin-lsp` /
  `sourcekit-lsp` for flutter). **Never the toolchain itself** — node, go, cargo
  are mise-managed per repo, and `requires:` is a machine-global hard gate.

## Feature horizon

Every feature must map onto a primitive a plugin can ship — skills, subagents,
hooks, LSP servers, MCP servers, stack templates. Three tiers, so a new plugin
knows what is in scope versus aspirational:

- **In contract now** — everything above: LSP config, the router + standards
  references, config doctrine, framework skills, stack templates, the
  conditional ux-gate, normalization hooks, token facts.
- **Cheap prose, add when the ecosystem warrants** — a **debugging reference**
  in the router (driving the language's CLI debugger: `node --inspect`, `dlv`,
  `lldb`); **codemod/migration skills** (user-invocable, for mechanical upgrades
  like CJS→ESM or a framework major); a **docs-pinning reference** mapping the
  plugin's blessed libraries to Context7 IDs so lookups skip resolution; a
  **language-specialized review agent** vwf's code reviewer could delegate to.
- **Needs real server development, not config** — a **debugger (DAP)**: no
  target exposes a debug-adapter primitive, so interactive
  breakpoint/step/inspect tooling means an MCP server wrapping a DAP adapter;
  likewise **structured test/coverage tooling** beyond what Bash + the harness
  task names already give. Neither is required by this contract; a plugin
  offering one does it as an `mcpServers:` entry.

Deliberately out of scope, whatever the tier: formatter/linter/scanner binaries
and repo gates (devtools'), toolchain installation (mise's), development secrets
(doppler's), CI mechanics (`cicd`'s).

## Deferred checks

When the contract graduates to enforcement, these are the mechanical assertions
`plugins:check` gains — everything else here stays judgment, reviewed in PRs:

- a project template declaring `languages:` ⇒ the `-stack-menu` /
  `-stack-template` pair exists and is model-invocable;
- every declared language token appears in some `lspServers.*.extensions` map;
- a project template declaring a screen platform ⇒ a `<plugin>-ux-gate` skill
  exists;
- a plugin owning a language declares no `dependencies`.
