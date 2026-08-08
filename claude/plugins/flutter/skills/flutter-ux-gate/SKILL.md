---
name: flutter-ux-gate
description: Run a Flutter UI slice's visual and accessibility checks, returning
  findings in vwf's UX-gate vocabulary. Invoked by vwf's `execute-ux-reviewer`
  for a project whose stack this plugin owns — not a general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: medium
---

# flutter-ux-gate

vwf's `execute-ux-reviewer` knows a UI slice must have its screens rendered and
scanned. It does not know how. This skill is the how, for a Flutter project.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked by vwf — and the failure is silent, not
> an error. vwf would see no gate and report `rendered: n/a` forever.

## Inputs

The reviewer passes the slice, the changed screens, the path to
`docs/blueprint/design-system.md`, and the flow's Screens contract. You run the
checks. **You do not judge** — conformance against the design system is the
reviewer's call, and duplicating it here would produce two verdicts that can
disagree.

## What to do

A Flutter surface is checked as **tests**, headless. Never boot a simulator
interactively.

1. **Visual** — run the project's golden tests (`flutter test --tags golden`, or
   whatever the repo's canonical task is; read its task list rather than
   assuming). Point the reviewer at the failure images the runner writes on a
   diff.

   **A changed screen with no golden at all is not a pass.** Report it as a
   finding, so it reaches vwf as a spec gap rather than as silence.
2. **Accessibility** — run `flutter_test`'s accessibility guidelines:
   `meetsGuideline(textContrastGuideline)`,
   `meetsGuideline(androidTapTargetGuideline)`,
   `meetsGuideline(iOSTapTargetGuideline)` and
   `meetsGuideline(labeledTapTargetGuideline)`. A failed guideline is the
   equivalent of a WCAG A/AA violation; report it at that severity so vwf can
   apply one rule across every stack.
3. **Return** the payload below. Report what happened, not what should have.

## Return contract

```yaml
rendered: ok | n/a
reason: <one line> # required when n/a
artifacts: [ <path>, … ] # golden failure images, for the reviewer to read
findings:
  - severity: <critical | high | medium | low>
    screen: <screen>/<state>
    what: <the violation, in one line>
    where: <guideline or golden name>
```

**`n/a` is a legitimate answer and must be honest.** No golden test target, a
suite that would not run, a toolchain that is absent — each is a `reason`, and
vwf carries it to the final human gate rather than downgrading the slice to a
code-only review. Reporting `ok` when nothing ran is the one failure mode this
skill exists to prevent.
