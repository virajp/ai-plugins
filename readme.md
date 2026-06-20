# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP
servers, MCP servers, a full Spec → Plan → Execute workflow plugin (`vwf`), and
a config-driven powerline `statusline` — for use with the Claude Code CLI.

## Prerequisites

[Claude Code CLI](https://claude.ai/code) & [Mise](https://mise.jdx.dev/)
installed.

> NOTE: `mise` is required — the LSP plugins and the `vwf` npm→pnpm hook resolve
> their tools through it.

> NOTE: `vwf` also ships an `rtk hook claude` hook — install `rtk` first:
>
> ```sh
> brew install --formulae rtk
> ```

## Installation

**Step 1 — Add the marketplace (once, user-scoped):**

```sh
claude plugin marketplace add --scope user virajp/ai-plugins
```

**Step 2 — Install a plugin into your project:**

```sh
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `statusline`, `mempalace`, `context7`,
`typescript-lsp`, `dart-lsp`.

## Plugins

### vwf

The flagship plugin — a highly opinionated Spec → Plan → Execute workflow for
solo developers and small teams. Ships slash commands, subagents, skills, and
two `PreToolUse` / `Bash` hooks: one that transparently rewrites `npm`/`npx`
commands to `pnpm`, and an `rtk hook claude` hook (requires `rtk` — see
Prerequisites).

```sh
claude plugin install --scope project vwf@virajp-plugins
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
claude plugin marketplace add --scope user virajp/ai-plugins
claude plugin install --scope project vwf@virajp-plugins   # pulls + enables deps
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
fully data-driven from JSON and themeable across three config layers (plugin
defaults → `~/.config/statusline.json` → `<repo-root>/.config/statusline.json`).
Enabling it wires `subagentStatusLine` automatically; add the main `statusLine`
to your settings yourself. Requires a [Nerd Font](https://www.nerdfonts.com/).

```sh
claude plugin install --scope user statusline@virajp-plugins
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
claude plugin install --scope user mempalace@virajp-plugins
```

### context7

Context7 MCP server — fetches up-to-date library/framework documentation.

```sh
claude plugin install --scope user context7@virajp-plugins
```

### typescript-lsp

TypeScript/JavaScript language server (via `typescript-language-server`).

```sh
claude plugin install --scope project typescript-lsp@virajp-plugins
```

### dart-lsp

Dart language server.

```sh
claude plugin install --scope project dart-lsp@virajp-plugins
```
