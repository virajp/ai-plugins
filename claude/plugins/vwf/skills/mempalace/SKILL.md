---
name: mempalace
description: MemPalace — mine projects and conversations into a searchable memory palace. Use when the user asks about MemPalace, memory palace, mining memories, searching memories, palace setup, wings, rooms, or drawers; or when they want to recall past work that may already be filed in their palace.
disable-model-invocation: false
---

# MemPalace

A searchable memory palace for AI — mine projects and conversations, then search them semantically.

## Prerequisites

Ensure `mempalace` is installed:

```bash
mempalace --version
```

If not installed (uv recommended):

```bash
uv tool install mempalace   # or: pip install mempalace
```

Or install it as a managed tool and run the server as a **long-lived host
daemon** — the shape vwf assumes, since vwf connects to mempalace over HTTP
rather than spawning it:

```bash
mise use -g "pipx:mempalace@latest"    # installs the CLI and mempalace-mcp
mempalace-mcp --transport http --host 127.0.0.1 --port 8765 \
  --palace "$HOME/.local/share/mempalace"
```

Keep that under a process supervisor (pitchfork, launchd, systemd) rather than
starting it by hand: a client reconnects to an HTTP daemon, but nothing
restarts one for you. Pass the palace path as a **flag**, not through the
environment — a supervised daemon inherits the *supervisor's* environment, so a
variable fixed after the supervisor started is not the one the daemon sees.

## Usage

MemPalace provides dynamic, version-correct instructions via the CLI. To get instructions for any operation:

```bash
mempalace instructions <command>
```

Where `<command>` is one of: `help`, `init`, `mine`, `search`, `status`.

Run the appropriate instructions command, then follow the returned instructions step by step.

## Recalling past work

This skill covers setup, mining, and status. For questions about past
work, prior decisions, or people that may already be filed in the
palace, prefer the **`mempalace-recall`** skill — it enforces
search-before-answer so the agent reads the palace instead of guessing.

## Cursor-specific notes

- The `mempalace-mcp` server is auto-registered by this plugin. Once installed, all 36 MemPalace MCP tools (`mempalace_search`, `mempalace_add_drawer`, `mempalace_diary_write`, `mempalace_check_duplicate`, `mempalace_diary_read`, etc.) are available to the agent without any further configuration.
- For automatic background saving every N agent turns plus session-start memory recall, also install the Cursor hooks separately by running `hooks/cursor/install.sh --scope user` from a cloned MemPalace repo. See [`website/guide/cursor-hooks.md`](../../website/guide/cursor-hooks.md) for the full walkthrough.
- The recommended `agent_name` when calling `mempalace_diary_write` from a Cursor session is `cursor-ide` (matches the precedent of `claude-code` and `codex`).
