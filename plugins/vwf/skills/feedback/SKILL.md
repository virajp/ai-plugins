---
name: feedback
description: The front door for production feedback — a bug, a metric reading,
  a UX
  complaint, or a feature idea. Classifies it and routes it into the doc and
  command that fix it (gaps → blueprint/plan, metrics → product, UX →
  design-system/screens). Durable even when mempalace is down.
argument-hint: "[the feedback — paste a bug report, metric, or complaint]"
model: sonnet
effort: xhigh
disable-model-invocation: false
---

# feedback — Route Production Feedback Into the Workflow

Production is the strongest reviewer vwf has. This command takes what it says —
a bug report, a metric reading, a user complaint, a feature idea — and routes it
to where it gets **fixed**, not to a backlog. One intake at a time; every routed
item lands in a durable doc, so nothing depends on memory being up.

## Pipeline

### 1. Understand & classify

Read the feedback from `$ARGUMENTS` (or ask for it). Read
`docs/blueprint/product.md` (goals, metrics) and skim the entity docs it
plausibly touches. **Recall** rooms `gaps` and `problems` per
`${CLAUDE_PLUGIN_ROOT}/assets/memory.md` — if this item is already known, say so
and show its status instead of re-filing it.

Classify — confirm by MCQ when ambiguous, per
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`:

| Kind               | Signal                                           |
| ------------------ | ------------------------------------------------ |
| **Behavior bug**   | The product violates what the blueprint promises |
| **Blueprint hole** | The blueprint never pinned this behavior down    |
| **Metric reading** | A number for a `product.md` metric (hit or miss) |
| **UX issue**       | Rendered experience contradicts design-system/UX |
| **Feature idea**   | A want that serves (or implies) a product goal   |

### 2. Route

One route per item — each ends in a **doc edit now** (durable) plus the **offer
of the fixing command**:

- **Behavior bug** → the blueprint is right, the code is wrong: file to room
  `gaps` (tagged by entity/flow) and offer `/vwf:plan <slice>` for a fix cycle.
  Deferred → one line in the target entity doc's **Open Questions** (or the flow
  in `integration.md`): what production does vs what the doc promises.
- **Blueprint hole** → file to room `gaps` and offer `/vwf:blueprint
  <entity>`
  to pin the behavior down. Deferred → the same Open Questions line.
- **Metric reading** → append a dated row to the **Metric readings** appendix of
  `product.md` (create the appendix on first use — it is a log, not part of the
  reviewed contract). A **miss against target** → offer `/vwf:product` to
  re-rank slices / revisit the goal; a hit → just recorded.
- **UX issue** → record it against the entity's **Screens** section (a deviation
  or open question at the exact screen/state) and offer `/vwf:design-system`
  (language-level) or `/vwf:blueprint <entity>` (screen-level).
- **Feature idea** → never straight to code: offer `/vwf:product` (does it serve
  an existing goal? re-rank; a new goal? add it) — then the normal
  `blueprint → plan → execute` path. Deferred → a row in `product.md`'s Metric
  readings appendix is wrong for this; instead note it under the served goal's
  slice-priority row as a candidate, marked unranked.

### 3. Persist & commit

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`: bugs/holes to room `gaps`,
readings and routing decisions to room `decisions`. Skip silently if mempalace
is down — the doc edits from step 2 are the durable record.

Commit any doc edits via `/vwf:git-workflow` (`docs:` or `blueprint(...)`
message). If the user accepted a fixing command, hand off to it now.

## Metric readings appendix (product.md)

Maintained by this command (and read by `/vwf:product` on re-runs):

```markdown
## Metric readings

<!-- Dated log, appended by /vwf:feedback — not part of the reviewed contract. -->

| Date         | Goal                   | Reading | Target  | Verdict  |
| ------------ | ---------------------- | ------- | ------- | -------- |
| <yyyy-mm-dd> | [<goal>](#goal-<slug>) | <value> | <value> | hit/miss |
```
