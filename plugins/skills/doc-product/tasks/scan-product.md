<purpose>
Scan `docs/product/` for gaps, resolve them through a stateless reviewer loop
with a convergence guard, and optionally triage features against the codebase.
This is the default mode of doc-product.
</purpose>

<user-story>
As a product owner, I want existing product docs scanned for gaps and brought to
completeness, so that every doc fully describes user goals, roles, failure cases,
and abuse vectors before engineering relies on them.
</user-story>

<when-to-use>
- The user asks to scan `docs/product/` for gaps — scoped to an entity or unscoped
- `docs/product/` already exists and has content
- Not applicable on first run (empty/absent `docs/product/`) — use `author-product` instead
</when-to-use>

See the entry point for **Doc Paths**, the **Reviewer Prompt** setup, and the
implementation-detail boundaries that all product docs must respect.

<steps>

<step name="setup" priority="first">
Invoke `skills:git-workflow` — keep worktree **local**, never push remotely.
</step>

<step name="read_docs">
Read all files in `docs/product/` (scoped to the entity/entities named in the
query if provided, otherwise all files). **When scoped, also load any docs the
scoped entity links to** (cross-references in its `## Actions` list or inline
links). Many real gaps are relational and live at the seam between two entities —
e.g. what happens to an ongoing ride when its host leaves the group. A scan that
loads only the named entity's files cannot see those.
</step>

<step name="reviewer_loop">
Spawn a `model: opus` subagent (the `opus` alias resolves to the latest Opus
model) with the **Reviewer Prompt** (see entry point) and **only** the doc
files — no conversation context. Context bleed causes the reviewer to fill gaps
from memory rather than surfacing them for the user.

If gaps found:

- Present the gap list to the user.
- Resolve gaps one question at a time. Each question must offer multiple-choice
  answers; include "Other (please specify)" as an option.
- Update the docs with the answers.
- Re-review with updated docs, a fresh subagent, no context.
- **Convergence guard (no round cap, but not unbounded):** the orchestrator
  keeps each round's gap list in its own memory (the reviewer subagent cannot —
  it is stateless by design). Before starting the next round, compare against
  prior rounds. Pause and surface to the user instead of looping again if either
  holds:
  - The gap count did not strictly decrease versus the previous round (the loop
    is not converging).
  - A gap the user already resolved has resurfaced (a fresh subagent
    re-interpreted "gap" differently). Present it as: "the reviewer keeps
    flagging X even after you addressed it — accept as-is, or revise?" Otherwise
    keep looping until the reviewer returns `NO GAPS`.
    </step>

<step name="triage">
After the reviewer finds no gaps, ask the user:

> "Would you like me to scan the codebase to tag each feature as `live`,
> `partially-live`, `planned`, or `wishlist` based on what's actually built?"

If yes: use `graphify` to scan the codebase and identify build status. Apply
status tags to docs using the frontmatter field `status`. New docs are born
`untriaged` (see templates) so this step can tell which docs have actually been
verified against code versus never checked. Values:

- `untriaged` — default for a new doc; never verified against the codebase
- `live` — feature is fully built and shipped
- `partially-live` — feature exists in code but is incomplete or behind a flag
- `planned` — confirmed not built; targeted for the next release
- `wishlist` — confirmed not built; planned post-launch, not yet scheduled

Then suggest:
`commit changes, merge to default branch of main worktree, push changes, switch
to main worktree & clean up additional worktree`
</step>

</steps>

<output>
Updated product docs in `docs/product/` with all reviewer-identified gaps
resolved (reviewer returns `NO GAPS`), and — if the user opted in — `status`
frontmatter tags applied per feature.
</output>

<acceptance-criteria>
- [ ] Scoped scans also loaded cross-referenced docs
- [ ] Reviewer ran on doc files only, with no conversation context
- [ ] Gaps resolved one at a time via MCQ; docs updated
- [ ] Convergence guard applied — non-decreasing gap count or resurfaced gaps surfaced to the user
- [ ] Loop ended on `NO GAPS`
- [ ] Triage offered after a clean scan
</acceptance-criteria>
