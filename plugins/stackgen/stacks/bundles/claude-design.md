---
name: Claude Design
axis: design
kind: design-tool
components:
- design-tool/claude-design@0.1.0
---

# Design — Claude Design

The canvas Anthropic hosts at claude.ai/design. Designed pages live in a canvas
project — one per registry project and platform — and are read back over the
tool's own MCP server, which this bundle wires into the repo's `.mcp.json`
behind its own consent line.

**All three import surfaces are real here**, which is why none of them may
answer `n/a`: screens, design system and review conversations each have
somewhere to read from, so an empty payload means the design was never made.

The slug is the `projects.<name>.design` token itself, so pinning this from the
menu and writing the config key are one act.
