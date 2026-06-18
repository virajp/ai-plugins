# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP
servers, MCP servers, and a full product/engineering workflow plugin (`vwf`) for
use with the Claude Code CLI.

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

Available plugin names: `vwf`, `mempalace`, `context7`, `typescript-lsp`,
`dart-lsp`.

## Plugins

### vwf

The flagship plugin — a highly opinionated product/engineering workflow for solo
developers and small teams. Ships slash commands, subagents, skills, and two
`PreToolUse` / `Bash` hooks: one that transparently rewrites `npm`/`npx`
commands to `pnpm`, and an `rtk hook claude` hook (requires `rtk` — see
Prerequisites).

```sh
claude plugin install --scope project vwf@virajp-plugins
```

**Slash commands** (`/vwf:<name>`):

| Command        | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `product`      | Write or update product documentation (user goals + observable outcomes)                    |
| `architecture` | Create or update `docs/architecture.md` — system shape and machine-readable registry        |
| `engineering`  | Write or update engineering docs for one or more entities or a cross-cutting concern        |
| `spec-plan`    | Create an implementation spec & plan for an entity (requires engineering docs)              |
| `exec-plan`    | Execute an approved spec & plan through four gated stages (code → review → security → docs) |
| `git-workflow` | Manage git workflows — worktree isolation, commits, merges, pushes                          |

**Skills:**

| Skill                 | Description                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes: avoid overcomplication, make surgical changes, surface assumptions, define verifiable success criteria |
| `rest-api-design`     | Technology-agnostic principles and best practices for designing REST APIs                                                                                          |

#### vwf dependencies

All of vwf's dependencies live in the **same `virajp-plugins` marketplace**
(`mempalace` and `superpowers` are re-listed here), so a clean install needs no
other marketplace registered:

```sh
claude plugin marketplace add --scope user virajp/ai-plugins
claude plugin install --scope project vwf@virajp-plugins   # pulls + enables deps
```

> Auto-enable is **event-driven** — it fires when you enable `vwf`, not
> continuously. If a dependency later gets disabled on its own, re-enable it
> directly or toggle `vwf` off and on again.

`vwf` depends on three other plugins, which Claude Code **auto-installs and
auto-enables** when you enable `vwf` (requires Claude Code ≥ 2.1.143):

- `context7@virajp-plugins` — Context7 MCP docs server
- `mempalace@virajp-plugins` — AI memory system
- `superpowers@virajp-plugins` — core skills library

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
