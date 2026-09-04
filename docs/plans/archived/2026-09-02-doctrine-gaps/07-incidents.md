# Unit 07 — Incident doctrine

Implements **Draft 7** of the proposals. Incident response joins the **core**
foundation class created by unit 01.

- **Depends on:** unit 01 (core/elective mechanism), unit 05 (feedback file —
  committed, to avoid clashing edits).
- **Owns:** **new**
  `skills/product-foundations/references/incident-response.md`, scoped edits to
  `skills/product-foundations/SKILL.md`, `skills/feedback/SKILL.md`,
  `skills/verify/SKILL.md`,
  `skills/product-foundations/references/disaster-recovery.md`.
- **Read first:** every owned file; in feedback, the five intake kinds and their
  routing table; in verify, the production health-probe failure path.
- **Lazy-load:** `references/reliability-targets.md` (only to cite the
  error-budget stance correctly), `assets/memory.md` (only to confirm the
  mempalace room name `problems`).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **New `references/incident-response.md`** — foundation #13, shaped exactly
   like the sibling references (`Default contract` / `Elicit per product` /
   `Blueprint expansion`, cross-cutting token e.g.
   `incidents: alerts-runbooks-postmortems`):
   - **Alert conditions are contract**: a table in `conventions.md#incidents` —
     condition (health down, SLO burn, job backlog, budget breach) → destination
     (even just "email the operator") → runbook link. Alert rules and dashboards
     stay in the backing service (the observability stance, unchanged); the
     conditions and destinations are written down before the first incident.
   - **Runbooks**: `docs/runbooks/` per deployed project, minimum two —
     health-failure triage and DR restore.
   - **Postmortems**: every incident gets a stub in
     `docs/runbooks/postmortems.md` — what happened, impact window, contributing
     causes, action items.
   - Elective growth, stated as such: on-call rotations and severity matrices
     are beyond solo-operator defaults.
2. **`skills/product-foundations/SKILL.md`** — add the checklist row (core
   class), update the concern count ("Twelve" → "Thirteen") and the
   `description:` frontmatter list. Frontmatter edit is the risky one — strict
   YAML, change only the description string.
3. **`references/disaster-recovery.md`** — the restore-runbook pointer now cites
   the incident foundation's `docs/runbooks/` home (one-line edit; no contract
   change).
4. **`skills/feedback/SKILL.md`** — intake kind #6, **incident**: files to
   mempalace room `problems`, appends the postmortem stub, routes each action
   item through the existing classifier (usually blueprint hole or plan gap),
   and names the reliability foundation's error-budget stance as what an
   incident reading triggers.
5. **`skills/verify/SKILL.md`** — a failed production health probe names the
   matching runbook from `conventions.md#incidents` and offers
   `/vwf:feedback incident`.

## Verification

- `mise run plugins:check` passes — especially: the edited foundations SKILL.md
  frontmatter still parses (a broken one drops the skill silently; confirm the
  checker still counts it).
- `grep -rn "incident" plugins/vwf/skills/feedback/SKILL.md plugins/vwf/skills/verify/SKILL.md`
  — kind #6 and the verify offer agree on the spelling `/vwf:feedback incident`.
- Foundations checklist has 13 rows; count language updated everywhere in that
  SKILL.md (`grep -in "twelve" …`).

## Guardrails

- The new reference file takes no frontmatter.
- Do not restate alerting realization in-repo — the out-of-repo stance is
  deliberate and stays.
- Commit:
  `feat: add the incident-response foundation with feedback and verify routing`
