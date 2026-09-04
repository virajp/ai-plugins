# Disaster Recovery & Backup

Explicit **recovery objectives per datastore** — how much data the product may
lose (**RPO**) and how long it may be down (**RTO**) — and the backup contract
that makes them true. Distilled from the Well-Architected reliability pillar;
composes with the data-retention foundation (what may be *kept*) — this concern
is about what must be *recoverable*. Cross-cutting token: `dr: backup-rpo-rto`.

## Default contract

- **Per datastore, two numbers**: RPO (e.g. `24h` — daily backups may lose a
  day) and RTO (e.g. `4h` — restore completes within four hours), stated per
  datastore in the registry's capability terms (`document-datastore`,
  `relational-datastore`, `object-file-storage`), not per table.
- **Automated backups, never manual**: scheduled by the platform (e.g. managed
  PITR or scheduled exports), retained on a schedule the data-retention contract
  permits — a backup is also a data store, so purged PII must age out of backups
  on a stated horizon too.
- **Restore is tested, not assumed**: a restore drill on a stated cadence
  (default: quarterly, into a non-production environment). An untested backup is
  a hope, not a contract.
- **Recovery is documented**: the restore runbook lives in `docs/runbooks/` —
  the incident-response foundation's home ([incident-response](incident-response.md));
  the contract here records only that it exists and where.
- Cross-region/HA topology is **realization** (the stack and hosting decide it);
  this concern pins only the objectives and the backup/restore contract.

## Elicit per product

- RPO and RTO per datastore (offer the defaults; a solo product may consciously
  accept `RPO 24h / RTO best-effort` — valid when recorded).
- The backup retention length and where it intersects the data-retention purge
  horizon.
- The drill cadence, and who runs it (usually "the operator, quarterly").

## Blueprint expansion

- `conventions.md#disaster-recovery` holds the per-datastore RPO/RTO table, the
  backup schedule/retention, the drill cadence, and the runbook pointer. Entity
  docs never restate it; an entity whose data is consciously *unrecoverable*
  (ephemeral cache, re-derivable projections) records that on the entity as an
  explicit exclusion. Realization (backup jobs, PITR config): the stack docs.
