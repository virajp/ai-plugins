# Google Stitch — the design adapter reference

How vwf's three design-import skills talk to this tool. Loaded **only** when a
project's `design:` key names it — a product using one tool never loads the
others.

## Screens import

### import-screens — Google Stitch

The project's design tool resolved to `stitch`.

### Prerequisites

`STITCH_API_KEY` in the environment, and the `@google/stitch-sdk` package
reachable (`pnpm dlx` / `bunx`). Stitch's MCP server may be used instead where
it is connected; the SDK is the first-party surface and the one this path
assumes.

### Why this tool fits vwf well

Stitch returns **HTML per screen**, and vwf already reasons about screens as
self-contained HTML (that is what `/vwf:mockups` renders). Structure is
therefore directly legible — no code archaeology needed. Stitch's `generate`
also takes a **platform** argument, which maps onto vwf's platform axis.

### What to do

1. **Resolve the project.** `stitch.projects()` to list, or
   `stitch.project(<id>)` with the id vwf passes.
2. **List the screens** — `project.screens()`.
3. **Select this flow's screens.** Stitch screens are flat within a project, so
   match on the naming the design brief requested (`<flow>--<platform>`, frames
   by pinned screen code). A screen whose name carries no recoverable code gets
   `code: null` plus a `notes` line — **never a guessed code**, since the code
   is vwf's join key and a wrong one maps a design onto the wrong contract row.
4. **Read each screen** — `screen.getHtml()` for structure, `screen.getImage()`
   for the rendered reference. Extract the components the markup is built from
   (name + role), and the states it shows.
5. **Normalize into the payload**, with `source.tool: stitch` and
   `source.reference` set to the project and screen ids.

### Rules

- Report what the markup contains, not what it appears intended to convey.
- Never regenerate a screen while importing. Import is a **read**; generating
  would silently replace the design under review.

## Design-system import

### import-design-system — Google Stitch

The project's design tool resolved to `stitch`.

### Read this first: Stitch has no stored design system

Unlike Claude Design (first-class design-system objects) or Lovable (a published
`design-system.json`), **Stitch does not store a design system**. It generates
screens; any "design system" is **reconstructed** from the tokens visible in
that generated output.

Two consequences, and neither is optional:

1. **Always set `derived: true`** in the payload. vwf records this in
   `design-system.md` because the freshness guarantee is weaker: a stored system
   is authoritative until someone changes it, a derived one is a snapshot of one
   generation and can drift the next time a screen is regenerated.
2. **Re-derive on every import** rather than trusting a previous run. There is
   no upstream to diff against.

If the product needs an authoritative, stable design system, pair Stitch's
screen generation with a tool that stores one — or author `design-system.md`
in-repo. Say so plainly rather than presenting a derived snapshot as equivalent.

### Prerequisites

`STITCH_API_KEY` in the environment, and the `@google/stitch-sdk` package
reachable (`pnpm dlx` / `bunx`).

### What to do

1. **Gather the source.** `stitch.projects()` → `project.screens()` →
   `screen.getHtml()` across a representative set — enough screens to see a
   token repeat, not just one.
2. **Extract the tokens.** Look, in this order of reliability:
   - a Tailwind config's `theme.extend` (colors, fontFamily, borderRadius,
     spacing), when the output carries one;
   - CSS custom properties in `:root` / `html` blocks;
   - a CSS-in-JS theme object passed to a provider;
   - failing all of that, repeated literal values across screens — the weakest
     evidence, and worth a `notes` line saying so.
3. **Assign semantic roles.** A hex that appears on every primary action is the
   `primary` role; a near-white page background is `surface`. **State the
   inference** in `usage` rather than presenting a guessed role as declared.
4. **Components** — the recurring markup patterns across screens, with the
   variants actually observed. Do not extrapolate variants nobody generated.
5. **Accessibility** — report what the markup evidences (contrast pairs, focus
   styles, target sizes). An absent standard is `null`, never an assumed "WCAG
   AA".
6. **Set `source.tool: stitch` and `derived: true`.**

### Rules

- A value you inferred is reported as inferred. The whole risk of a derived
  system is that it reads exactly like an authoritative one.
- Never regenerate screens to "improve" the sample.

## Conversations import

### import-conversations — Google Stitch

The project's design tool resolved to `stitch`. **Stitch exposes no review
conversation**, so this path returns `n/a` rather than a payload.

### Why, precisely

Stitch is a generation surface: its SDK returns projects, screens, each screen's
HTML and its rendered image. That is what makes it a good fit for
`import-screens` — structure is directly legible. It is also the whole of what it
offers. There is no comment thread, no annotation layer, and no stored prompt
history addressable per screen, so there is nothing holding what a reviewer said
about a design.

### What to do

Return exactly:

```yaml
harvested: n/a
reason: Google Stitch exposes no design review conversation — its SDK returns
  screens, HTML and images, with no comment, annotation or review surface.
source:
  tool: stitch
```

That is the whole run. Do not call the Stitch SDK and do not spend a
`STITCH_API_KEY` on it: there is nothing to reach, and listing screens would
confirm only that screens exist.

### Do not reconstruct one

Two temptations, both wrong here:

- **Diffing screens against the flow's Screens contract** to infer what a
  reviewer must have wanted. That is not a harvest, it is
  `/vwf:screens import` — which already exists, already routes its deltas
  through `/vwf:blueprint`, and does it with the user confirming each one.
  Duplicating it here would route the same delta twice by two paths.
- **Reading a screen's generation prompt as a remark.** A prompt is an
  instruction to the tool, not an observation about the result. It reads as a
  change request while carrying none of the reasoning that makes one routable.

If Stitch adds a review surface, this file is where it lands, and
`harvested: ok` becomes reachable without vwf changing at all.
