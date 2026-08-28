# stackgen plugin

The principles-driven stack materializer. stackgen implements vwf's
stack-adapter contract with one core rule — **the dispatch rule** — and one
output shape — **generated artifacts landing directly in the repo's committed
`.claude/` tree**. It makes a product *executable* on stacks nobody curated, by
generating project-level skills, agents, hooks-wiring and rules from vwf's
principles catalog and current documentation, behind a reviewer gate and your
consent.

Configure, not conjure: stackgen wires and documents existing tools — it never
implements a server, and it never invents a tool the ecosystem does not have.

## Install

```sh
claude plugin install stackgen@virajp-plugins
```

Independent of `vwf` at install time — but its two adapter skills exist to be
called by `/vwf:architecture`, `/vwf:setup`, `/vwf:plan` and `/vwf:execute`, so
in practice you list it in the product's roster:

```yaml
# .config/vwf.yaml
stacks: [ stackgen ] # alongside any curated stack plugins
```

## Components and bundles

**Components** are the atoms — the language, its package manager, each
framework, each toolchain gate, a datastore instance, a cloud service. Each is a
pack (or a generated artifact set) declaring a **type**, a finer **category**,
and the vwf **capability** token it realizes where one applies; the type and
category vocabularies are closed, in `assets/taxonomy.md`, extended
deliberately.

**Bundles** are recorded compositions of component refs —
`<type>/<slug>@<version>`, or `@generated` — never directories. Three bundle
shapes exist today: a Language-Bundle is the composition rooted at a language
component (language + package manager + framework components + toolchain gates);
a Cloud-Bundle is provider + service components; a Datastore-Bundle is
category-level doctrine + an instance component.

The taxonomy splits at the existing seam: **capability tokens stay vwf's**
(`capability-vocabulary.md`); the finer **category taxonomy is stackgen's**. vwf
never learns what an ORM is; stackgen never redefines a capability — the `cdn`
category's capability token is deliberately unset until vwf defines one.
Categories make components substitutable answers to one blueprint capability,
which is what lets stack menus become category-filtered queries instead of
per-plugin lists. Category-level doctrine is written once as curated knowledge;
instance components cite it and stay thin.

## The dispatch rule

Given a bundle a project pins, stackgen resolves its composition and dispatches
**per component**:

1. **Pre-created pack first, per component.** Curated packs ship as stackgen
   assets under its `stacks/` tree — one pack per component, assets, not live
   skills, so installing stackgen floods no session with every stack's doctrine.
   A component a pack covers is **copied** from its pack into the repo — never
   generated.
2. **Generation only for what no pack covers, per uncovered component.** The
   first template fetch runs the pipeline for each uncovered component: resolve
   the **kind** and its topic bar → detect the real stack (manifests + the
   graphify graph) → one Context7 research pass per bar topic → instantiate
   vwf's principles catalog with citations → the `stackgen-skill-reviewer` gate
   (capped at **four rounds**, after which residuals are reported rather than
   looped forever) → the same materialized tree. Context7 unreachable → **halt,
   never guess**. When the bundle root itself is uncovered, the pin is
   `generated/<technology-slug>`.

Mixed compositions are the ordinary case — a covered language beside an
uncovered framework copies the language's packs and generates only the
framework's artifact — so a later re-sync can act on one component alone.

**Wave A landed the first four packs** — `dprint`, `gitleaks`, `grype` and
`pre-commit`, the `repo-gate` kind's components. Their doctrine still ships from
`devtools` as well: a pack is the destination the no-skill-lost rule requires
*before* a curated plugin can retire, not a replacement the moment it lands.

Everything else waits for its wave, so the menu still leans on the open
`generate` entry and the curated plugins remain the covered-stack path for every
language, cloud and capability. stackgen's value today is the uncovered tail —
the stack you use that nobody wrote a plugin for.

## Kinds — what can be generated, and its shape

Every pack and generation run declares a **kind**, and the kind — not the run —
decides the output's structure and scope, so generated output is deterministic
in shape while only content varies:

| Kind              | vwf axis               | Shape                                                                                                                                                                                                                                                   |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language-bundle` | project (+ repo facts) | the composition rooted at a `language` component — a **12-topic bar** behind a lean router skill → on-demand references, plus paths-scoped doctrine per config file the toolchain owns (archetype: the `typescript` plugin)                             |
| `database`        | backing                | a **6-topic bar** on the instance component — pick & trade, data-model constraints, clause-by-clause satisfaction of the neutral datastore contract *by citation*, connection & access incl. credentials, cost shape, the Docker-composed `local_stack` |
| `cloud-provider`  | backing + deploy       | **4 provider topics** (cost, IAM, local-dev map, networking & private plane) + **5 per `cloud-service` component**, plus artifact/pipeline/health where the service's category is `compute` (archetype: the `gcp` plugin)                               |

`ci-system` and `capability-provider` are named but deliberately undefined until
their merge waves. Kinds compose through vwf's capability vocabulary — a
language bundle says "the datastore", never a database by name — so each stays
independently re-syncable.

Each kind's structure **is a topic bar**: a closed list of topics the output
must cover, one artifact per topic, lazy-loaded — a reference behind a lean
router skill, or a paths-scoped doctrine skill on the config file it governs. A
conditional topic the detected stack makes inapplicable is stated `n/a` with
why, never silently skipped. Each artifact is sized like the curated archetype's
references — **60–130 dense lines of judgment**: shorter usually means the
research was thin; longer usually means restated API reference material that
belongs in Context7 at use time.

The **composition** covers the bar, whichever components supply each topic: the
language component owns standards, errors, async, testing, build and
config/observability wiring; the package-manager component owns the manifest and
workspace/supply-chain topics; toolchain-gate components own the compiler config
and lint/format gates; and each framework component supplies one usage reference
of its own.

The **framework ruling**: generation is selection-neutral and usage-opinionated
— it never opines on *which* framework (the pin and the packs own selection),
and every usage opinion traces to a source in precedence order: the repo's own
**detected** settled pattern, then the framework's **documented recommendation**
(cited), then a **catalog entry** instantiated (cited). A genuinely split
ecosystem choice with no detection signal is presented as an **open decision**
with real options — never fake consensus. Dependencies get no reference — a line
in manifest doctrine at most; frameworks are written against, dependencies are
looked up at use time.

## The output — `.claude/`, directly

The output vocabulary is **closed**: skills, agents, hooks (config + scripts),
and rules. **No MCP configuration, no LSP configuration** — LSP servers are a
plugin-manifest feature no project file can express, so the need travels as
`language_facts` in the template payload, which `/vwf:doctor` verifies.

```text
.claude/
├── skills/  agents/  hooks/  rules/   # the artifacts, auto-discovered
└── stackgen/                          # bookkeeping, not discovered
    ├── lock.yaml                      # one entry per path, per component
    ├── templates/<slug>.md            # payload (incl. components:) + prose
    └── citations/<component>.yaml     # sources per component, keyed by topic
```

**Repo-owned means:** committed, editable by the project, and working for every
collaborator with no plugin installed. Two consent tiers guard every landing:
the file set is a dry-run plan you approve, and **`.claude/settings.json` is
never modified without your explicit, separate consent** — a hook script can
land while its wiring is declined (it stays inert, and the plan says so). Hook
*scripts* come only from curated packs; generation never emits an executable.

The **lockfile** is the ownership boundary: `.claude/` also holds your own
hand-written skills, so sync diffs only what the lockfile lists — anything else
is invisible to every stackgen write path. Each entry carries the component and
source it came from (`pack/<type>/<slug>@<version>` or `generated`), which is
the grain sync acts at — one framework's bump never churns the language
component beside it. **CLAUDE.md is vwf's domain**: stackgen never edits it, and
ends a materialization by recommending `/vwf:setup`.

`templates/<slug>.md` is what makes later fetches pure reads: frontmatter
carries every payload field (kind, axis, the `components:` refs this bundle
composes — `<type>/<slug>@<version>` or `@generated` — languages **with the
facts `/vwf:doctor` verifies** — LSP provision, mise tool, manifest — plus
harness tasks and mechanisms, with `frameworks`/`capabilities` derived from the
composition), and the body is the `conventions:` prose `plan` sizes against and
`execute` writes to. That emitted-facts block is the **materialized escape** in
vwf's stack vocabulary: a language no curated plugin claims is still *known*
when its pin carries these facts.

In a multi-repo product the target repo defaults to the current one; name a
member repo to materialize there instead. Each repo gets independent copies and
its own lockfile.

## Skills and the agent

| Name                      | Kind                     | Does                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stackgen-stack-menu`     | adapter, model-invocable | The packs + the one open `generate` entry, as a vwf menu payload. Answers the same in every product                                                                                                                                                     |
| `stackgen-stack-template` | adapter, model-invocable | The dispatch: materialized entry → pure read; a first pin resolves the bundle's composition and dispatches **per component** — packs copied, uncovered components generated — landing once behind one consent gate. Unknown slug → error, never a guess |
| `stackgen-sync`           | user-only                | The explicit re-sync, **per component**: lockfile-anchored diff against current component packs, regeneration offered per generated component, the delta presented for consent. Repo edits never overwritten by default                                 |
| `stackgen-skill-reviewer` | subagent                 | The stateless trust gate on generation: catalog fidelity, the **when-not-to-apply** checks, citations that resolve and support, honest emitted facts, **kind conformance**, and **topic-bar coverage** against the composition                          |

## Trust: how a generated skill earns its place

A generated artifact is only as good as its checks, so every one passes three
before it lands:

1. **The catalog.** Each judgment instantiates a principles-catalog entry (vwf's
   `assets/principles/`) and cites it — including the entry's *when not to apply
   it* section, so the skill yields where the stack's own idiom already covers
   the ground. The catalog is passed in by vwf; stackgen never reaches into
   another plugin's files.
2. **The citations.** Each technology claim cites current documentation fetched
   through Context7 during the run — the primary research channel, one pass per
   bar topic minimum — recorded durably under `.claude/stackgen/citations/`, one
   file per component keyed per topic. Supplementary sources are allowed only
   where that topic's Context7 coverage is thin, and both the supplement and the
   thinness are disclosed.
3. **The reviewer + you.** The `stackgen-skill-reviewer` agent returns `NO GAPS`
   or a numbered list — checking the kind's **topic-bar coverage** and depth as
   well as the content — and generation loops under a convergence guard of
   **four rounds**, after which residuals are reported rather than looped
   forever or landed quietly; then the materializer shows the full landing set
   as a dry-run plan and writes nothing without your approval.

## Caveats

- **Generation needs Context7 and the catalog.** Missing either is a halt with
  its name, not a degraded run.
- **Drift is a feature with a viewport.** Your repo's copies may diverge from an
  upgraded pack by design; `/stackgen:stackgen-sync` is where the divergence
  becomes a diff you decide about.
- **The merge waves are future work.** The plan that lands packs (and eventually
  retires the curated plugins in favour of `vwf` + `stackgen`) is gated wave by
  wave; nothing curated changes until its wave ships.
