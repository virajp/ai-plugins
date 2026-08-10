# import-conversations — Google Stitch

The project's design tool resolved to `stitch`. **Stitch exposes no review
conversation**, so this path returns `n/a` rather than a payload.

## Why, precisely

Stitch is a generation surface: its SDK returns projects, screens, each screen's
HTML and its rendered image. That is what makes it a good fit for
`import-screens` — structure is directly legible. It is also the whole of what it
offers. There is no comment thread, no annotation layer, and no stored prompt
history addressable per screen, so there is nothing holding what a reviewer said
about a design.

## What to do

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

## Do not reconstruct one

Two temptations, both wrong here:

- **Diffing screens against the flow's Screens contract** to infer what a
  reviewer must have wanted. That is not a harvest, it is
  `vwf-screens import` — which already exists, already routes its deltas
  through `vwf-blueprint`, and does it with the user confirming each one.
  Duplicating it here would route the same delta twice by two paths.
- **Reading a screen's generation prompt as a remark.** A prompt is an
  instruction to the tool, not an observation about the result. It reads as a
  change request while carrying none of the reasoning that makes one routable.

If Stitch adds a review surface, this file is where it lands, and
`harvested: ok` becomes reachable without vwf changing at all.
