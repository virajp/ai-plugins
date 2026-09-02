# Decisions — format 24 migration: all five core foundations adapted

**Date** 2026-09-03 · **Branch** `vwf-setup-migrate-24` (local, unmerged) ·
**Commits** `bdd934c1`, `de08f317`

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

A `/vwf:setup` run resolved to **migrate** mode — repo stamped 15/23 against a
shipped 16/24 — and blueprint 24's doctrine-gaps package forced eleven
decisions.

## The shape of every foundation answer: ADAPT, not accept, not defer

Format 24 removed "not applicable" from the five core foundations, leaving
accept / adapt / defer. **All five were adapted**, and the reason is one reason,
not five: every default assumes a **deployed, multi-user service**, and this
product is a toolkit that runs on one developer's own machine.

- **users** → `single-local-actor`. One actor, authorized by owning the machine.
  No customer class, no operator class, no RBAC, no account lifecycle. Stated in
  `conventions.md#auth` so the flows keep linking rather than restating what
  their Trigger & Actors rows already say.
- **reliability** → `delivery-surface-availability`. **No latency SLO at all** —
  nothing serves requests. What must be available is the manifest resolving from
  `main` and a published version installing clean. **No error budget**: both
  surfaces are correct or broken for everyone at once, so a breach is a defect
  that stops other work, not an allowance drawn down.
- **dr** → `release-artifact-recoverability`. No datastore, so no RPO/RTO. What
  must survive is the repo, the per-plugin version tags, and published npm
  versions — the last **not recoverable by this product at all**, since a
  version is immutable and rollback is publishing forward.
- **incidents** → `release-failure-conditions`. An incident is a release that
  reached users broken, not an outage. No on-call, no `docs/runbooks/` tree: the
  alert table's Response column IS the runbook, short enough to be correct in
  place rather than correct in a file nobody opens.
- **observability** → `none` became `no-telemetry-by-design`. The prose was
  already an adaptation arguing its own case; only the token was wrong, reading
  as an absence where a decision had been made.

## threat_notes: installer only

`plugins` declares only `runtime-settings` and `installer` declares nothing, so
by the letter of the rule neither opens a named trust boundary. **Only
`installer` got a note** — the supply-chain path one command opens onto a
developer's machine is a boundary a user actually crosses; the plugins' handling
of fetched documentation is a property of the host agent, not of this product.

## The deploy axis stayed empty on purpose

`plugins` wanted a pin for tag-based marketplace delivery. **No stack plugin
ships a template for it**, and format 14 closed the axis to the shipped menu, so
pinning a name nothing backs would be a blocking doctor finding by construction.
Left `[]` with the note corrected, and the wanted pin recorded as a
recommendation. Authoring that deploy-target pack is open work.

## Kill criterion, elicited not invented

First goal now reads: traced share **below 100% by 2026-12-31 → pivot**. Strict
and near deliberately — the goal claims 100% every cycle, so any miss says the
contract-first premise did not survive contact with real work.

## Flow counters accepted with dangling references

Three goals took `counter` forms; **two name flows not yet written**
(`vwf-plan`, `vwf-execute`). Accepted knowingly while coverage reads `partial` —
the alternative was mapping everything to `store-metric` and losing the honest
shape of what is being counted.
