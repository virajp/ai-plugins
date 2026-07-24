# Standard Flows

The canonical flow slugs every UI project is expected to carry. Shared by
`/vwf:blueprint` (elicitation and the sweep's coverage gate via the
`blueprint-surveyor`) and the blueprint-authoring **flow-contract** reference
(naming). Keep this list the single source of truth; the surfaces read it rather
than carrying their own copy.

Two rules ride on the vocabulary:

- **A missing mandatory standard flow is a coverage hole** — it blocks the
  `complete` stamp like any other, unless waived in `.config/vwf.yaml` under
  `enforcement.rules` (id `standard-flows/<project>/<slug>`, with a reason;
  never re-asked).
- **The slugs are exact.** `signin`, never `login` / `sign-in`; `profile`, never
  `account`. A flow whose journey matches a standard slug under another name is
  **drift**: the sweep proposes the rename (consent-gated, through the rename
  reconcile that fixes inbound links and catalogs). The slug is also the canvas
  join key, so one vocabulary holds everywhere.

## The vocabulary

| Slug              | `frontend` (mobile app) | `console` (web app)  | `site` (web site) |
| ----------------- | ----------------------- | -------------------- | ----------------- |
| `splash`          | **mandatory**           | optional             | —                 |
| `home`            | **mandatory**           | **mandatory**        | **mandatory**     |
| `signin`          | conditional (auth)      | conditional (auth)   | per requirement   |
| `onboarding`      | optional                | optional             | per requirement   |
| `settings`        | optional                | optional             | per requirement   |
| `notifications`   | optional                | optional             | per requirement   |
| `profile`         | conditional (signin)    | conditional (signin) | per requirement   |
| `delete-account`  | conditional (signin)    | conditional (signin) | per requirement   |
| `recover-account` | conditional (signin)    | conditional (signin) | per requirement   |

- **mandatory** — required for coverage; absence is a hole (waivable, above).
- **conditional (auth)** — required when the project carries an **Auth &
  identity** capability in the registry (`third-party-auth`,
  `custom-claims-rbac`, or `operator-rbac`, per the capability vocabulary). The
  registry is the signal: an auth-capable UI project with no `signin` flow is a
  coverage hole. The inverse is registry drift — a `signin` flow in a project
  with no auth capability means the registry is missing the capability;
  reconcile via `/vwf:architecture`, never by deleting the flow.
- **conditional (signin)** — required exactly when `signin` is required (an
  account that can be signed into can be viewed, recovered, and deleted — the
  last two are the product-foundations data-retention baseline surfacing as
  journeys).
- **optional** — a product decision. When the sweep authors a journey that
  matches one of these, it takes the standard slug; the sweep never proposes
  them unprompted.
- **per requirement** — no default expectation either way.

Standard flows live on the project's **primary device** number line (`mobile`
for `frontend`, `web` for `site`/`console`). In-car subset flows are exempt —
their vocabulary is the parent journey's, and an in-car `signin` mandate would
contradict the driver-distraction constraints.

Non-UI projects (`service`, `worker`, `packages`) carry no standard flows.

## Synonym candidates (rename drift)

When a flow's slug is not standard but its journey plausibly is, treat these as
**candidates to confirm with the user** — never auto-rename:

| Standard slug     | Common synonyms                                         |
| ----------------- | ------------------------------------------------------- |
| `splash`          | `launch`, `boot`                                        |
| `signin`          | `login`, `log-in`, `sign-in`, `auth`                    |
| `home`            | `main`, `landing` (when it is the signed-in home)       |
| `onboarding`      | `welcome`, `first-run`, `intro`                         |
| `settings`        | `preferences`                                           |
| `profile`         | `account`, `my-account`                                 |
| `delete-account`  | `account-deletion`, `close-account`                     |
| `recover-account` | `forgot-password`, `password-reset`, `account-recovery` |

A synonym match is a proposal, not a verdict — `dashboard` may be a genuinely
different journey from `home`; the user decides. A confirmed rename routes
through the blueprint sweep's rename reconcile (inbound links, catalogs, canvas
join keys all move together); a declined one is recorded as a waiver
(`enforcement.rules`) so it is never re-asked.
