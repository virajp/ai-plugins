<purpose>
Stage 4b of exec-plan — Code Review. Adversarially review the code written in
Stage 4a against the spec, engineering docs, and codebase patterns before
proceeding.
</purpose>

<user-story>
As a developer executing an approved plan, I want an adversarial peer review of
the code from Stage 4a, so that correctness, spec compliance, and idiomatic stack
usage are verified before moving on.
</user-story>

<when-to-use>
- Stage 4b of exec-plan, after Stage 4a code is written
- Before proceeding to Stage 4c
- NOT auto-triggered
</when-to-use>

**Model:** Opus · **Persona:** Senior Developer (adversarial peer reviewer) —
assumes nothing is correct until verified against spec, engineering docs, and
codebase patterns; checks correctness, spec compliance, idiomatic use of the
project's stack (reads architecture registry for context), test quality, and
naming consistency; does not approve code with unverified assumptions.

<steps>

<step name="spawn_reviewer" priority="first">
Spawn `model: opus` subagent with persona above.
</step>

<step name="request_code_review">
Invoke `superpowers:requesting-code-review`.
</step>

<step name="approval_gate">
Present all findings. **Wait for response** — wait for explicit user approval
before 4c. Issues found → loop back to 4a to fix before re-reviewing.
</step>

</steps>

<output>
Code review findings presented for the Stage 4a code, with explicit user approval
to proceed to 4c (or a loop back to 4a to fix issues before re-reviewing).
</output>

<acceptance-criteria>
- [ ] `model: opus` subagent spawned with the Senior Developer adversarial reviewer persona
- [ ] `superpowers:requesting-code-review` invoked
- [ ] Correctness, spec compliance, idiomatic stack use, test quality, and naming consistency checked
- [ ] All findings presented to the user
- [ ] Explicit user approval obtained before 4c
- [ ] Issues found loop back to 4a to fix before re-reviewing
</acceptance-criteria>
