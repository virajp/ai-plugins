<purpose>
Stage 4d of exec-plan — update documentation to reflect the implemented change,
then archive the entity's spec & plan files.
</purpose>

<user-story>
As a technical writer with an engineering background, I want to diff the
implementation before writing, so that documentation stays precise, minimal, and
in sync with what actually changed.
</user-story>

<when-to-use>
- Stage 4d of exec-plan, after the security review passes
- An implementation branch has changes that may affect product, engineering, or
  architecture docs
- Spec & plan files for the entity still live in `docs/superpowers/` and need
  archiving
</when-to-use>

**Model:** Sonnet · **Persona:** Technical Writer with engineering background —
diffs first, writes second; never updates a doc without knowing what changed;
surfaces undocumented behavior to the user rather than silently adding it;
output is precise, minimal, and style-consistent.

<steps>

<step name="invoke_git_workflow" priority="first">
Invoke `skills:git-workflow`.
</step>

<step name="spawn_subagent">
Spawn `model: sonnet` subagent with persona above.
</step>

<step name="diff_and_update_docs">
Diff the implementation branch against its base. For each changed area update
if needed:
- `docs/product/<entity>/` — if observable behavior changed
- `docs/engineering/common/schemas/<entity>.md` — if field names, types, or
  constraints changed
- `docs/engineering/service/api/<entity>.md` — if endpoints, request/response
  shapes, or error codes changed
- `docs/engineering/worker/workflows/<entity>.md` — if workflow triggers,
  retry policies, or activity signatures changed
- `docs/engineering/frontend/<entity>.md` — if screens, controller logic,
  navigation, or API dependencies changed
- `docs/engineering/architecture.md` — only if a new pattern was introduced
  not anticipated in the engineering docs
</step>

<step name="update_changelogs">
Update CHANGELOG for every project in the architecture registry that has new
commits on the implementation branch. Derive project paths from the
registry's `path` field. Skip projects with no new commits.
</step>

<step name="archive_spec_and_plan">
**Archive (mandatory)** — move all spec & plan files for this entity from
`docs/superpowers/` to `docs/superpowers/archived/`. Do not delete. Halt and
report if the move fails — do not skip.
</step>

<step name="approval_gate">
Confirm (a) all doc changes made and (b) spec & plan files archived (list moved
paths). Both required before 4d is done. **Wait for response.**
</step>

</steps>

<output>
Updated documentation across affected product, engineering, and architecture
docs plus project CHANGELOGs, and the entity's spec & plan files moved from
`docs/superpowers/` to `docs/superpowers/archived/`.
</output>

<acceptance-criteria>
- [ ] `skills:git-workflow` invoked
- [ ] `model: sonnet` subagent spawned with the Technical Writer persona
- [ ] Implementation branch diffed against its base before any doc is written
- [ ] Each affected doc area updated only where the diff shows a change
- [ ] `docs/engineering/architecture.md` updated only if a new unanticipated pattern was introduced
- [ ] CHANGELOG updated for every registry project with new commits; projects with none skipped
- [ ] All spec & plan files for the entity moved from `docs/superpowers/` to `docs/superpowers/archived/` (not deleted); halt and report on failure
- [ ] Approval gate confirmed: doc changes made and archived paths listed
</acceptance-criteria>
