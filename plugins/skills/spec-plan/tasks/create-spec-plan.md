<purpose>
Create an implementation spec & plan for an entity, grounded in the architecture
registry, engineering docs, and the actual source code, then drive it to
completeness through a stateless plan-completeness reviewer loop. The result is a
plan executable line by line without ambiguity, ready for `exec-plan`.
</purpose>

<user-story>
As an engineer, I want an unambiguous, code-grounded implementation plan for an
entity, so that it can be executed line by line without the implementer having to
guess any open decisions.
</user-story>

<when-to-use>
- Engineering docs exist for the entity and an executable build plan is needed
- Before running `exec-plan`
- Entry point routes here to produce the spec & plan
</when-to-use>

## Doc Paths

| Doc type    | Path                |
| ----------- | ------------------- |
| Product     | `docs/product/`     |
| Engineering | `docs/engineering/` |
| Spec & Plan | `docs/superpowers/` |

<steps>

<step name="check_prerequisites" priority="first">
Halt if no engineering docs exist for the entity: "No engineering doc found. Run
`doc-engineering` first."
</step>

<step name="gather_context">
Read all product and engineering docs for the entity, then read relevant source
files. Code is the source of truth for current structure and constraints.
</step>

<step name="setup">
Invoke `skills:git-workflow`.
</step>

<step name="produce_plan">
1. Spawn a `model: sonnet` subagent with the spec-plan persona (see entry point).
2. Invoke `superpowers:brainstorming` to surface open questions.
3. Invoke `superpowers:writing-plans` to produce the implementation plan.
4. Save to `docs/superpowers/`.
</step>

<step name="ralph_loop">
After writing the spec and plan, loop until no gaps remain:

1. Load `checklists/ralph-prompt.md` as the system prompt and spawn a subagent
   with **only** the written spec and plan files — no conversation context, no
   source code, no doc files.
2. If gaps found:
   - Present the gap list to the user.
   - Re-invoke `superpowers:brainstorming` targeting those specific gaps — ask
     the user the missing questions one at a time until all open decisions are
     resolved.
   - Update the plan with the answers.
   - Return to step 1.
3. If no gaps → exit loop.

**Critical:** The reviewer subagent must receive only the plan file — no
conversation context. Context bleed causes it to fill open decisions from memory
rather than surfacing them for the user to resolve.
</step>

<step name="approval_gate">
Pause and wait for explicit user approval before the user continues to
`exec-plan`.
</step>

</steps>

<output>
A spec & implementation plan saved under `docs/superpowers/`, executable line by
line, with all reviewer-identified gaps resolved (reviewer returns no gaps) and
explicit user approval recorded before handoff to `exec-plan`.
</output>

<acceptance-criteria>
- [ ] Halted if engineering docs were missing
- [ ] Product/engineering docs and relevant source read before planning
- [ ] Plan produced via brainstorming + writing-plans and saved to `docs/superpowers/`
- [ ] Ralph reviewer ran on the plan files only, no conversation context
- [ ] Loop continued until no gaps remained
- [ ] Explicit user approval obtained before handoff to `exec-plan`
</acceptance-criteria>
