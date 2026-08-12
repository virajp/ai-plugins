# design-tools

The `design-tools` plugin is **vwf's design adapter**. vwf itself talks to no
design tool: it calls three fixed skills and this plugin decides which tool
answers. It is one plugin covering three tools — Claude Design, Lovable and
Google Stitch — because the tool is a *value* the adapter resolves, not a plugin
name vwf constructs a skill from.

## Install

```sh
pnpx @askviraj/ai-plugins --user design-tools
```

It is **not** a vwf dependency and **not** in the `--all` set: the design tool
is a product decision, so the adapter is chosen rather than inherited. Install
it by name, at user or project scope.

The plugin carries the `vwf-design-adapter` tag, which is what
`mise run plugins:check` keys the whole design-adapter validation off — an
adapter without it is skipped silently rather than checked.

## Skills

| Skill                                                         | Returns                                 |
| ------------------------------------------------------------- | --------------------------------------- |
| `/design-tools:design-tools-import-screens <flow> <platform>` | one flow's designed screens, normalized |
| `/design-tools:design-tools-import-design-system`             | the design system, normalized           |
| `/design-tools:design-tools-import-conversations <project>`   | that project's design review remarks    |

All three are **import-only**: they read from the design tool and normalize.
They never diff, never decide what a delta means, never write to the design
tool, and never touch `docs/blueprint/`. Export needs no adapter at all —
`/vwf:screens` in `prompt` mode writes design briefs as files, and a file is
tool-agnostic.

All three are `invocation: both`, which is load-bearing rather than cosmetic — a
user-only skill is removed from the model's context and cannot be delegated to,
and the failure is silent. `mise run plugins:check` enforces it.

**Only one of the three tools has a review conversation.**
`import-conversations` therefore has an answer its siblings do not:
`harvested: n/a` plus a reason, meaning *this tool has no such surface*. Lovable
exposes generated source and an edit history; Stitch exposes screens, HTML and
images; neither holds what a reviewer *said*. That is reported plainly and is
not a failure — an `ERROR:` is reserved for a surface that exists and could not
be read, so a Lovable user is never sent to `/mcp` to fix a connection that was
never the problem.

The two `n/a` references deliberately make no call at all — there is nothing to
reach — and each records why the obvious substitute was rejected: Lovable's
`list_edits` says a component changed but not why, and vwf routes on the why;
Stitch's screens would just re-derive what `/vwf:screens import` already does,
routing the same delta twice by two paths.

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

## See also

- [../readme.md](../readme.md) — the marketplace overview and full plugin list.
- [vwf](./vwf.md) — the workflow this plugin adapts; its
  `assets/design-adapter.md` is the authoritative payload contract.
