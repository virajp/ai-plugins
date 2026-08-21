# Standard Flows, Numbering & Platforms

The canonical flow **slugs**, their **designated numbers**, the **platform
vocabulary**, and the **screen-naming rule**. Shared by `/vwf:blueprint`
(elicitation and the sweep's coverage gate via the `blueprint-surveyor`),
`/vwf:screens` and `/vwf:mockups` (platform resolution), `/vwf:architecture`
(the registry's `platforms:` values), and the blueprint-authoring
**flow-contract** reference. Keep this the single source of truth; the surfaces
read it rather than carrying their own copy.

Three rules ride on it:

- **A missing mandatory standard flow is a coverage hole** — it blocks the
  `complete` stamp like any other, unless waived in `.config/vwf.yaml` under
  `enforcement.rules` (id `standard-flows/<project>/<slug>`, with a reason;
  never re-asked).
- **The slugs and their numbers are exact.** `signin`, never `login` /
  `sign-in`; `home` is **always `100`**. A flow whose journey matches a standard
  slug under another name, or a standard slug at another number, is **drift**:
  the sweep proposes the fix (consent-gated, through the rename reconcile that
  moves inbound links, catalog rows, prompt folders, and canvas page names
  together). Deviating deliberately takes a waiver
  (`standard-flows/<project>/<slug>/number` for a number).
- **A platform file exists only where the product implements that platform** —
  the *flow* is mandatory, the platform coverage is elicited.

## The number line

One number line **per registry project** — a flow folder covers every platform,
so a number is never reused within a project. Three digits, four bands:

| Band               | Range       | Contents                                                                                       |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| **Entry**          | `010`–`090` | `010` splash · `020` signin · `030` recover-account · `040` onboarding · `050`–`090` free      |
| **Anchor**         | `100`       | **`home`** — the center of the app; every screen-platform project, always                      |
| **Product**        | `110`–`890` | The product's own journeys, gap-numbered by 10 (`110`, `120`, …)                               |
| **Account/system** | `900`–`990` | `910` profile · `920` settings · `930` notifications · `940` delete-account · `950`–`990` free |

Notes:

- **`100` is the anchor.** Every project with a screen platform has `100-home`; its screens are
  therefore always coded `100a`, `100b`, …
- **Onboarding runs after sign-in** by default (`040`) — first-run setup once
  the user is known. A product that onboards pre-auth (value-prop screens before
  signing in) moves it into the free entry range below `020` and records the
  number waiver; the number states execution order.
- **Free ranges** (`050`–`090`, `950`–`990`) take product-specific journeys that
  genuinely belong in that band — an age gate or force-update check before home,
  a data-export request beside the account screens.
- **Gap numbering** applies inside the product band: an insert takes a number
  between its neighbours (`115`) without renumbering; only when no integer
  remains is the local tail renumbered (via the rename reconcile).

## The slug vocabulary

**The mandates key on platform, never on role.** A project is in scope here when
it declares at least one **screen platform**; which column applies is decided by
*which* screen platforms it declares.

| Slug              | device platforms<br>`mobile` `tablet` `desktop` `auto` | browser platforms<br>`site` `webapp` | Mandate                                                     |
| ----------------- | ---------------- | ------------- | ----------------------------------------------------------- |
| `splash`          | **mandatory**    | optional      | —                                                           |
| `signin`          | conditional      | conditional   | required when the project has an Auth & identity capability |
| `recover-account` | conditional      | conditional   | required with `signin`                                      |
| `onboarding`      | optional         | optional      | —                                                           |
| `home`            | **mandatory**    | **mandatory** | every project declaring a screen platform                   |
| `profile`         | conditional      | conditional   | required with `signin`                                      |
| `settings`        | optional         | optional      | —                                                           |
| `notifications`   | optional         | optional      | —                                                           |
| `delete-account`  | conditional      | conditional   | required with `signin`                                      |

A project declaring **both** kinds — a Flutter codebase shipping `mobile` and
`webapp`, say — takes the **device** column: it has a splash frame to gate on at
least one of its surfaces, and the flow is mandatory even when only some
platform files carry it.

- **mandatory** — required for coverage; absence is a hole (waivable, above).
- **conditional (auth)** — `signin` is required when the project carries an
  **Auth & identity** capability in the registry (`third-party-auth`,
  `custom-claims-rbac`, or `operator-rbac`). The registry is the signal: an
  auth-capable screen-platform project with no `signin` flow is a coverage hole. The inverse
  is registry drift — a `signin` flow in a project with no auth capability means
  the registry is missing the capability; reconcile via `/vwf:architecture`,
  never by deleting the flow.
- **conditional (signin)** — `profile`, `delete-account`, and `recover-account`
  are required exactly when `signin` is (an account that can be signed into can
  be viewed, recovered, and deleted — the last two are the product-foundations
  data-retention baseline surfacing as journeys).
- **optional** — a product decision. When the sweep authors a journey matching
  one of these, it takes the standard slug and number; the sweep never proposes
  them unprompted.

`site` and `webapp` share one column because both are browser-delivered, so
neither has a splash frame to gate. They are separate **platforms** because they
are separate surfaces with separate screens — a marketing site and the product's
application are not the same design problem — but they oblige the same flows. An
**operator back-office** is `platforms: [service, webapp]`: it needs `home` like
any other screen surface, `operator-rbac` notwithstanding.

**Screenless platforms carry no standard flows and no platform files** —
`service`, `worker`, `packages`, every `data` and `system` platform, and `cli`.
The `cli` case is the one worth stating: every standard slug is a screen journey
(`splash` before the first frame, `home` as the center of the app), which a
terminal tool does not have. A cli-only project's flows are its commands, named
by the product; the surveyor skips the mandate check for it the way it skips
`iac`. A project mixing `cli` with a screen platform is in scope through the
screen platform, and its `cli` surface simply contributes no platform file.

**`plugin` works the same way, and is the one `system` platform the surveyor
still covers.** A plugin project's flows are its **extension points** — one flow
per skill, command or hook, named for what it does, `index.md` alone, never
reaching the canvas, mockups or the scratchpad, and with no standard-flow
mandates. Screenless does not mean uncovered: the bar it is held to is
`${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/plugin-contract.md`.

## The platform vocabulary

Every platform token vwf knows lives in the registry's closed per-role lists
(`${CLAUDE_PLUGIN_ROOT}/assets/templates/registry.yaml`). Of them, exactly **six are
screen platforms**, used everywhere a screen surface is — flow platform files,
the `docs/prompts/screens/` briefs, canvas page suffixes, `design.projects`
pins, and the `docs/scratchpad/` render tree:

| Platform  | What it is                                      | Kind    |
| --------- | ----------------------------------------------- | ------- |
| `mobile`  | Phone app or phone-sized layout                 | device  |
| `tablet`  | Tablet layout (master-detail, multi-column)     | device  |
| `desktop` | Natively installed desktop application          | device  |
| `auto`    | In-car head unit — **CarPlay and Android Auto** | device  |
| `site`    | Browser-delivered content surface               | browser |
| `webapp`  | Browser-delivered application                   | browser |

Format 22 split the old single `web` token into `site` and `webapp` and made
both platforms rather than roles. They are two surfaces, not two implementations
of one: a marketing site and the product's application have different screens,
different navigation and often different design projects, and a product with
both used to have no way to say so.

**`cli` is a platform but not a screen platform** — a shipped command-line or
TUI tool, not a repo's internal dev scripts. It appears in the registry and in
`.config/vwf.yaml` and nowhere else: a terminal surface has **no
screens**, so `cli` never admits a `cli.md` platform file and never reaches
`/vwf:screens`, `/vwf:mockups`, the canvas, or the scratchpad. A flow of a
cli-only project is `index.md` alone, like a service flow. What `cli` does
require is the design system's **Terminal UX** section.

Every **other** platform — `service`, `worker`, `packages`, and every `data` and
`system` token, `plugin` included — is screenless in exactly the same way, and
for the same reason: a flow of theirs is `index.md` alone. What was one exemption for `cli` is now
the general rule, with the six above as the exception.

The vocabulary names **form factors, not vendors** — `mobile` already hides
iOS/Android and `desktop` hides Windows/macOS/Linux, so `auto` hides CarPlay and
Android Auto the same way. Their template differences (list / grid / map /
now-playing and the driver-distraction rules) are recorded as deviations inside
`auto.md`.

A project's implemented platforms are declared in the registry
(`projects[].platforms`) and **only** there — since format 19 the key is gone
from `.config/vwf.yaml`. A flow's `Platforms` table must be a subset of them,
and only its **screen** platforms produce files.
**In-car journeys are not separate flows** (they were, before format 15): `auto`
is a platform file of the same flow, so the auto take on `100-home` is
`100-home/auto.md` — same number, same steps, its own screens.

## Screen naming

A **standard flow's primary screen takes the flow's slug**: the `home` flow's
main screen is named `home` — never "Dashboard", "Main Feed", or "Landing"; the
`signin` flow's is `signin`, and so on for `profile`, `settings`,
`notifications`, `splash`, `onboarding`, `recover-account`, `delete-account`.
Secondary screens inside those flows are free-named (`profile-edit`,
`settings-privacy`). The reviewers enforce this exactly like the flow slugs.

Screen **codes** are shared across a flow's platform files — `100a` is one
screen concept wherever it appears; a platform that lacks it omits the row, and
a platform-only screen takes the next letter free across the whole flow.

## Synonym candidates (rename drift)

When a flow's slug is not standard but its journey plausibly is, treat these as
**candidates to confirm with the user** — never auto-rename:

| Standard slug     | Common synonyms                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| `splash`          | `launch`, `boot`                                                       |
| `signin`          | `login`, `log-in`, `sign-in`, `auth`                                   |
| `home`            | `main`, `landing`, `dashboard`, `feed` (when it is the signed-in home) |
| `onboarding`      | `welcome`, `first-run`, `intro`                                        |
| `settings`        | `preferences`                                                          |
| `profile`         | `account`, `my-account`                                                |
| `delete-account`  | `account-deletion`, `close-account`                                    |
| `recover-account` | `forgot-password`, `password-reset`, `account-recovery`                |

A synonym match is a proposal, not a verdict — `dashboard` may be a genuinely
different journey from `home`; the user decides. A confirmed rename routes
through the blueprint sweep's rename reconcile (inbound links, catalogs, prompt
folders, and canvas page names all move together); a declined one is recorded as
a waiver (`enforcement.rules`) so it is never re-asked.
