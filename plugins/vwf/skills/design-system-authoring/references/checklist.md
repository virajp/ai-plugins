# Design System Pre-Delivery Checklist

The gate for `design-system.md`. The doc passes only when:

- [ ] Brand & Mood states the product's brand personality/mood — the style
      direction the tokens, type, and motion trace back to.
- [ ] Color tokens are semantic/role-based; every text/surface pairing meets
      contrast (4.5:1 text, 3:1 large/UI); dark values present if dark mode is
      in scope.
- [ ] Typography: families named with intent; a complete type scale.
- [ ] Spacing scale, grid, breakpoints (with behavioral intent), radius, and
      elevation defined for what the product uses.
- [ ] Motion: duration/easing tokens, principles, and a reduced-motion rule.
- [ ] Accessibility standard stated with a conformance target and concrete
      contrast / keyboard / focus / target / semantics rules.
- [ ] Global component behaviors defined for buttons, inputs/forms, overlays,
      feedback, and empty/loading/error states.
- [ ] Anti-patterns listed.
- [ ] Terminal UX (only when a project declares platform `cli` in
      `.config/vwf.yaml`): output formatting, color semantics + no-color rule,
      progress conventions, error shape + exit codes, help/naming — all pinned.
- [ ] No realization leaked: no component-library or CSS-framework names, no
      design-file references, no raw CSS.
- [ ] Minimal: only tokens, scales, and behaviors the product actually uses.
- [ ] Open Questions hold anything genuinely undecided — no silent assumptions.
