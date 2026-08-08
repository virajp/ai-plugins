# Screen Render & Visual Review (§6a)

Read this when §6a fires — the pass authored or materially changed a flow's
`## Screens` section. A flow with no Screens section skips §6a silently and
never needs this file.

1. **Render (local, never canvas).** Ensure `docs/scratchpad/` is gitignored
   (`git check-ignore -q docs/scratchpad`; if not, append `docs/scratchpad/` to
   `.gitignore` — the line rides this pass's commit). Dispatch a fresh
   `mockup-generator` subagent **per platform file** the pass touched (that
   platform's Screens table + Components blocks + deviations, the design-system
   doc(s), and its render dir
   `docs/scratchpad/<project>/<NNN>-<flow>/<platform>/` — overwritten in place;
   dispatch them in a single message to run concurrently) — the default view
   plus **every pinned state**; the ui-ux-contract bar makes error and empty
   pins mandatory, so the sad paths are always in the set. `frontend` (Flutter)
   screens render as HTML approximations at the design system's viewport for
   that platform. Mockups are **never pushed to Claude Design**.
2. **Hand over.** Give the user the absolute file paths to open in a browser,
   grouped per platform, then record each rendered platform in
   `design.flows_rendered` as `<project>/<NNN>-<flow>/<platform>` (the
   render-currency stamp).
3. **Review.** The user reviews the rendered screens. Remarks route **now**:
   screen-level → the Screens table / recorded deviations (re-elicit, update the
   doc; a material contract change re-runs the per-doc reviewer (§5) and
   re-renders — back to 1); visual-language-level → flag for
   `design-system`, parked per the elicitation protocol's parked-scope rule
   when out of this pass's scope.
4. **Design-first (alternative to 1–3).** The user may prefer Claude Design to
   *design* these screens rather than review vwf's contract-derived render: run
   `screens prompt <flow>` (it writes the per-platform briefs under
   `docs/prompts/` — files the user pastes into the canvas chat), record
   `screens/<project>/<NNN>-<flow>/<platform>` in `blueprint.remaining` —
   deferred by design, not skipped — and continue the sweep. The later
   `screens import <flow>` closes it through a targeted pass here, folding
   what the canvas decided into the contract delta-by-delta.
5. **Skip (escape hatch).** The user may explicitly decline the review. Record
   it honestly: one line in the flow doc's Open Questions ("screens not yet
   visually reviewed") and `screens/<project>/<NNN>-<flow>/<platform>` in
   `blueprint.remaining` at stamp time (§9) — coverage stays `partial` while any
   `screens/` entry remains, exactly like any other hole.
