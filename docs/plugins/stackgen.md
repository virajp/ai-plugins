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

## The dispatch rule

Given a technology a project pins, stackgen resolves it in order:

1. **Pre-created pack first.** Curated packs ship as stackgen assets under its
   `stacks/` tree — assets, not live skills, so installing stackgen floods no
   session with every stack's doctrine. A covered technology is **copied** from
   its pack into the repo — never generated.
2. **Generation only for what no pack covers.** Pin
   `generated/<technology-slug>` and the first template fetch runs the pipeline:
   resolve the **kind** → detect the real stack (manifests + the graphify graph)
   → Context7 research → instantiate vwf's principles catalog with citations →
   the `stackgen-skill-reviewer` gate (loop until clean) → the same materialized
   tree. Context7 unreachable → **halt, never guess**.

**No packs ship yet.** Until the merge waves fold the curated plugins' knowledge
into packs, the menu honestly returns `templates: []` plus the open `generate`
entry, and the curated plugins remain the covered-stack path. stackgen's value
today is the uncovered tail — the stack you use that nobody wrote a plugin for.

## Kinds — what can be generated, and its shape

Every pack and generation run declares a **kind**, and the kind — not the run —
decides the output's structure and scope, so generated output is deterministic
in shape while only content varies:

| Kind              | vwf axis               | Shape                                                                                                                                                                  |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language-bundle` | project (+ repo facts) | language + frameworks + package manager together — a lean router skill → on-demand references, config-file doctrine, paths-scoped (archetype: the `typescript` plugin) |
| `database`        | backing                | connection/migration/query doctrine, the Docker-composed `local_stack` mechanism, retention notes                                                                      |
| `cloud-provider`  | backing + deploy       | model-invocable judgment — which service when, billing, least-privilege IAM, emulators (archetype: the `gcp` plugin)                                                   |

`ci-system` and `capability-provider` are named but deliberately undefined until
their merge waves. Kinds compose through vwf's capability vocabulary — a
language bundle says "the datastore", never a database by name — so each stays
independently re-syncable.

## The output — `.claude/`, directly

The output vocabulary is **closed**: skills, agents, hooks (config + scripts),
and rules. **No MCP configuration, no LSP configuration** — LSP servers are a
plugin-manifest feature no project file can express, so the need travels as
`language_facts` in the template payload, which `/vwf:doctor` verifies.

```text
.claude/
├── skills/  agents/  hooks/  rules/   # the artifacts, auto-discovered
└── stackgen/                          # bookkeeping, not discovered
    ├── lock.yaml                      # what stackgen owns, with hashes
    ├── templates/<slug>.md            # payload frontmatter + conventions body
    └── citations/<slug>.yaml          # research sources, URLs, fetch dates
```

**Repo-owned means:** committed, editable by the project, and working for every
collaborator with no plugin installed. Two consent tiers guard every landing:
the file set is a dry-run plan you approve, and **`.claude/settings.json` is
never modified without your explicit, separate consent** — a hook script can
land while its wiring is declined (it stays inert, and the plan says so). Hook
*scripts* come only from curated packs; generation never emits an executable.

The **lockfile** is the ownership boundary: `.claude/` also holds your own
hand-written skills, so sync diffs only what the lockfile lists — anything else
is invisible to every stackgen write path. **CLAUDE.md is vwf's domain**:
stackgen never edits it, and ends a materialization by recommending
`/vwf:setup`.

`templates/<slug>.md` is what makes later fetches pure reads: frontmatter
carries every payload field (kind, axis, languages **with the facts
`/vwf:doctor` verifies** — LSP provision, mise tool, manifest — plus harness
tasks and mechanisms), and the body is the `conventions:` prose `plan` sizes
against and `execute` writes to. That emitted-facts block is the **materialized
escape** in vwf's stack vocabulary: a language no curated plugin claims is still
*known* when its pin carries these facts.

In a multi-repo product the target repo defaults to the current one; name a
member repo to materialize there instead. Each repo gets independent copies and
its own lockfile.

## Skills and the agent

| Name                      | Kind                     | Does                                                                                                                                                                                                   |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stackgen-stack-menu`     | adapter, model-invocable | The packs + the one open `generate` entry, as a vwf menu payload. Answers the same in every product                                                                                                    |
| `stackgen-stack-template` | adapter, model-invocable | The dispatch: materialized entry → pure read; first pack pin → the materializer; `generated/…` → the generator. Unknown slug → error, never a guess                                                    |
| `stackgen-sync`           | user-only                | The explicit re-sync: lockfile-anchored diff of repo copies against current packs, regeneration offers for generated entries, the delta presented for consent. Repo edits never overwritten by default |
| `stackgen-skill-reviewer` | subagent                 | The stateless trust gate on generation: catalog fidelity, the **when-not-to-apply** checks, citations that resolve and support, honest emitted facts, **kind conformance**                             |

## Trust: how a generated skill earns its place

A generated artifact is only as good as its checks, so every one passes three
before it lands:

1. **The catalog.** Each judgment instantiates a principles-catalog entry (vwf's
   `assets/principles/`) and cites it — including the entry's *when not to apply
   it* section, so the skill yields where the stack's own idiom already covers
   the ground. The catalog is passed in by vwf; stackgen never reaches into
   another plugin's files.
2. **The citations.** Each technology claim cites current documentation fetched
   through Context7 during the run, recorded durably under
   `.claude/stackgen/citations/`. Thin coverage on a niche stack is disclosed,
   not padded over.
3. **The reviewer + you.** The `stackgen-skill-reviewer` agent returns `NO GAPS`
   or a numbered list — checking the kind's structure and scope as well as the
   content — and generation loops until clean; then the materializer shows the
   full landing set as a dry-run plan and writes nothing without your approval.

## Caveats

- **Generation needs Context7 and the catalog.** Missing either is a halt with
  its name, not a degraded run.
- **Drift is a feature with a viewport.** Your repo's copies may diverge from an
  upgraded pack by design; `/stackgen:stackgen-sync` is where the divergence
  becomes a diff you decide about.
- **The merge waves are future work.** The plan that lands packs (and eventually
  retires the curated plugins in favour of `vwf` + `stackgen`) is gated wave by
  wave; nothing curated changes until its wave ships.
