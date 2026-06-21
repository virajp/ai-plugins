# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP
servers, MCP servers, a full Spec → Plan → Execute workflow plugin (`vwf`), and
a config-driven powerline `statusline` — for use with the Claude Code CLI.

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
CLI for you, installing each plugin at its default scope (`dart-lsp` is
project-scoped, every other plugin user-scoped).

> The examples below use `pnpx`; if you don't use `pnpm`, swap in `npx` — the
> commands are otherwise identical.

**Install everything — all plugins + statusline:**

```sh
pnpx @askviraj/ai-plugins --all
```

**Install all plugins (no statusline):**

```sh
pnpx @askviraj/ai-plugins --plugins
```

**Install specific plugins (`--plugin` is repeatable):**

```sh
pnpx @askviraj/ai-plugins --plugin vwf --plugin dart-lsp
```

Available plugin names: `vwf`, `mempalace`, `context7`, `typescript-lsp`,
`dart-lsp`.

> The **statusline** also installs through this CLI — see
> [Statusline](#statusline) below.

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

### typescript-lsp

TypeScript/JavaScript language server (via `typescript-language-server`).

```sh
pnpx @askviraj/ai-plugins --plugin typescript-lsp
```

### dart-lsp

Dart language server.

```sh
pnpx @askviraj/ai-plugins --plugin dart-lsp
```
