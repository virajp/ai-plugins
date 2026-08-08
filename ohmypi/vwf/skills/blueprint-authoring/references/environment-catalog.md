# Environment & Secrets Catalog

`docs/blueprint/environment.md` (type `vwf-environment`) is the product-wide
**inventory** of every environment variable and secret the system consumes —
names, purpose, issuer, consuming projects, and whether each is required. It is
a vwf foundation alongside `architecture.md` and `conventions.md`, and it is
**required once the system has an external integration or credential** (the
architecture registry's `cross_cutting.integrations` is non-empty, or `config`
selects a secrets manager). Bootstrapped by `setup`, maintained by `blueprint`.

## The line: catalog, not wiring

The catalog records **what** each variable is and **where it comes from** — the
external contract between the system and its deployment environment / issuers.
That is durable and true regardless of how the code is written, so it is
blueprint-level. What is **realization** and stays out:

- **which file / parser / loader reads a variable** (`config.ts`, a schema
  object, a `dotenv` call) — that is `plan`.
- **the config library or secrets-manager tool** — the *decision* ("env vars
  injected from a secrets manager") is a one-line convention recorded at
  `conventions.md#config`; the catalog just links it
  (`[config](./conventions.md#config)` from `environment.md`). The catalog
  itself is tool-agnostic so the manager can change without touching it.
- **values, ever.** The catalog names variables; it never contains a secret
  value. A value in this doc is a leak, not a gap.

## No values — secrets hygiene

Never write a secret's value, not even a "sample" or a truncated one. Name the
variable, its issuer, and how it is obtained/rotated — an operator fetches the
value from the issuer and stores it in the deployment env. Non-production
placeholders used for local/test (emulator hosts, demo ids) may be described in
*Local development & test* as long as they grant no access to real
infrastructure.

## Classify every row

Each variable is one of:

- **secret** — leaking it grants access, allows impersonation, or incurs cost
  (API keys, signing keys, service-account credentials, webhook signing secrets,
  store-publishing credentials).
- **non-secret** — operational config with no access value (ports, log level,
  timeouts, emulator hosts, public base URLs). Cataloged for completeness.
- **client-id** — public, platform-restricted identifiers (a mobile app's config
  keys, OAuth client ids). Safe in client artifacts because a platform
  restriction, not secrecy, protects them; listed under *Client identifiers*.

A public SDK key (safe on clients) and a server secret from the same vendor are
**different rows** with different classifications — say so explicitly.

## Group by consuming project

Sections are per **project**, named from the architecture registry (`service`,
`worker`, `frontend`, `ci`, …) — secrets are project/integration-scoped, not
entity-scoped, so they never live in an entity doc. A variable read by several
projects is documented **once** (under its primary owner or *Shared*) with every
consumer listed in *Used by*, not duplicated per project.

## Self-gate checklist

The gate for `environment.md`. The doc passes only when:

- [ ] **OKF frontmatter** present: `type: vwf-environment`, `title`,
      `description`, `status`; optional `timestamp`/`owner`/`resource`/`tags`.
- [ ] Every row has variable, purpose, source/issuer, used-by, required, and a
      **classification** (secret / non-secret / client-id).
- [ ] **No values** anywhere — not even samples or truncated ones.
- [ ] Every consuming project named matches a project in the architecture
      registry; every external issuer traces to a registry `integrations` entry
      (or is flagged as new → reconcile architecture).
- [ ] Public SDK/client keys are separated from true server secrets; access-
      granting rows are marked `secret`.
- [ ] The injection mechanism is **linked, not restated**:
      [config](./conventions.md#config) resolves.
- [ ] *Local development & test* states plainly that local config is
      non-production and grants no access to real infrastructure.
- [ ] No realization leaked: no config-file path, parser, or config-library
      name; no loader wiring.
- [ ] Minimal: only variables the system actually consumes — no speculative
      "might need it later" rows.
- [ ] Open items (an unprovisioned secret, a planned integration's future keys)
      are called out, not silently omitted.
