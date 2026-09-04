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

If not, install it as a mise-managed tool — add to the `[tools]` section of the
mise config (installs the CLI and `mempalace-mcp`):

```toml
"pipx:mempalace" = { version = "latest" }
```

Global or project-level is your choice; in a multi-environment mise split it
belongs in the **development** config, since the tool is only needed in the dev
environment.

### Backend: Qdrant, in a container

Use **qdrant** as the backend rather than the chroma default — chroma does not
support concurrent access, qdrant does. Run it as a container with its port
published to loopback, so the `mempalace` running on the local machine can
reach it:

```bash
docker run -d --name qdrant -p 127.0.0.1:6333:6333 docker.io/qdrant/qdrant:latest
```

Persist `/qdrant/storage` with a bind mount so the vectors outlive the
container.

### Configuration

`mempalace` picks its configuration up from `~/.mempalace/config.json` and
`MEMPALACE_*` environment variables, and the precedence **differs by setting**
— know it exactly when debugging:

- **Choosing the backend:** `--backend` flag → config.json `"backend"` →
  `MEMPALACE_BACKEND` → default `chroma`. The **file beats env** here, and the
  unconfigured default is chroma.
- **Qdrant connection settings** (`qdrant_url`, `qdrant_api_key`,
  `qdrant_namespace`, `qdrant_timeout`): `MEMPALACE_QDRANT_*` env vars →
  config.json → defaults (`http://localhost:6333`, 10 s timeout). **Env beats
  the file** here — so a stale variable in a supervisor's inherited
  environment can point the daemon at the wrong qdrant even when config.json
  is right.

Keep the file and the env vars stating the same values, as below, so the flip
never bites. The palace lives at `~/.local/share/mempalace`. A sample
`~/.mempalace/config.json` (`palace_path` is one canonical absolute spelling —
the path string is the palace's identity):

```json
{
  "palace_path": "/Users/you/.local/share/mempalace",
  "collection_name": "mempalace_drawers",
  "backend": "qdrant",
  "qdrant_url": "http://127.0.0.1:6333"
}
```

The environment variables, ideally in the global mise config's `[env]` (or else
the shell's startup script):

```toml
[env]
MEMPALACE_BACKEND                          = "qdrant"
MEMPALACE_MAX_BACKUPS                      = 4
MEMPALACE_MCP_HTTP_ALLOW_INSECURE_NO_TOKEN = "1"
MEMPALACE_PALACE_PATH                      = "${HOME}/.local/share/mempalace"
MEMPALACE_QDRANT_URL                       = "http://127.0.0.1:6333"
```

Set `MEMPALACE_BACKEND` and `MEMPALACE_QDRANT_URL` **together** — the URL
without the backend key silently selects chroma.

### The MCP server daemon

vwf connects to mempalace over HTTP rather than spawning it, so run the server
as a **long-lived host daemon**:

```bash
mempalace-mcp --transport http --host 127.0.0.1 --port 8765
```

With the configuration above it needs no flags — the daemon reads
`~/.mempalace/config.json` regardless of the environment it inherited, which is
what matters under a supervisor (a supervised daemon sees the *supervisor's*
environment, not your shell's). Mind the per-setting precedence above: the file
wins the backend choice, but inherited `MEMPALACE_QDRANT_*` vars outrank the
file for connection settings — after changing one, restart the supervisor, not
just the daemon. `MEMPALACE_MCP_HTTP_ALLOW_INSECURE_NO_TOKEN` is
what lets the loopback daemon run without a token. Keep it under a process
supervisor (pitchfork, launchd, systemd) rather than starting it by hand: a
client reconnects to an HTTP daemon, but nothing restarts one for you.

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

- The `mempalace-mcp` server is declared by the vwf plugin manifest. Once the plugin is installed, the MemPalace MCP tools (`mempalace_search`, `mempalace_add_drawer`, `mempalace_diary_write`, `mempalace_check_duplicate`, `mempalace_diary_read`, etc.) are available to the agent without any further configuration.
- For automatic background saving every N agent turns plus session-start memory recall, also install the Cursor hooks separately by running `hooks/cursor/install.sh --scope user` from a cloned MemPalace repo.
- The recommended `agent_name` when calling `mempalace_diary_write` from a Cursor session is `cursor-ide` (matches the precedent of `claude-code` and `codex`).
