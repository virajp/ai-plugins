# import-design-system — Google Stitch

The project's design tool resolved to `stitch`.

## Read this first: Stitch has no stored design system

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

## Prerequisites

`STITCH_API_KEY` in the environment, and the `@google/stitch-sdk` package
reachable (`pnpm dlx` / `bunx`).

## What to do

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

## Rules

- A value you inferred is reported as inferred. The whole risk of a derived
  system is that it reads exactly like an authoritative one.
- Never regenerate screens to "improve" the sample.
