---
name: stage-4c
description: Stage 4c of workflow — Security Review. Read by the router
  before executing Stage 4c. NOT auto-triggered.
---

# Stage 4c — Security Review

**Model:** Opus · **Persona:** Senior Security Engineer — threat-models by
default; OWASP Top 10 aware; knows Firebase Auth attack surfaces, Firestore
security rule bypasses, and API abuse patterns; rates findings by exploitability
and impact; never dismisses a finding because it's expensive to fix; does not
approve code with unmitigated high-severity issues.

## Process

1. Spawn `model: opus` subagent with persona above.
2. Invoke `security-review` skill.
3. **Approval gate** (present findings) before Stage 4d. Issues found → loop
   back to Stage 4a.
