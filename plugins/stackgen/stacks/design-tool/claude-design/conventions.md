# Claude Design — conventions

A canvas tool: designed pages live in a canvas **project**, one per registry
project and platform, and are read back over Claude Design's own MCP server.

**All three import surfaces are real.** Screens, design system and review
conversations each have somewhere to read from, so none of them may answer
`n/a` — an empty payload here means the design was never made, and saying so
is the point.

**The naming contract is load-bearing.** Pages are `<flow>--<platform>` and
frames carry the pinned screen codes. A frame whose name yields no recoverable
code is returned with `code: null` and a note — never a guessed code, because
the code is the join key and a wrong one silently maps a design onto the wrong
contract row.

**Reach is over MCP**, wired into the project's own `.mcp.json` at
materialization behind its own consent line. Nothing about the server is held
in a plugin manifest any more.

The three import skills land at **fixed names** in the repo's own
`.claude/skills/` — `design-import-screens`, `design-import-design-system`
and `design-import-conversations`. vwf invokes those names; it never
constructs one from configuration, and it never learns which tool answered.
