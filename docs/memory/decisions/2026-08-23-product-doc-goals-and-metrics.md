# Decisions — the product doc: goals, metrics, and what was left out

**Date** 2026-08-23 · **Branch** `main` (worked in place, per the WS4 decision)
· **Plan** `docs/plans/plugin-support/04-onboard-this-repo.md` step 2

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`. Records only what
`docs/blueprint/product.md` does not already state verbatim.

## The problem framing came from the user, not the proposed options

Three framings were offered — "agents skip durable engineering discipline"
(grounded in the 2026-08-17 north-star record), "no repeatable path from idea to
shipped", and "agent work leaves no source of truth". **All three were
rejected** in favour of the user's own: *this provides a method for Claude Code
to build products, following the workflow documented in `readme.md`*.

That answer is solution-shaped, so the failure modes it prevents were elicited
separately and became the Problem section's four bullets. Worth knowing on a
re-run: the north-star framing (engineering principles most developers don't
apply) is **not** how this product describes itself, despite being the recorded
strategic rationale for the two-plugin convergence. The two are compatible but
they are not the same sentence, and the doc uses the user's.

## Three personas, not one

The readme's own caveat ("sized for a solo developer or a small team") suggested
a single persona. Overruled: fresh-start, adopting and maintainer were kept
**separate because their core needs differ**, and `docs/how-to/` already ships
them as three distinct journey guides. The maintainer is a genuine user rather
than the builder — WS4, which runs this repo through its own workflow, is what
makes that true.

## Two metrics were chosen against a simpler automated alternative

Both times the more meaningful signal beat the cheaper one:

- **Blueprint authority** measures *planning runs that complete without routing
  a gap back into the blueprint* (target ≥ 80%). The rejected alternative — the
  coverage stamp plus a clean coherence review — is fully automated but weaker:
  it proves the blueprint is **internally consistent**, not that it still
  **matches the code**. A third option (docs-sync findings per change) was
  dropped for conflating blueprint drift with README drift.
- **Dependency ordering** measures *plans whose transitive chain resolved before
  execution* (target 100%) rather than *execute runs halting on an unbuilt
  dependency* (target 0). Both signals exist today; the chosen one catches the
  problem **one stage earlier**, at planning rather than as an execution
  failure.

## The flow-ambiguity risk was deliberately left out

Offered as a product-level risk and **deselected**: folding all fifteen plugins
into one `plugins` project means the project name no longer says which plugin a
flow describes, so every flow must name it itself.

It remains live and recorded — in
`docs/memory/decisions/2026-08-23-onboard-this-repo-as-a-vwf-product.md` and in
WS4's plan doc, which keeps the argument visible. The judgment here is only that
it is an **authoring constraint for the sweep**, not a risk to the product's
goals. Do not re-add it to `product.md` without a reason; do expect it during
the blueprint sweep.

## Eight goals, six of them machine-checkable

Unusual for a product doc and worth preserving: six of the eight metrics are
already measurable by something that runs today — the two continuous-integration
checks, the run journal, the plan documents, the onboarding diff. Only
`#goal-authoritative-blueprint` and `#goal-one-command-start` need a judgment or
a release to read. **Do not weaken a metric to make it automatic** — the two
that aren't automatic are the two that matter most to the users.

## Not done in this run

- **No docs-sync.** `/vwf:product`'s docs-sync step is update-mode only, and
  this was create mode. Separately noticed and left alone: `readme.md` says
  "thirteen more plugins" where there are now fourteen besides `vwf`.
- **No goal is served by a flow yet.** Expected — the blueprint sweep creates
  the `Serves:` edges, and it is the one coverage condition with no `N/A`
  escape.
