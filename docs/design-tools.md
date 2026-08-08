# design-tools

The `design-tools` plugin is **vwf's design adapter**. vwf itself talks to no
design tool: it calls two fixed skills and this plugin decides which tool
answers.

| Skill                                                         | Returns                                 |
| ------------------------------------------------------------- | --------------------------------------- |
| `/design-tools:design-tools-import-screens <flow> <platform>` | one flow's designed screens, normalized |
| `/design-tools:design-tools-import-design-system`             | the design system, normalized           |

Both are `invocation: both`, which is load-bearing rather than cosmetic — a
user-only skill is removed from the model's context and cannot be delegated to,
and the failure is silent. `mise run plugins:check` enforces it.

## Install

```sh
pnpx @askviraj/ai-plugins --user design-tools
```

It is **not** a vwf dependency: the design tool is a product decision, so the
adapter is chosen rather than inherited.

## The tool is per project

One product can design different surfaces in different tools, so the choice is a
per-project key in `.config/vwf.yaml`:

```yaml
projects:
  website: { design: lovable }
  mobile: { design: claude-design }
```

The value is a **tool token**, not a plugin name. Supported today:

| Token           | Reads                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| `claude-design` | the claude.ai/design canvas — named pages and frames, and first-class design-system objects |
| `lovable`       | the generated application source, plus the published `.lovable/design-system.json`          |
| `stitch`        | Google Stitch's generated HTML per screen; the design system is **derived**, not stored     |

A product-wide `design.tool: <token>` is the pre-`config_format`-13 shape and is
**not** read. It is drift `/vwf:setup`'s `12 → 13` migration copies down onto
each UI project — honoring it here would make that migration optional and leave
the config holding two answers to one question.

**An unrecognised token halts**, with a message naming the supported set. It
never falls back to a default and never returns an empty payload — an empty
result is indistinguishable from a design that was never made, which is the
exact failure this adapter exists to prevent.

## Lazy-loaded per-tool logic

Each skill is a lean router. The per-tool procedure lives in
`skills/<skill>/references/<tool>.md`, and only the one matching the resolved
tool is read — so a Claude Design import never loads Lovable's or Stitch's
instructions.

Adding a tool means adding those two reference files and listing the token in
both dispatch tables. No vwf change, no new plugin.

## Where vwf uses it

- **`/vwf:design-system`** — import-only: the design tool owns design-system
  authoring; the skill imports the chosen design system into the repo contract
  and pins `design.design_system_id`.
- **`/vwf:screens`** — the two-way screen sync. `prompt <flow>` writes design
  briefs as files (no adapter needed — export is tool-agnostic); `import`
  delegates here and routes accepted deltas through `/vwf:blueprint`.
- **`/vwf:feedback canvas`** — harvests the canvas review conversation back into
  the blueprint/design-system routes.

The payload shapes both skills return are defined by vwf's
`assets/design-adapter.md`, which is authoritative.

## The Claude Design MCP server

The plugin declares one remote (streamable-HTTP) MCP server in its manifest —
nothing runs locally:

```yaml
mcpServers:
  claude-design:
    transport: http
    url: https://api.anthropic.com/v1/design/mcp
```

Authentication is handled by the host's remote-MCP OAuth flow (in Claude Code,
run `/mcp` to connect and sign in with your Anthropic account). Tool names carry
the **declaring plugin**, so they are prefixed
`mcp__plugin_design-tools_claude-design__`.

Where the harness ships a DesignSync tool that is preferred, and the MCP server
is the portable fallback — see the plugin's `assets/canvas-push.md`.

The other two tools bring their own surfaces, and this plugin declares neither:
Lovable needs its own MCP server connected (OAuth, workspace-scoped), and Stitch
needs `STITCH_API_KEY` plus `@google/stitch-sdk` — hence the plugin's `pnpm`
requirement.
