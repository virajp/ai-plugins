# claude-design

The `claude-design` plugin connects the agent to **Claude Design**
([claude.ai/design](https://claude.ai/design)) through Anthropic's remote MCP
endpoint, so design projects can be created and updated programmatically from a
session.

## Install

```sh
pnpx @askviraj/ai-plugins --user claude-design
```

`claude-design` is also a dependency of `vwf`, so installing `vwf` pulls it in
automatically.

For **OpenCode**, `--platform opencode --user claude-design` adds the same
server as a `remote` entry under the `mcp` key of the OpenCode config
(`~/.config/opencode/opencode.jsonc`, or your existing `opencode.json`) — see
the readme's installer-CLI section.

## How it runs

The plugin declares one remote (streamable-HTTP) MCP server in its manifest —
nothing runs locally and no external tools are required:

```json
{
  "mcpServers": {
    "claude-design": {
      "type": "http",
      "url": "https://api.anthropic.com/v1/design/mcp"
    }
  }
}
```

Authentication is handled by the host's remote-MCP OAuth flow (in Claude Code,
run `/mcp` to connect and sign in with your Anthropic account).
