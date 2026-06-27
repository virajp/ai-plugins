# context7

The `context7` plugin runs the [Context7](https://github.com/upstash/context7)
MCP server, which fetches up-to-date documentation and code examples for
libraries, frameworks, and SDKs on demand. With it enabled, Claude Code looks up
current library docs instead of relying on training knowledge.

## Install

```sh
pnpx @askviraj/ai-plugins --user context7
```

`context7` is also a dependency of `vwf`, so installing `vwf` pulls it in
automatically.

## How it runs

The plugin declares one MCP server in its manifest. Claude Code launches it via
`pnpx`, so it always runs the latest published server:

```json
{
  "mcpServers": {
    "context7": { "command": "pnpx", "args": ["@upstash/context7-mcp"] }
  }
}
```

**Prerequisite:** `pnpm` (which provides `pnpx`) on your `PATH` — install it
with `mise use -g pnpm@latest`.

## Usage

Once enabled, Claude resolves a library to its Context7 ID, then queries that
library's documentation — useful for API syntax, configuration, version
migrations, and CLI usage. You don't call it directly; Claude reaches for it
when a question is about a specific library.

## See also

- [../readme.md](../readme.md) — the marketplace overview and full plugin list.
- [Context7 upstream](https://github.com/upstash/context7) — the server's own
  documentation.
