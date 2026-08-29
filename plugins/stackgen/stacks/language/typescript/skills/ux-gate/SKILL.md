---
name: ux-gate
description: Render a web UI slice's changed screens and run an accessibility
  scan, returning findings in vwf's UX-gate vocabulary. Invoked by vwf's
  UX-review stage for a project whose stack this plugin owns — not a
  general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: medium
---

# typescript-ux-gate

vwf's UX-review stage knows a UI slice must have its screens rendered and
scanned. It does not know how. This skill is the how, for a web project built on
this plugin's stack.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked by vwf — and the failure is silent, not
> an error. vwf would see no gate and report `rendered: n/a` forever.

## Inputs

The reviewer passes the slice, the changed screens, the path to
`docs/blueprint/design-system.md`, and the flow's Screens contract. You render
and scan. **You do not judge** — conformance against the design system is the
reviewer's call, and duplicating it here would produce two verdicts that can
disagree.

## What to do

1. **Boot the project** with its own `dev` task, per the harness contract. If
   the screens need data, bring up the project's local stack first and wait on
   its readiness signal. Never hand-roll infrastructure, and never start
   anything interactively.
2. **Capture each changed screen** in every state you can drive: default, and
   where reachable empty / loading / error / success. Use the browser driver the
   repo already depends on — check its manifest before reaching for one. Write
   captures under the worktree's scratch/tmp area; they are working artifacts
   and are never committed.
3. **Scan each captured screen** for accessibility violations at WCAG A/AA,
   using the scanner the repo already depends on.
4. **Return** the payload below. Report what happened, not what should have.

## Return contract

```yaml
rendered: ok | n/a
reason: <one line> # required when n/a
artifacts: [ <path>, … ] # what you captured, for the reviewer to read
findings:
  - severity: <critical | high | medium | low>
    screen: <screen>/<state>
    what: <the violation, in one line>
    where: <rule id or selector>
```

**`n/a` is a legitimate answer and must be honest.** No `dev` task, no browser
driver in the manifest, a server that would not boot — each is a `reason`, and
vwf carries it to the final human gate rather than downgrading the slice to a
code-only review. Reporting `ok` when nothing rendered is the one failure mode
this skill exists to prevent.

---

**This skill is materialized into the repo's own `.claude/skills/ux-gate/`.**
vwf invokes it by that fixed name rather than constructing
`<plugin>-ux-gate` from a stack pin — there is no plugin name to construct
from once stacks are packs, and a name built from configuration is a name
that can silently resolve to nothing.
