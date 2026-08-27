# Decisions — the design system, on vwf's text-only path

**Date** 2026-08-27 · **Branch** `main` · **Command** `/vwf:design-system`
(create mode, text-only) · Records only what `docs/blueprint/design-system.md`
does **not** state verbatim.

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

**First exercise of vwf's text-only branch.** The registry declares no screen
platform — `plugins` is `system`/`[plugin]`, `installer` is `system`/`[cli]` —
so §§3–4 (the design-adapter preflight and the import) were skipped by the
skill's own rule. No canvas, no design tool, no mockups, no `docs/scratchpad/`.
Nothing was pinned under `design:` in `.config/vwf.yaml`, because there is no
tool to identify a design system with.

## Four decisions were open; four more were already in the code

The Terminal UX contract turned out to be **mostly decided already, with written
reasons**. Only four things had genuinely more than one answer:

1. **Machine mode** — pin what the code does: stdout is an executable
   `#`-commented shell plan, stderr carries everything human. Rejected: adding
   `--json` (a feature nobody asked for) and inverting to JSON-by-default (a
   breaking change to the one scriptable path).
2. **Color** — **no color**, pinned as the decision rather than as an omission.
   Accessible by construction, no `NO_COLOR` branch, identical piped and
   interactive. Rejected: semantic roles, and errors-and-warnings-only — both
   would be contract nothing implements.
3. **Exit codes** — **add `2` for usage errors.** A *change*, not a description:
   every path exits `0` or `1` today. `/vwf:plan` will see it as a delta.
4. **Voice** — terse and technical, with one clause of reason where a rule looks
   arbitrary. **Scoped to the `installer`'s runtime strings only**; the
   `plugins` markdown is governed by vwf's own `documentation-standards`, which
   declares writing style and auto-applies to `**/*.md`. Two authorities with
   disjoint domains cannot contradict each other.

**Closed from evidence rather than by asking**: the selection mechanics
(numbered rows *toggle*, empty input accepts as shown, `q`/`quit`/`cancel`
abandons, and rows whose removal would dirty a **tracked** file start
deselected, because dirtying a working tree is not a cleanup); the empty case (a
run finding nothing says so and exits `0` regardless of TTY — the
refuse-without-a-terminal rule applies only once there is something to decide);
and the 78-column help width.

**Accessibility**: *no graphical conformance standard applies*, and saying so is
the decision. WCAG's contrast, focus-order and target-size criteria have no
referent in a product that emits lines of text, and citing it would imply a
claim nothing here could evaluate. Three checkable terminal rules are the stated
target instead.

## A code defect found while grounding the contract

`cli/src/progress.ts` documents stdout as "parseable for `--dry-run | jq`". **It
is not** — the payload is `#`-commented shell, and `jq` errors on the first
character. Verified by running it.

The stream discipline the comment describes is correct and worth keeping; only
the consumer it names is wrong. **Not recorded in the blueprint** (naming a
source file there is a code-independence violation — the round-1 reviewer caught
exactly that and it was removed). Left unfixed under WS2's log-don't-fix rule.

## The reviewer loop tripped its convergence guard, and that was fine

Gap counts ran **6 → 1 → 1 → NO GAPS**; the guard fired at the second `1`.

It was not stuck. Each round found a *different*, real defect, and **both later
ones were introduced by the previous round's own fix**:

- **Round 2** caught the Voice section — added in round 1 — claiming to govern
  "every string the product emits" while Scope excluded `plugins`.
- **Round 3** caught a Help bullet, written in round 1, prescribing *how* help
  stays in sync ("generated from the flag definitions") rather than the
  guarantee. Mechanism is `plan`'s job.

**Worth knowing for future runs:** on a doc heavily edited between passes, a
flat gap count is the guard working as designed rather than evidence of a loop.
What distinguishes them is *which* gap moved, not how many there are. A fourth
pass returned `NO GAPS`, and the doc is `status: reviewed`.
