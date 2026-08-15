---
name: setup
description: Bring a repo into vwf's format and keep it there. Step 0 resolves
  one of three entry paths — onboard (a blank repo bootstraps, a repo with code
  is detected and confirmed), migrate (reconcile a tree written against an older
  format), or current (say so and exit) — then runs the shared spine that
  validates, stamps .config/vwf.yaml, checks the repo, commits, and prints the
  chain forward.
model: sonnet
effort: high
disable-model-invocation: true
---

# setup — Onboard & Keep a Repo in vwf Format

Bring any repo — new, existing, or written against an older vwf format — into
the shape the rest of the workflow reads. `setup` is the Phase-0 bootstrapper of
`setup → product → architecture → design-system → blueprint → plan → execute`,
and the only vwf command that onboards.

**The mode is resolved once, in Step 0, and never re-derived.** Everything after
it branches on the named mode. There is no progress key and no resume state:
re-running **is** the resume mechanism — a conforming repo resolves to
`current`, and a half-finished onboard re-detects and produces a smaller plan.

You own the user conversation, per `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` — one
decision per round, MCQ where an option set exists. Every write is
consent-gated; never delete, never overwrite without consent.

## References

Read the one the step needs, not all of them.

| Reference                                                      | Read it when                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| [onboard pipeline](references/onboard-pipeline.md)             | mode `onboard` — both sub-paths                                    |
| [migrate pipeline](references/migrate-pipeline.md)             | mode `migrate`, and an old tree found under `onboard`              |
| [topology detection](references/topology-detection.md)         | detecting or confirming topology, roles, platforms, stacks         |
| [structure](references/workspace-structure.md)                 | presenting the topology menu, or writing a layout recommendation   |
| [migration & consent](references/migration-and-consent.md)     | the dry-run discipline every write in either pipeline goes through |
| [format lineage](references/format-lineage.md)                 | a retired spelling has to resolve to what it became                |
| [environment bootstrap](references/environment-bootstrap.md)   | the registry declares integrations or a secrets-manager `config`   |
| [memory tree](references/memory-tree.md)                       | writing `docs/memory/` and the product's `mempalace.yaml`          |
| [CLAUDE.md section](references/claude-md.md)                   | merging the vwf section into the repo's `CLAUDE.md`                |

## Hard Rules

- **Consent + dry-run.** Present the full plan — every create, move and update —
  and get approval before any write.
- **Worktree-safe; all git via /vwf:git-workflow.** Operate in an isolated
  worktree and keep it local; never push. If the working tree is dirty, ask
  whether to commit, stash, or proceed before creating it.
- **Never move source.** setup writes and moves documentation only. Layout
  drift is a written recommendation — see Recommendations, never moves.
- **Don't duplicate tools.** `/devtools:scaffold` for mise config. **Never
  write a README by hand** — `/vwf:readme` owns it, and setup only names
  it in the chain.
- **Idempotent.** A migrate run reconciles only what drifted; a conforming tree
  yields an empty plan, and Step 0 routes it to `current` before that.

## Step 0 — Resolve the mode

Read `.config/vwf.yaml`, then compare its `blueprint_format` and `config_format`
against the shipped integers (`${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`, and the
current `config_format` named in `${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`).

| `.config/vwf.yaml`                                       | Mode      |
| -------------------------------------------------------- | --------- |
| absent, and no legacy `docs/blueprint/.vwf.yml`          | `onboard` |
| parseable, either stamp behind — or only the legacy file | `migrate` |
| parseable, both stamps current                           | `current` |
| present but **unparseable**                              | halt      |

**Unparseable halts.** Report the parse error verbatim with the line it names,
and give the two remedies — fix the file, or delete it and re-run to onboard
from scratch. Never onboard over it: a config that will not parse still records
decisions nothing else does, and overwriting it discards them silently.

**`onboard` forks once more — on evidence, not on a second mode.** A **blank**
repo has no package or language manifest, no source directories, and no
`docs/blueprint/` tree. A README, LICENSE, `.gitignore`, `.gitattributes`, and
tooling-only configs (mise, formatter, linter, pre-commit — at the root or under
`.config/`) are **not** code: a repo holding only those is blank. Anything else
takes the code sub-path. Both are in the onboard pipeline.

**An old `docs/blueprint/` tree found under `onboard`** is handed to the migrate
pipeline once detection is confirmed. The two are one reconciliation at
different elicitation depths — onboard elicits every decision, migrate carries
most forward and maps the renames.

**`current` reports and exits.** Name both stamps, say the repo is current, and
print the chain below. Nothing re-walks the repo: that is
`/vwf:doctor`'s job, and saying so is the whole report.

## The shared spine

Run the mode's pipeline. It returns the facts the config is written from and the
recommendations the report carries. Then, in this order — the ordering is the
point, since a stamp written before validation describes a tree nothing checked:

1. **Validate the bundle.** Every `docs/blueprint/` doc opens with valid OKF
   frontmatter and every relationship link resolves (the blueprint-authoring
   `frontmatter-and-links` reference); every YAML artifact parses; the required
   foundations are present for what the registry declares; `environment.md`
   carries no secret values. A bundle that fails here never reaches a stamp.
2. **Write `.config/vwf.yaml`.** `${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md` is
   authoritative for every key — write the two stamps plus exactly what the
   pipeline elicited, and nothing it did not. For a multi-repo product also
   write each member's `.config/vwf-membership.yaml`, per
   `${CLAUDE_PLUGIN_ROOT}/assets/membership.md`; which members are on this machine is
   detected every run and never recorded.
3. **Run /vwf:doctor** over the repo — it checks the config just written
   against what the repo actually is. setup **records** what it reports and does
   not gate on most of it: a missing LSP plugin or an unbuilt harness capability
   is a normal state for a freshly onboarded repo.

   **Halt on a `blocking` finding, and revert the stamp** — delete
   `.config/vwf.yaml` if this run created it, else `git checkout --` it — so no
   stamped-but-unrunnable artifact survives the halt. Report the finding with
   its remedy. A language no installed stack plugin declares is the blocking
   kind an otherwise-onboarded repo reaches: say plainly that the menu is closed
   to what the installed plugins define
   (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`), and never invent a template to
   get past it.

   **Two exceptions.** A **declined graph build** is a settled choice, not an
   unmet mandate — note it as a degradation and finish. A **declined `iac`
   extraction** recorded under `enforcement:` is the same: the finding stays, as
   a warning reported every run, and neither setup nor
   `/vwf:execute` halts on it.
4. **Approval gate & commit.** Summarize everything created and updated, plus
   the recommendations, and wait for approval. On approval commit via
   `/vwf:git-workflow` with a `chore(vwf):` or `docs:` message.
5. **The graph offer.** Per `${CLAUDE_PLUGIN_ROOT}/assets/graphify.md`, `setup` is the
   **only** vwf command that builds graphs. After the commit, if
   `graphify-out/graph.json` is missing and the CLI is on `PATH`, offer —
   consent-gated; it is a long build — to build it against the **main
   checkout's** root, never the worktree, and to install the refresh hook. A
   decline is honored without re-asking.
6. **Chain forward.** Print the ordered chain and stop:
   `/vwf:product` → `/vwf:architecture` →
   `/vwf:design-system` (once a project declares a screen
   platform) → `/vwf:blueprint`, with
   `/vwf:readme` optional at any point. Offer to start
   `/vwf:product` now. **setup runs none of them** — each
   resolves its own mode and reports what it did, which a gate here can only
   guess at on their behalf.

## Recommendations, never moves

setup moves no source file. A repo whose layout differs from its topology
template's grouping, and an `iac` project sitting inside another project's repo,
both end the run as **written recommendations** in the report — each naming the
target layout (`references/workspace-structure.md`) and why it is worth the
work. Recording a decline under `enforcement:` stops the proposal recurring, not
the finding: `/vwf:doctor` keeps reporting it as a warning,
which is the honest state of a repo that chose its own shape.

**Persist the decisions.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the
durable onboarding decisions and their rationale — topology, linkage, roles and
platforms, screen surfaces, stack pins — to room `decisions`, skipping what the
docs capture verbatim, and **recall** that room before Step 0 so a re-run builds
on what was settled. Skip mempalace silently when it is unavailable; the
`docs/memory/` mirror is always written.
