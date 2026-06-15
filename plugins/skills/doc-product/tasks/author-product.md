<purpose>
Write or update a specific product doc (an entity or an action) from the matching
template, then drive it to completeness through the stateless reviewer loop. Also
the fallback when no product docs exist yet.
</purpose>

<user-story>
As a product owner, I want a specific entity or action documented from a
consistent template and reviewed for gaps, so that the doc fully captures user
goals and observable outcomes before engineering relies on it.
</user-story>

<when-to-use>
- The user asks to write or update a specific product doc
- First run, when `docs/product/` is empty or absent (fallback from scan mode)
</when-to-use>

See the entry point for **Doc Paths**, the **Reviewer Prompt** setup, and the
implementation-detail boundaries that all product docs must respect.

<steps>

<step name="setup" priority="first">
Invoke `skills:git-workflow` — keep worktree **local**, never push remotely.
</step>

<step name="intake">
Read all existing docs in `docs/product/` to understand the domain and
conventions already established. Then ask the user:

- What entity or action is this doc for?
- Is this a new doc or an update to an existing one?
- Provide a brief description of the feature (free text is fine here).
  </step>

<step name="select_template">
Select the matching template from `.claude/skills/doc-product/templates/` and
resolve its destination path:

- `product-entity.md` for entities (User, Ride, Group, etc.) →
  `docs/product/<entity>/index.md`. If the `docs/product/<entity>/` folder does
  not exist, create it.
- `product-action.md` for actions (Create Ride, Join Group, etc.) →
  `docs/product/<entity>/<action>.md`, a sibling of the entity's `index.md`. The
  parent entity folder must already exist; if it does not, create the entity
  `index.md` first (or ask the user whether to).
- If no template matches, derive structure from the closest existing product doc
  and note the assumption to the user.
  </step>

<step name="draft">
Draft the doc using the template. Fill every section. Mark genuinely unknown
sections with `<!-- TODO: needs input -->` rather than leaving them blank or
inventing content. When an entity gains a new action, add it to the entity
`index.md`'s `## Actions` list with a `./<action>.md` link.
</step>

<step name="reviewer_loop">
Spawn a `model: opus` subagent (the `opus` alias resolves to the latest Opus
model) with the **Reviewer Prompt** (see entry point) and **only** the draft
doc — no conversation context.

If gaps found → resolve one at a time (MCQ), update, re-review with a fresh
subagent. Apply the **same convergence guard** as `scan-product` (keep each
round's gap list in orchestrator memory; pause and surface if the gap count did
not strictly decrease or a resolved gap resurfaced; otherwise loop until the
reviewer returns `NO GAPS`).

If no gaps → suggest:
`commit changes, merge to default branch of main worktree, push changes, switch
to main worktree & clean up additional worktree`
</step>

</steps>

<output>
A new or updated product doc at the correct mandatory path
(`docs/product/<entity>/index.md` or `docs/product/<entity>/<action>.md`), with
every section filled and the reviewer returning `NO GAPS`.
</output>

<acceptance-criteria>
- [ ] Existing docs read for domain/convention before drafting
- [ ] Correct template selected and resolved to the mandatory folder layout
- [ ] Every section filled; unknowns marked `<!-- TODO: needs input -->`
- [ ] New actions linked from the entity `index.md` `## Actions` list
- [ ] Reviewer ran on the draft only, with convergence guard, ending on `NO GAPS`
</acceptance-criteria>
