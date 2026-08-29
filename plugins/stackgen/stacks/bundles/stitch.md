---
name: Google Stitch
axis: design
kind: design-tool
components:
- design-tool/stitch@0.1.0
---

# Design — Google Stitch

Prompt-to-UI at stitch.withgoogle.com. Fast for screens, and honest about what
it does not hold.

**Stitch stores no design system.** The design-system import says so and must
not reconstruct one by inference from rendered screens — an invented design
system would then be treated as the product-wide contract every screen
references. **Conversations may answer `harvested: n/a`**, the one import
allowed to: a tool with no review channel is a fact, where an empty screens
payload would be a design nobody made.

The slug is the `projects.<name>.design` token itself.
