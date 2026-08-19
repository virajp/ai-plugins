# stackgen plugin

The principles-driven stack materializer. stackgen implements vwf's
stack-adapter contract with one core rule — **the dispatch rule** — and one
output shape — **the repo-owned `.agents/` tree**. It makes a product
*executable* on stacks nobody curated, by generating the project-level skills,
agents and conventions from vwf's principles catalog and current documentation,
behind a reviewer gate and your consent.

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
   detect the real stack (manifests + the graphify graph) → Context7 research →
   instantiate vwf's principles catalog with citations → the
   `stackgen-skill-reviewer` gate (loop until clean) → the same materialized
   tree. Context7 unreachable → **halt, never guess**.

**No packs ship yet.** Until the merge waves fold the curated plugins' knowledge
into packs, the menu honestly returns `templates: []` plus the open `generate`
entry, and the curated plugins remain the covered-stack path. stackgen's value
today is the uncovered tail — the stack you use that nobody wrote a plugin for.

## The `.agents/` tree

Both paths land in one committed tree at the repo root:

```text
.agents/
├── skills/<name>/SKILL.md    # materialized skills
├── agents/<name>.md          # materialized subagents
└── templates/<slug>.md       # payload frontmatter + conventions body
```

Claude Code wiring is **relative symlinks**, created by stackgen and committed:
`.claude/skills/<name>` → `../../.agents/skills/<name>` (and likewise
`.claude/agents/`). Symlink discovery is verified against the real CLI; if a
future release broke it, the fallback is sync-maintained copies with the same
ownership rules — `.agents/` stays authoritative either way. Windows checkouts
materialize git symlinks as text files; accepted, since this toolkit already
assumes a POSIX/macOS toolchain.

**Repo-owned means:** committed, editable by the project, and working for every
collaborator with no plugin installed. stackgen writes to it only in an
explicit, consent-gated run — a first pin's materialization, or a sync you
invoked — and each run is one commit via the git workflow.

`templates/<slug>.md` is what makes later fetches pure reads: frontmatter
carries every payload field (axis, languages **with the facts `/vwf:doctor`
verifies** — LSP provision, mise tool, manifest — plus harness tasks and
mechanisms), and the body is the `conventions:` prose `plan` sizes against and
`execute` writes to. That emitted-facts block is the **materialized escape** in
vwf's stack vocabulary: a language no curated plugin claims is still *known*
when its pin carries these facts.

## Skills and the agent

| Name                      | Kind                     | Does                                                                                                                                                                                  |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stackgen-stack-menu`     | adapter, model-invocable | The packs + the one open `generate` entry, as a vwf menu payload. Answers the same in every product                                                                                   |
| `stackgen-stack-template` | adapter, model-invocable | The dispatch: materialized entry → pure read; first pack pin → the materializer; `generated/…` → the generator. Unknown slug → error, never a guess                                   |
| `stackgen-sync`           | user-only                | The explicit re-sync: diffs repo copies against current packs, offers regeneration for generated entries, presents the delta for consent. Repo edits are never overwritten by default |
| `stackgen-skill-reviewer` | subagent                 | The stateless trust gate on generation: catalog fidelity, the **when-not-to-apply** checks, citations that resolve and support, honest emitted facts                                  |

## Trust: how a generated skill earns its place

A generated artifact is only as good as its checks, so every one passes three
before it lands:

1. **The catalog.** Each judgment instantiates a principles-catalog entry (vwf's
   `assets/principles/`) and cites it — including the entry's *when not to apply
   it* section, so the skill yields where the stack's own idiom already covers
   the ground. The catalog is passed in by vwf; stackgen never reaches into
   another plugin's files.
2. **The citations.** Each technology claim cites current documentation fetched
   through Context7 during the run. Thin coverage on a niche stack is disclosed,
   not padded over.
3. **The reviewer + you.** The `stackgen-skill-reviewer` agent returns `NO GAPS`
   or a numbered list, and generation loops until clean; then the materializer
   shows the full landing set as a dry-run plan and writes nothing without your
   approval.

## Caveats

- **Generation needs Context7 and the catalog.** Missing either is a halt with
  its name, not a degraded run.
- **Drift is a feature with a viewport.** Your repo's copies may diverge from an
  upgraded pack by design; `/stackgen:stackgen-sync` is where the divergence
  becomes a diff you decide about.
- **The merge waves are future work.** The plan that lands packs (and eventually
  retires the curated plugins in favour of `vwf` + `stackgen`) is gated wave by
  wave; nothing curated changes until its wave ships.
