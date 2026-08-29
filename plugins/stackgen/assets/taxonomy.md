# Component Taxonomy

stackgen's unit is the **component** — the atom a stack is actually made
of: `typescript`, `pnpm`, `axum`, `postgres`, `kafka`, `cloud-run`. One
pack per component (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`); a
**bundle** is never a directory — it is a recorded composition of component
refs in the template payload. This file is the closed vocabulary that
classifies every component, curated and generated alike. It is **extended
deliberately**: a new type or category is an edit to this file, reviewed
like any contract change — never a value a generation run invents because
nothing here fit.

Every component declares up to three classification fields in its metadata:
**`type`** always, **`category`** where its type has categories, and
**`capability`** where the component realizes a vwf capability.

## Component types

The closed list. A component is exactly one of:

- **`language`** — a programming language; the root a Language-Bundle
  composes around, and the one type that carries the per-language facts
  `/vwf:doctor` verifies (LSP provision, mise tool, manifest).
- **`package-manager`** — how a language's dependencies are installed and
  locked; contributes the `repo`-axis facts.
- **`framework`** — a library that imposes structure inside a language: a
  webserver, an ORM, a testing framework, a meta-framework. Note the
  containment: a `framework` is **subordinate** to the `language` component
  it composes with.
- **`app-framework`** — the inversion of that containment: an SDK that owns
  the manifest, the build and the project layout, and **decides which
  languages appear**. Flutter is the case that forced this type — its
  `pubspec.yaml` declares both the Dart and Flutter SDK constraints and
  configures the *iOS* package manager, its build drives Gradle and Xcode
  rather than the reverse, and its scaffolder takes the native language as a
  flag. A type is warranted where the SDK is what a project pins and the
  language is what the SDK brought.
- **`toolchain-gate`** — a repo-level gate: formatter, linter, secret
  scanner, vulnerability scanner, hook runner.
- **`cloud-provider`** — a provider itself: the account/IAM/billing and
  emulator judgment that spans its services.
- **`cloud-service`** — one service of one provider: a compute target, a
  managed database, a managed queue.
- **`datastore`** — a datastore the product runs against, standing on its
  own rather than as one cloud's flavour.
- **`queue`** — a standalone queue or event bus.
- **`capability-provider`** — the flavour half of a vwf capability that
  belongs to no cloud and is not a datastore: an identity issuer, a
  telemetry sink, a workflow engine. Its **category** says which.
- **`ci-system`** — one continuous-integration system: where its workflows
  live, how it is triggered, and how it installs a toolchain. One component
  per system, never per workflow.
- **`build-orchestrator`** — task and build orchestration across a workspace's
  packages: caching, dependency-ordered runs. Distinct from the
  `package-manager`, which installs and locks but does not schedule work.
- **`deploy-target`** — where a built artifact lands when the target belongs to
  no cloud: a package registry, a provider-neutral container host. A cloud's own
  compute service stays a `cloud-service`.
- **`cdn`** — a content-delivery layer.
- **`design-tool`** — the tool a project's screens and design system are
  authored in. Selected by the project's `design:` pin rather than composed
  into anything, which is why it is its own type: it sits beside a stack
  rather than inside one, and two projects on the same stack routinely use
  different ones.

## Categories

The finer cut, closed per type. A type absent here has no categories yet,
and its components leave `category` unset.

- **`framework`**: `webserver` / `orm` / `otel-sdk` / `testing` /
  `meta-framework` / `ui-library` / `cli` / `iac` / `workflow-sdk`
- **`cloud-service`**: `compute` / `sql` / `queue` / `object-storage` /
  `cdn`
- **`datastore`**: `sql` / `document` / `graph` / `vector` / `key-value` /
  `in-memory`
- **`capability-provider`**: `identity` / `telemetry` / `workflow`
- **`app-framework`**: `cross-platform-ui` / `native-ui`

A name appearing as both a type and a category is deliberate, not a
collision: `kafka` is type `queue` (a standalone component); a provider's
pub/sub service is type `cloud-service`, category `queue`. The shared
category is what makes them substitutable answers to the same blueprint
capability — and what lets a stack menu become a category-filtered query
rather than a per-plugin list.

## The capability seam

Capability tokens are **vwf's** — defined in vwf's capability-vocabulary
asset, blueprint-neutral, referenced here by token and never redefined. The
category taxonomy is **stackgen's** — the cut beneath the capability that
vwf never sees. vwf never learns what an ORM is; stackgen never redefines
what `relational-datastore` means. A component's `capability` field names
the vwf token it realizes: a `datastore`/`sql` component realizes
`relational-datastore`; a `queue` component `message-queue` or `pub-sub`.

Some categories have **no capability token today** — `cdn` is one. That is
a known vwf-side gap, not a taxonomy error: the component leaves
`capability` unset, and nothing here mints a token to fill the hole —
minting capabilities is vwf's move.

## Bundles — how types compose

A bundle is rooted per kind (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`):

- A **Language-Bundle** is the composition rooted at a `language`
  component: the language + its `package-manager`, `framework` components
  and `toolchain-gate`s.
- A **Cloud-Bundle** is a `cloud-provider` component + `cloud-service`
  components.
- A **Datastore-Bundle** is category-level doctrine + an instance
  component (a `datastore`, or a cloud's `cloud-service`/`sql`).
- A **Capability-Bundle** is category-level doctrine — the neutral capability
  contract — plus one `capability-provider` component that realizes it, the
  same halves a Datastore-Bundle is built from.
- An **App-Bundle** is rooted at an `app-framework` component, which carries
  its languages **as members with a role** rather than composing into one of
  them: one `primary` language and any number of `platform-edge` languages,
  which exist only at the SDK's native boundary. This is the one bundle whose
  root is not the thing its languages would suggest.
- A **CI-Bundle** is vwf's delivery-pipeline contract plus exactly one
  `ci-system` component, on the **`cicd`** axis. Never two: a repo has one
  pipeline, and generating for a system the repo does not use is how a second,
  unmaintained pipeline appears.
- A **Deploy-Bundle** is exactly one `deploy-target` component and nothing
  else. It is the only bundle with no second half, because there is no
  category above a provider-neutral target to write doctrine at — a target
  that belongs to a cloud is a `cloud-service` inside a Cloud-Bundle
  instead. What keeps the single component honest is its kind's scope
  fence rather than a pairing.
- A **Design-Bundle** is exactly one `design-tool` component, standing alone
  like a Deploy-Bundle, on the **`design`** axis.

Those last two share a property nothing else here has, and it is what makes the
**tool axes** (`design`, `cicd`) cheap: **the bundle slug is the tool token the
project config already holds**. Picking from the menu and writing
`projects.<name>.design` are one act rather than two that can disagree. They
exist because a template no menu can offer is not an error — it is invisible,
which is how a CI-system pack shipped that nothing could ever materialize.
- A **Repo-Gate-Bundle** is the `toolchain-gate` components that apply to
  the whole repository rather than to one toolchain in it — the only
  composition rooted at the `repo` axis. A gate meaningful for exactly one
  toolchain is **not** here: it belongs to that language's bundle, which is
  what keeps a polyglot repo from materializing the same scanner once per
  language.

## Category-level doctrine

Doctrine that belongs to a category rather than an instance is written
**once**, as stackgen curated knowledge under
`${CLAUDE_PLUGIN_ROOT}/assets/contracts/<area>.md`. Instance components cite
it and stay thin: the `postgres` pack carries what is Postgres's alone.

The contracts are **capability-neutral by construction** — each states what
*any* provider must satisfy without naming one, and names the vwf capability
tokens it realizes. That is what lets two providers in one category be
compared against the same clauses instead of against each other's marketing.

One file there is **not** a capability contract, and is marked as such in
its own opening line: `contracts/local-stack.md` states the mechanism
behind vwf's `local_stack` **harness** capability. It earns the same
directory for the same reason — it is doctrine above the instance that
several components would otherwise each restate — but no component
*chooses* it, so it names no provider and realizes no capability token.
