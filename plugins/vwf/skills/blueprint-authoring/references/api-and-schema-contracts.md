# API & Schema Contracts (the YAML artifacts)

Two of a blueprint's authoritative surfaces are **YAML**, not markdown: the
per-entity data model (`schema.yaml`) and the per-service API contract
(`apis/<project>.openapi.yaml`). They are **typed by path, not frontmatter** —
neither carries vwf metadata in the file. The governing `status:` for a
`schema.yaml` is its entity `index.md`'s frontmatter (the two files are one
concept); an OpenAPI file carries its own review stamp inline as
`info.x-vwf.status`. Both are contract, not realization — logical types and
constraints only, never storage/ORM/index/framework detail.

## The schema.yaml bar

`docs/blueprint/entities/<entity>/schema.yaml` is the **authoritative data
model** for one entity — JSON Schema draft 2020-12, expressed in YAML. The
entity's `index.md` links it and holds only short notes; the schema is the
single source of field truth (never a second field table in the markdown).

- `$schema: https://json-schema.org/draft/2020-12/schema`, `type: object`, plus
  `title` + `description`.
- **Every property typed and described.** No bare or open-ended types.
- **Every enum fully enumerated** — list every member, always.
- **`required:` present.** Absence of a property from it *is* the optionality
  statement.
- **`additionalProperties` stated** (usually `false`).
- **Nullability via type unions** (`type: [string, "null"]`), not prose.
- **Id / format conventions** via `format`/`pattern`, or a description deferring
  to `conventions.md#ids`.
- **A foreign-key property names its target entity in its description** — the
  resolving OKF edge itself lives in the entity `index.md`'s Relationships
  table, not in the schema.
- **Logical types only.** No column types, indexes, ORM annotations, or storage
  hints — those are `plan`/`execute`.

### schema.yaml self-gate

- [ ] `$schema` draft 2020-12, `type: object`, `title`, `description` present.
- [ ] Every property has a `type` and a `description`.
- [ ] Every enum lists every member.
- [ ] `required:` present; `additionalProperties` stated.
- [ ] Nullability expressed via type unions, not prose.
- [ ] Every FK property's description names the target entity.
- [ ] No storage/ORM/index/column detail leaked.

## The openapi.yaml bar

`docs/blueprint/apis/<project>.openapi.yaml` is the **authoritative API
contract** for one registry `service` project — OpenAPI 3.1, one file per
service, named by the registry project name. Flow steps reference operations by
`operationId`.

- **`info.version`** — semver (`0.x` until the first production release);
  **`info.x-vwf.status`** — `draft` | `reviewed`, the vwf review stamp.
- **Unique `operationId`s** — these are exactly what flow steps name; a
  collision breaks the flow→operation edge.
- **Explicit `security`** per operation, with roles mapping to
  `conventions.md#auth` (state the convention, don't restate the scheme per op).
- **Error CASES via `components.responses`**, `$ref`'d from operations. The
  error *envelope* shape stays in `conventions.md#errors` and is never restated
  per operation — enumerate only which cases each operation can return.
- **Documented idempotency** — GET/PUT/DELETE by method semantics; document
  `Idempotency-Key` handling on non-idempotent mutations.
- **May `$ref` entity schemas relatively** (`../entities/<entity>/schema.yaml`)
  so shapes have one source of truth.
- **Realization omitted** — no `servers:` blocks, hostnames, gateway, or
  framework detail; those depend on how the service is deployed, not on the
  contract.

Use the **rest-api-design** skill for contract depth (resources, methods,
pagination, error format, auth schemes, versioning) — do not restate it here.

### openapi.yaml self-gate

- [ ] `openapi: 3.1.x`; `info.version` is semver; `info.x-vwf.status` is `draft`
      or `reviewed`.
- [ ] Every operation has a unique `operationId` and an explicit `security`
      entry (roles → `conventions.md#auth`).
- [ ] Error cases via `components.responses`; the envelope is referenced from
      `conventions.md#errors`, not restated.
- [ ] Idempotency documented for every non-idempotent mutation.
- [ ] Entity shapes `$ref` the entity `schema.yaml`, not inlined copies.
- [ ] No `servers:`/hostname/gateway/framework detail.

## YAML path-typing & governance

Because these files are typed by path, `plugins:check`/OKF tooling knows a file
under `entities/*/schema.yaml` is a data model and one under
`apis/*.openapi.yaml` is an API contract without reading frontmatter. Keep them
where they belong; do not add vwf frontmatter to either.

## The released-snapshot rule (additive-only)

`docs/blueprint/apis/released/<project>@<version>.openapi.yaml` holds **frozen
production snapshots**, written by `/vwf:verify` on a passing production run.
Once a frozen snapshot exists for a service, changes to that service's living
contract must be **additive-only** — or carry an explicit major-version bump
(`info.version` major + a `/vN` path prefix). The breaking-change law — what
counts as additive vs breaking, and how to version — is the **rest-api-design**
skill's
[reference 8](../../rest-api-design/references/8-versioning-backward-compatibility.md);
follow it, do not re-derive it here.
