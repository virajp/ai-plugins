# import-screens — Claude Design

The project's design tool resolved to `claude-design`: designed pages live on
the claude.ai/design canvas, reachable through the DesignSync harness tool or
this plugin's MCP server.

## What to do

1. **Resolve the canvas project** from the pin. Per
   `<%= it.root %>/assets/canvas-push.md`, each platform has its **own**
   design project — never read a different platform's canvas to fill a gap.
2. **Find the page** named `<flow>--<platform>` under the naming contract. A
   missing page means the flow was never designed for this platform: return an
   empty `screens: []` and say so in `notes`. That is a real answer, not a
   failure.
3. **Read the frames.** Each frame's name carries the pinned **screen code**
   (`<NNN><letter>`) — that code is the join key vwf diffs on. Use `list_files`
   / `read_file`, and `render_preview` when a frame's structure is only legible
   rendered.
4. **Extract per screen**: the code, name, purpose, the components it is built
   from (with each component's role and the states it shows), and the
   screen-level states present on the canvas.
5. **Normalize into the payload** exactly as the contract specifies, with
   `source.tool: claude-design` and `source.reference` set to the canvas project
   and page.

## Rules

- Never edit the canvas. Import is a read.
- A frame whose name carries no recoverable code is returned with `code: null`
  plus a `notes` line — never a guessed code.
