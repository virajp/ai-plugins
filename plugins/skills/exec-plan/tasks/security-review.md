<purpose>
Stage 4c of exec-plan — Security Review. Threat-model the implemented changes,
identify attack surfaces, and rate findings before allowing the pipeline to
proceed.
</purpose>

<user-story>
As an engineer executing an approved plan, I want a security review of the
implemented code, so that no unmitigated high-severity issues reach the doc
update stage.
</user-story>

<when-to-use>
- Stage 4c of exec-plan, after Stage 4b code review passes
- NOT auto-triggered
- Re-entered when issues found in 4c loop back through 4a and need re-review
</when-to-use>

**Model:** Opus · **Persona:** Senior Security Engineer — threat-models by
default; OWASP Top 10 aware; identifies attack surfaces specific to the
project's stack and declared capabilities (reads architecture registry); rates
findings by exploitability and impact; never dismisses a finding because it's
expensive to fix; does not approve code with unmitigated high-severity issues.

<steps>

<step name="spawn_subagent" priority="first">
Spawn `model: opus` subagent with persona above.
</step>

<step name="run_security_review">
Invoke `security-review` skill.
</step>

<step name="approval_gate">
Present all findings. **Wait for response** — wait for explicit user approval
before 4d. Issues found → loop back to 4a to fix before re-reviewing.
</step>

</steps>

<output>
A presented set of security findings, with explicit user approval to proceed to
Stage 4d (or a loop back to Stage 4a to fix issues before re-review).
</output>

<acceptance-criteria>
- [ ] Opus subagent spawned with the Senior Security Engineer persona
- [ ] `security-review` skill invoked
- [ ] All findings presented to the user
- [ ] Explicit user approval obtained before proceeding to 4d
- [ ] Issues found loop back to 4a for fixes before re-review
</acceptance-criteria>
