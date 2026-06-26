# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP
servers, MCP servers, a full Spec → Plan → Execute workflow plugin (`vwf`), an
opinionated `markdown` documentation skill, and a config-driven powerline
`statusline` — for use with the Claude Code CLI.

## Prerequisites

- [Node.js](https://nodejs.org/) — runs the installer via `pnpx` (or `npx`).
- [Claude Code CLI](https://claude.ai/code) — the installer drives it to add the
  marketplace and install plugins.
- [Mise](https://mise.jdx.dev/) — the LSP plugins and the `vwf` npm→pnpm hook
  resolve their tools through it.

> The installer **checks every required tool** for what you're installing
> (including `rtk` and `pnpm` for `vwf`) and prints the exact install command
> for anything missing — it never installs a dependency for you. Run it first to
> see what you need.

## Installation

Everything installs through one CLI —
[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins). It
adds the `virajp-plugins` marketplace (user-scoped) and drives the Claude Code
CLI for you. The bulk flags (`--all` / `--plugins`) install the **user-scoped**
plugins only; `flutter` is **project-scoped**, so install it explicitly with
`--plugin flutter` from within the project that needs it. The CLI only ever
registers and refreshes `virajp-plugins` — every plugin resolves from it alone.

> The examples below use `pnpx`; if you don't use `pnpm`, swap in `npx` — the
> commands are otherwise identical.

**Install everything (user-scoped plugins + statusline):**

```sh
pnpx @askviraj/ai-plugins --all
```

**Install all user-scoped plugins (no statusline):**

```sh
pnpx @askviraj/ai-plugins --plugins
```

**Install specific plugins (`--plugin` is repeatable, any scope):**

```sh
pnpx @askviraj/ai-plugins --plugin vwf --plugin flutter
```

This is the only way to install a project-scoped plugin like `flutter`.
Available plugin names: `vwf`, `markdown`, `typescript`, `flutter`, `mempalace`,
`context7`.

Installing `vwf` also wires up
[graphify](https://github.com/safishamsi/graphify) (a git-repo tool). When
installing **outside a git repo**, add `--skip-graphify` to bypass that setup
and drop graphify from the dependency check:

```sh
pnpx @askviraj/ai-plugins --plugin vwf --skip-graphify
```

> The **statusline** also installs through this CLI — see
> [Statusline](#statusline) below.

**Check versions, and keep everything up to date:**

```sh
# CLI, statusline, and each plugin's installed vs latest version
pnpx @askviraj/ai-plugins --version

# upgrade installed plugins + refresh the statusline (runs after any install)
pnpx @askviraj/ai-plugins --upgrade

# idempotent install + upgrade — safe to drop in a setup script
pnpx @askviraj/ai-plugins --all --upgrade
```

**Uninstall** (mirrors the install flags — `--all` removes everything the CLI
installed; the rest are specific):

```sh
pnpx @askviraj/ai-plugins --uninstall --plugin vwf   # one plugin
pnpx @askviraj/ai-plugins --uninstall --statusline   # just the status bar key
pnpx @askviraj/ai-plugins --uninstall --all          # all plugins + statusline
```

## Plugins

### vwf

The flagship plugin — a highly opinionated Spec → Plan → Execute workflow for
solo developers and small teams. Ships slash commands, subagents, skills, and
two `PreToolUse` / `Bash` hooks: one that transparently rewrites `npm`/`npx`
commands to `pnpm`, and an `rtk hook claude` hook (requires `rtk` — see
Prerequisites).

```sh
pnpx @askviraj/ai-plugins --plugin vwf
```

See **[docs/vwf.md](./docs/vwf.md)** for the full usage guide — the mental
model, every command, and an end-to-end walkthrough.

**Slash commands** (`/vwf:<name>`):

| Command        | Description                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `spec`         | Maintain the always-current, full-product blueprint under `docs/specs/` (one doc per entity)   |
| `plan`         | Pick one slice of the spec, diff desired vs actual, write a reviewable cycle plan              |
| `execute`      | Implement an approved plan under TDD, then code review + security review                       |
| `archive`      | Move completed plans aside (never deletes)                                                     |
| `architecture` | Bootstrap or correct `docs/specs/architecture.md` — system shape and machine-readable registry |
| `git-workflow` | Internal — worktree isolation, commits, merges, pushes (used by plan/execute)                  |

**Skills:**

| Skill                 | Description                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes: avoid overcomplication, make surgical changes, surface assumptions, define verifiable success criteria |
| `rest-api-design`     | Technology-agnostic principles and best practices for designing REST APIs                                                                                          |

#### vwf dependencies

All of vwf's dependencies live in the **same `virajp-plugins` marketplace**
(`mempalace` is re-listed here), so a clean install needs no other marketplace
registered:

```sh
pnpx @askviraj/ai-plugins --plugin vwf   # adds the marketplace, installs vwf + deps
```

> Auto-enable is **event-driven** — it fires when you enable `vwf`, not
> continuously. If a dependency later gets disabled on its own, re-enable it
> directly or toggle `vwf` off and on again.

`vwf` depends on two other plugins, which Claude Code **auto-installs and
auto-enables** when you enable `vwf` (requires Claude Code ≥ 2.1.143):

- `context7@virajp-plugins` — Context7 MCP docs server
- `mempalace@virajp-plugins` — AI memory system

### markdown

Opinionated Markdown & documentation standards as a **path-scoped skill** —
writing style, code blocks, tables, CHANGELOGs, and `mermaid` diagrams. The
skill auto-applies whenever you edit a Markdown file (`**/*.md`) and is hidden
from the `/` menu, so it behaves like an always-on documentation rule rather
than a command.

```sh
pnpx @askviraj/ai-plugins --plugin markdown
```

### statusline

A standalone, powerline-style statusline (main two-line bar + subagent panel),
fully data-driven from JSON and themeable across three config layers (defaults →
`~/.config/statusline.json` → `<repo-root>/.config/statusline.json`). It
installs via a small CLI rather than the plugin marketplace — the installer
copies the script to `~/.claude/scripts/` and writes the chosen key(s) into
`~/.claude/settings.json`. Requires a [Nerd Font](https://www.nerdfonts.com/).

```sh
# install both surfaces (use --statusline / --subagentstatusline individually too)
pnpx @askviraj/ai-plugins --statusline --subagentstatusline

# overwrite existing config without prompting
pnpx @askviraj/ai-plugins --statusline --subagentstatusline --yes
```

See **[docs/statusline.md](./docs/statusline.md)** for setup and the full
configuration reference.

### mempalace

AI memory system — mine projects and conversations into a searchable palace. 33
MCP tools, auto-save hooks, and guided setup. Maintained externally
([MemPalace/mempalace](https://github.com/MemPalace/mempalace)) and re-listed
here; it is also a `vwf` dependency.

> When you install `vwf`, `mempalace` is pulled in and enabled automatically —
> you only need these steps to install `mempalace` on its own.

```sh
pnpx @askviraj/ai-plugins --plugin mempalace
```

### context7

Context7 MCP server — fetches up-to-date library/framework documentation.

```sh
pnpx @askviraj/ai-plugins --plugin context7
```

### typescript

Opinionated TypeScript plugin for Effect-TS pnpm monorepos. Bundles five
**path-scoped skills** — `effect` (Effect.gen/Schema/Service coding standards),
`package-json`, `pnpm`, `tsconfig`, and `build` — plus the TypeScript/JavaScript
language server (via `typescript-language-server`). The skills auto-apply when
you edit the matching files; `build` is invocable from the `/` menu.

```sh
pnpx @askviraj/ai-plugins --plugin typescript
```

### flutter

Opinionated Flutter plugin for Dart/GetX apps. Bundles eight **skills** — `dart`
(coding standards, GetX, widgets, errors), `pubspec`, `build`, `testing`,
`analysis-options`, `internationalization`, `swift`, and `kotlin` (native
platform-channel code for features Flutter can't reach) — plus **bundled Dart,
Kotlin, and Swift (SourceKit) language servers** for real diagnostics across
Dart and the native iOS/Android files. Self-contained — no cross-marketplace
dependencies (the Kotlin/Swift servers use the `kotlin-lsp` and `sourcekit-lsp`
binaries on your `PATH`). **Project-scoped** — install it from the Flutter
project that needs it.

```sh
pnpx @askviraj/ai-plugins --plugin flutter
```

## Credits & acknowledgements

This project is a thin layer over a lot of excellent work. It would not exist —
or would be far poorer — without these. Thank you to their authors and
maintainers. 🙏

- **[Claude Code](https://claude.ai/code)** by
  [Anthropic](https://anthropic.com) — the host these plugins, hooks, and
  statusline plug into.
- **[MemPalace](https://github.com/MemPalace/mempalace)** — the AI memory system
  that powers `vwf`'s cross-session recall (re-listed here as a dependency).
- **[Context7](https://github.com/upstash/context7)** by
  [Upstash](https://upstash.com) — the MCP docs server behind the `context7`
  plugin.
- **[mise](https://mise.jdx.dev/)** by Jeff Dickey — resolves the toolchain the
  LSP plugins and hooks depend on.
- **[pnpm](https://pnpm.io/)** — the package manager the `npm→pnpm` hook and
  `context7` rely on.
- **[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)**
  and the **[Dart SDK](https://dart.dev/)** language server — the engines behind
  the LSP plugins.
- **[rtk](https://github.com/rtk-ai/rtk) (Rust Token Killer)** — the
  token-saving proxy `vwf`'s Bash hook shells out to (installed via
  `brew install --formulae rtk`).
- **[graphify](https://github.com/safishamsi/graphify)** — the knowledge-graph
  tool `vwf` integrates with.
- **[oclif](https://oclif.io/)** — the framework this installer CLI is built on.
- **[Nerd Fonts](https://www.nerdfonts.com/)** — the glyphs that make the
  statusline render, and the **[Gruvbox](https://github.com/morhetz/gruvbox)**
  palette it ships by default.
