# Incident Response

What happens **when production breaks** — who finds out, what they read, and
what the product learns afterwards. Distilled from the Well-Architected
operational-excellence pillar; composes with reliability targets (the
error-budget stance decides what an incident *costs*) and DR & backup (the
restore drill is one of the runbooks). Cross-cutting token:
`incidents: alerts-runbooks-postmortems`.

## Default contract

- **Alert conditions are contract**: a table in `conventions.md#incidents` —
  condition (health down, SLO burn, job backlog, budget breach) → destination
  (even just "email the operator") → runbook link. Alert rules and dashboards
  stay in the backing service (the observability stance, unchanged); the point
  is that the conditions and their destinations are written down *before* the
  first incident, not invented during it.
- **Runbooks**: `docs/runbooks/` per deployed project, minimum two —
  health-failure triage (what to check when the health probe fails) and DR
  restore (the disaster-recovery foundation's restore runbook lives here).
- **Postmortems**: every incident gets a stub in `docs/runbooks/postmortems.md`
  — what happened, impact window, contributing causes, action items. Action
  items route through `/vwf:feedback` like any other production signal.

## Elicit per product

- The alert conditions and their destinations (offer the four defaults above; a
  solo operator emailing themselves is a valid, recorded answer).
- Which projects need runbooks beyond the minimum two.
- On-call rotations and severity matrices are **elective growth** beyond
  solo-operator defaults — offer them only when the product names more than one
  operator; declining them is the default, not an exception.

## Blueprint expansion

- `conventions.md#incidents` holds the alert-condition table (condition →
  destination → runbook link) and the postmortem location. Flow and entity docs
  never restate it. Realization (alert rules, paging integrations, dashboards):
  the backing observability service and the stack docs — deliberately not
  restated in-repo.
- `/vwf:verify` reads the table on a failed production health probe to name the
  matching runbook; `/vwf:feedback incident` appends the postmortem stub and
  routes its action items.
