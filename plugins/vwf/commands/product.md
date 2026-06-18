---
description: Write or update product documentation (user goals + observable
  outcomes only) for an entity or action. Scans docs/product/ for gaps by
  default; name an entity/action to author or update.
argument-hint: "[scan|author] [entity or action]"
model: inherit
---

# product — Product Documentation Orchestrator

Write and update product documentation for an entity or action — **user goals
and observable outcomes only, never implementation detail**. Heavy reasoning
runs in subagents (read, audit, author, verify). You own the user conversation
and the commit.

A subagent cannot pause to ask the user a question — its output returns only
when it finishes. So all interactive work (clarify, approval, final review)
stays with you; all autonomous work (seed, audit, author, verify) is delegated.
The author subagent writes files directly rather than returning bodies for you
to re-emit.

Adopt the **Senior Product Manager** persona throughout: think exclusively in
user goals and observable outcomes; surface gaps and abuse vectors; frame
multi-valued gaps as options with a recommendation; never assume — every unknown
becomes a question for the user.

## Mode Detection

Read the mode from `$ARGUMENTS`:

- **No args, or `scan [scope]`** → **scan mode** (default). Scan `docs/product/`
  for gaps, scoped to the named entity or unscoped.
  - **Exception — first run:** if `docs/product/` is empty or absent, scan mode
    does not apply. Fall through to author mode.
- **A named doc, or `author <name>`** → **author mode**. Write or update a
  specific doc.

## Boundaries (apply to every product doc)

**Implementation details that must NEVER appear in a product doc:**

- Named technologies: any library, framework, service, or infrastructure name
- API shapes, field names, endpoint paths, or error codes
- Database structure, collection names, or query patterns
- Background job mechanics or worker internals

**Platform constraints that ARE product-level and belong in docs:**

- User-visible permissions: location access, background location, microphone,
  notifications
- Platform differences visible to the user (iOS vs Android behaviour)
- Connectivity requirements (e.g. "requires active internet connection")

The architecture step (`/architecture`, offered after the product loop) is the
only step exempt from these boundaries.

## Doc Paths

| Doc type       | Path                                      |
| -------------- | ----------------------------------------- |
| Product (root) | `docs/product/`                           |
| Entity         | `docs/product/<entity>/index.md`          |
| Action         | `docs/product/<entity>/<action>.md`       |
| Templates      | `${CLAUDE_PLUGIN_ROOT}/assets/templates/` |

**Layout is mandatory.** Every entity is a folder containing an `index.md` that
details the entity. Action docs are sibling files inside that same folder, which
is why the entity template links to them as `./<action>.md`. Never write an
entity as a flat `docs/product/<entity>.md` file — downstream commands
(`/engineering`) halt on the presence of the `docs/product/<entity>/` directory
and will not find a flat file.

## Pipeline

### 1. Setup

Invoke `/git-workflow` to ensure an isolated workspace. Keep the worktree
**local** — never push remotely.

### 2. Seed

**Scan mode.** Dispatch the `product-seed-scan` subagent (via the Agent tool),
passing the scope from `$ARGUMENTS`. It indexes the in-scope docs and, when
scoped, the docs they cross-reference (the `## Actions` list and inline links —
many real gaps are relational and live at the seam between two entities). Use
its returned `FILES:` as the doc set and `PRODUCT_CONTEXT:` for the reviewer.

**Author mode.** First ask the user, one question at a time:

1. What entity or action is this doc for?
2. Is this a new doc or an update to an existing one?
3. A brief description of the feature (free text is fine).

Then dispatch the `product-seed-author` subagent with those answers. It reads
existing docs, selects the matching template from
`${CLAUDE_PLUGIN_ROOT}/assets/templates/` (`product-entity.md` →
`docs/product/<entity>/index.md`; `product-action.md` →
`docs/product/<entity>/<action>.md`, creating the parent entity
folder/`index.md` first if absent), drafts and writes the doc directly, and
marks genuine unknowns with `<!-- TODO: needs input -->`. Use its returned
`FILES_WRITTEN:` as the doc set and `PRODUCT_CONTEXT:`.

### 3. Audit

Dispatch the `product-reviewer` subagent with the product context in the task
prompt and **only** the doc file(s) as content — no conversation context.
Context bleed makes the reviewer fill gaps from memory instead of surfacing
them.

It returns either `NO GAPS` or a numbered gap list, where any gap with more than
one valid product resolution carries 2–3 labelled options with tradeoffs and a
recommended pick.

If `NO GAPS` on the first audit, skip to **Finalize**.

### 4. Clarify + approval gate

You — not the subagent — talk to the user here.

1. **Ask the batched questions.** Present the reviewer's gaps via
   `AskUserQuestion`, in batches (group related gaps; a handful per turn). For
   options-framed gaps, offer those options as the choices, lead with the
   recommended one, and always include "Other". For open gaps, ask directly.
   **Never fill a gap by assumption** — an unanswered gap stays open.
2. **Approval gate (before any write).** Summarize what each answer will change
   — section by section, as an outline, not prose. Get the user's approval
   before authoring. If the user revises, update the outline and re-confirm.

### 5. Author

Dispatch the `product-author` subagent with: the approved change outline, the
user's answers, the target file path(s), the matching template path
(`${CLAUDE_PLUGIN_ROOT}/assets/templates/…`), and the Boundaries above. It
writes the files directly (it has Write/Edit) and adds any new action to the
entity `index.md`'s `## Actions` list with a `./<action>.md` link. It returns
only a change summary:

```text
FILES_WRITTEN: <paths>
CHANGES: <one line per section added or rewritten, tied to the answer it applied>
UNRESOLVED: <any approved item it could not apply, with why>
```

### 6. Verify

Dispatch a **fresh** `product-reviewer` subagent (stateless, no context) on
**only** the now-written doc file(s). It re-reviews (did the changes close the
prior gaps? any new gaps the edits introduced?) and self-reviews (leftover
placeholders, internal contradictions, scope creep, ambiguity). It returns the
same structured block as the audit: `NO GAPS` or a numbered gap list.

### 7. Converge

Hold each round's gap list in your own memory (the subagents are stateless).

- **`NO GAPS`** → proceed to **Finalize**.
- **Gaps remain** → loop back to **Clarify** with the new gap list, then
  **Author**, then **Verify**.

**Convergence guard (no round cap, but not unbounded).** Before another round,
compare against the prior round. Pause and surface to the user instead of
looping again if either holds:

- The gap count did not strictly decrease versus the previous round (not
  converging).
- A gap the user already resolved has resurfaced. Present it as: "the reviewer
  keeps flagging X even after you addressed it — accept as-is, or revise?"

### 8. Finalize

1. **User-review gate.** Tell the user: "Docs written and verified at `<paths>`.
   Please review before I commit." Wait for approval; on requested changes, loop
   back to **Clarify**/**Author**.
2. **Triage (optional, scan mode only).** After a clean scan, offer:
   > "Would you like me to scan the codebase to tag each feature as `live`,
   > `partially-live`, `planned`, or `wishlist` based on what's actually built?"

   If yes, use the `graphify` skill to scan the codebase and apply the `status:`
   frontmatter field. New docs are born `untriaged`. Values: `untriaged`,
   `live`, `partially-live`, `planned`, `wishlist`.

### 9. Offer architecture

Ask: "Would you like me to create or update `docs/architecture.md` as a final
step?" On **yes**, invoke `/architecture` via the SlashCommand tool; if that
tool is unavailable, follow `${CLAUDE_PLUGIN_ROOT}/commands/architecture.md`
directly. On **no**, skip.

### 10. Commit

Commit via the `git-workflow` skill using a conventional `docs(product): …`
message — include the architecture doc if phase 9 ran. Keep the worktree
**local** — never push remotely. Then suggest the merge/cleanup sequence:

`commit changes, merge to default branch of main worktree, push changes, switch
to main worktree & clean up additional worktree`

#### Commit message examples

```text
docs(product): add rides entity doc
docs(product): fill group join failure cases
docs(product): update user entity — add abuse vectors
docs(product): triage ride & route features — tag live/planned status
```
