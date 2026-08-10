# Mode: prompt &lt;flow&gt;

Read this when the invocation is `prompt <flow>`. The `import` mode never needs
it except for the **Canvas conventions** section below, which names the file
`import`'s step-5 fold reads back.

## Canvas conventions

The standing rules live in the **canvas project's own CLAUDE.md** — and `prompt`
writes and maintains its repo-side source,
`docs/prompts/screens/<project>/CLAUDE--<platform>.md` (one per pinned design
project): the naming contract (pages, frame codes, the `index--<platform>`
stitch), the revise-in-place rule, the interactive-journey mandate (wired
navigation, the happy path clickable end to end and stitched into its index —
never a static page), the **standing tweak set** on every coded frame:
`darkMode` (default **on**), `frame` (default **on**, the device frame matched
to the platform — the mobile and tablet frames include the camera notch/cutout
for a true visual, desktop a browser-chrome frame, the in-car platforms the OS
display frame with its template constraints), one tweak per pinned **sad
state**, and one tweak per pinned **conditional product state** (empty data,
entity-state variants — product states, not sad paths) — plus stub treatment for
out-of-flow screens, the product one-liner, and the goal vocabulary from
`product.md`. Generated sections are **regenerated in place**; the **Project
conventions (canvas-owned)** section — conventions discovered while designing —
is preserved verbatim, with `import` folding canvas-side additions into it. The
user sets the file as the canvas project's CLAUDE.md whenever it is new or its
generated sections changed. **Briefs never restate the standing conventions** —
a brief is the **wireframe-level, per-flow payload only**: the page name (the
sync key), a goal line, the steps and entry points, and per-screen (by code)
purpose/navigation/forms/**components with their rules** plus the pinned states
its tweaks must cover. No design/visual instructions — no tokens, type, spacing,
or styling: the canvas picks the design system up from its Design System project
and decides visual treatment in its chat. What a screen **shows** and how it
**behaves** is contract — the components, their clickability/visibility
conditions, and their pinned content are transcribed from the flow doc's
Components blocks, never left for the canvas to decide.

## Steps

1. **Gather context.** Read the flow doc (steps, Screens rows — codes, states,
   deviations — the `Serves:` goal, and for an in-car flow the `Subset of:`
   parent), `product.md` (the served goal for the brief's Goal line, and every
   goal for the conventions file's goal vocabulary), and the registry entry for
   the flow's UI project (type, platforms). **The flow's platform files** decide
   which briefs it gets: one brief per `<platform>.md` in the flow folder,
   listed in `index.md`'s Platforms table. A UI flow with no platform file is
   format drift: say so and nudge `/skill:vwf-setup`, then elicit the platform set for
   this run. The exception is a project whose only platform is `cli` — a
   terminal surface has no screens and no canvas, so its flows get no briefs;
   say so and stop, do not treat it as drift. Recall parked UX points (mempalace
   room `gaps`, tag `parked`) so the brief's Out of scope section carries them;
   skip silently if mempalace is down. Never touch the canvas in this mode.
2. **Write one brief per platform** from the screen-prompt template to
   `docs/prompts/screens/<project>/<NNN>-<flow>/<platform>.md` — the prompt tree
   mirrors the flow's blueprint path **exactly** (format 15: same folder shape,
   same platform filenames — `100-home/mobile.md` in the flows tree yields
   `100-home/mobile.md` in the prompts tree). One brief per platform file the
   flow has, its screens transcribed from that file. Each brief commissions
   exactly **one page** (`<flow>--<platform>` — the name is exact, the import
   sync key) and lists every screen **by its pinned Code** with purpose,
   navigation (from the step order), forms, its **components and their rules** —
   transcribed from the row's Components block: each element the screen displays
   with when it is visible/enabled, what activating it does, and its
   contract-pinned content — and the pinned sad + conditional states its tweaks
   must cover; entry points come from the flow's Trigger & Actors, the Goal line
   from the flow's `Serves:` link. A flow doc without Components blocks yet
   (pre-format-12) gets them derived provisionally from its steps, states, and
   actions — flagged in the brief's Out of scope and nudging a
   `/skill:vwf-blueprint <flow>` pass to pin them. **A brief is the full flow
   blueprint every time**: on a revision, regenerate the whole file in place
   (git history keeps the prior brief; the canvas reconciles its page against
   the latest brief per the revise-in-place convention) — never write a
   change-note brief. The brief stays the compact per-flow payload — the
   standing conventions live in the canvas project's CLAUDE.md (see Canvas
   conventions) and are never restated; no design/visual instructions (no
   tokens, type, spacing, or component styling) — the canvas resolves the design
   system from its Design System project and decides visual treatment in its
   chat; components, rules, and contract-pinned content are payload, never
   restated as design direction. Screens with no contract yet (a draft flow) are
   described from the steps, with provisional codes in step order.
3. **Maintain the canvas conventions file** — one per platform brief written:
   regenerate `docs/prompts/screens/<project>/CLAUDE--<platform>.md` from the
   adapter's conventions template (the product one-liner and goal vocabulary
   from `product.md`, this platform's Layout block, the naming contract,
   behavior conventions, and standing tweak set), **preserving the "Project
   conventions (canvas-owned)" section verbatim** (seeded empty in a new file).
4. **Deliver the files — nothing else.** The brief files are the deliverable:
   say where they are and that the user pastes each into the canvas chat — and,
   when a `CLAUDE--<platform>.md` is new or its generated sections changed, that
   they set it as that canvas project's CLAUDE.md. Never push anything via the
   design tool's MCP, never `put_conversation`, never run a brief.
5. **Commit** the prompt + conventions files via `/skill:vwf-git-workflow`
   (`docs(prompts): screens brief for <flow>`).
6. **Stop.** The canvas session is the user's — iterate as long as needed; when
   satisfied, run `/skill:vwf-screens import <flow>`.
