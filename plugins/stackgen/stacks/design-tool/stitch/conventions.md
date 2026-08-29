# Google Stitch — conventions

Prompt-to-UI. It fits vwf well on screens and badly on design systems, and the
skills say which is which rather than averaging them.

**Stitch stores no design system.** The design-system skill leads with that and
**must not reconstruct one** by inference from screens — a design system
invented from rendered output is a fabrication that would then be treated as
the product-wide contract every screen references.

**Conversations have no durable surface**, so that import may answer
`harvested: n/a`. It is the one of the three allowed to: a tool with no review
channel is a fact, where an empty screens or design-system payload would be a
design nobody made.

The three import skills land at **fixed names** in the repo's own
`.claude/skills/` — `design-import-screens`, `design-import-design-system`
and `design-import-conversations`. vwf invokes those names; it never
constructs one from configuration, and it never learns which tool answered.
