# Plan: the merge waves, re-derived from stackgen's charter

**Status: draft, 2026-08-28. Not approved. Nothing moves.** The residue question
the first draft was blocked on is **answered** (see *Decided 2026-08-28*); the
waves themselves still need their individual go-aheads. This supersedes Phase 5
of [2026-08-19-stackgen.md](./2026-08-19-stackgen.md), whose Wave A does not
survive the charter that plan's own post-execution revision produced.

## Why the old Phase 5 fails

Wave A was written 2026-08-19 and groups the thirteen plugins' contents by
**live machinery vs doctrine prose**. That was coherent while stackgen's
identity was loose. It stopped being coherent the same day, when the
`.claude/`-direct rework (commit `73a3171`) fixed what stackgen is:

> MCP server configuration and LSP server configuration are **deliberately
> excluded** — stackgen never writes `.mcp.json`, and LSP servers are a
> plugin-manifest feature no project file can express. —
> [`output-tree.md`](../../plugins/stackgen/assets/output-tree.md)

**The charter test.** An artifact belongs in stackgen only if stackgen can
**materialize it into a repo's committed `.claude/` tree**, where the repo owns
it and collaborators use it with no plugin installed. Anything a repo file
cannot express is out by construction.

Wave A fails that test on three of its five items — the Claude Design MCP
server, the four LSP declarations, and the three design-adapter skills, none of
which materialize into anything. The design skills are the clearest case: they
are a **live seam** vwf invokes mid-workflow and consumes a payload from.
Nothing is generated, so there is no generated artifact and no later user of
one.

## The thirteen, by shape

The retiring plugins hold **53 skills** (82 total, less vwf's 26 and stackgen's
3). The no-skill-lost decision says 58; that is an arithmetic slip, and it is
the figure Wave D's completeness check was anchored on.

Grouping by destination — which is how the old plan read — hides the problem.
Grouping by **shape** exposes it:

| Shape                                                   | Count | Charter test          | Destination                                                                     |
| ------------------------------------------------------- | ----- | --------------------- | ------------------------------------------------------------------------------- |
| Stack-adapter pairs (`-stack-menu` / `-stack-template`) | 22    | n/a — the seam itself | **Retired**, superseded by stackgen's own two; their templates become pack data |
| Doctrine skills (paths-scoped, teach a repo file)       | 25    | **Passes**            | **Packs** — materialized into `.claude/skills/`                                 |
| Runtime seams (vwf invokes, payload returned)           | 6     | **Fails**             | **Unresolved — see below**                                                      |
| Manifest machinery (4 LSP, 1 MCP, 1 hook)               | —     | 1 of 6 passes         | **Mostly unresolved**                                                           |

The 25 doctrine skills are the bulk and the easy part: `devtools`' eight repo
gates and tool doctrine, `typescript`'s six, `flutter`'s six, `gcp`'s three,
`plugin-authoring`, and `cicd:workflow`. Every one teaches how to configure a
file the repo owns, which is exactly what a materialized skill is for.

## The residue, and how it dissolves

Six skills and five machinery items share one property: **they are
plugin-manifest features or live delegation seams, and no repo file can express
them.** Grouping by destination hid them; grouping by shape is what surfaced
them.

| Item                                                             | Why it resists                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 LSP declarations (`typescript`, `dart`, `kotlin`, `sourcekit`) | A language server is declared in a plugin manifest. Charter excludes it; `language_facts` only tells `/vwf:doctor` what to *check*, never provides the server |
| the `claude-design` HTTP MCP server                              | Same: manifest-only, under the charter as written                                                                                                             |
| 3 design-adapter import skills                                   | A live seam, and it needs that MCP server to speak the tool's API                                                                                             |
| 2 `-ux-gate` skills                                              | A live seam vwf reaches by **constructing** `<plugin>-ux-gate` from the stack pin                                                                             |
| the npm→pnpm/bun hook                                            | **Passes** — a hook script is a file; packs carry scripts                                                                                                     |

Two contracts break at Wave D on this residue, both **silently**, which is the
failure mode this repo already knows worst:

- `/vwf:feedback` and `/vwf:design-system` call
  `/design-tools:design-tools-import-*` — a **fully-qualified name** naming a
  deleted plugin
  ([`design-adapter.md`](../../plugins/vwf/assets/design-adapter.md)).
- `execute-ux-reviewer` constructs `<plugin>-ux-gate` from the stack pin
  ([`stack-adapter.md`](../../plugins/vwf/assets/stack-adapter.md)). Once stacks
  are packs there is no plugin name to construct from.

### Decided 2026-08-28 — generate the wiring, don't hold it

**The residue is not rehomed. It stops being a registry.**

The archived depth plan reasoned that curated machinery "cannot be a pack — the
output vocabulary excludes MCP/LSP — so it merges into stackgen's own plugin
manifest … a per-language `lspServers` registry". That does not follow, and the
reason it does not is the point of stackgen: **a curated registry can only ever
hold what someone curated, and stackgen exists for the uncovered tail.** A
manifest listing four language servers is structurally unable to serve "any
technology". It fails on scaling, before it fails on charter.

So stackgen **ships or generates the scripts that install LSP and MCP
configuration on demand**, and holds no list. The artifact materialized is the
installer, not the config — which is what makes it work for a technology nobody
curated.

That the charter excluded these was policy, not capability. `.mcp.json` is
already an ordinary repo file this toolkit edits
([`cli/src/config/json.ts`](../../cli/src/config/json.ts) treats it as one of
the user's own project files). LSP has no project-level surface in evidence,
which is exactly why the mechanism there is a generated **install script**
rather than a generated config file.

**The design seam goes to vwf, invoked conditionally** — the three import skills
load only when a project declares a design tool, so a product without one never
sees them. The MCP server underneath comes from stackgen's generated install, so
vwf ships no server.

**The north star closes at two.** This supersedes the finding one section above,
which held that it could not.

### Where each design artifact lands

`design-tools` already separates along the line the decision draws, so the split
is mechanical rather than a judgement per file:

| Artifact                                        | Lands in                          | Because                                                                                                                               |
| ----------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 3 × `SKILL.md` (the dispatch logic)             | **vwf**                           | Neutral — knows what a payload *is*, not how to fetch one                                                                             |
| 9 × `references/<tool>.md` (3 tools × 3 skills) | **stackgen**                      | Per-tool API knowledge is stack knowledge                                                                                             |
| `assets/canvas-push.md`                         | **stackgen**                      | The Canvas Push Protocol is one tool's MCP operations                                                                                 |
| `assets/canvas-claude.md`                       | **vwf**                           | Names no design tool — its only `stitch` hits are the English verb, the very false positive that keeps the token out of `TOOL_TOKENS` |
| the `claude-design` MCP server                  | **stackgen**, as generated wiring | Installed on demand, never held                                                                                                       |

**The seam vwf uses to reach the per-tool knowledge is the `ux-gate` mechanism,
not a second one.** stackgen materializes the resolved tool's reference as a
repo-owned artifact and vwf invokes a **fixed name in the repo's own
`.claude/`** — the same shape that dissolves the `-ux-gate` name construction.
One mechanism covers both seams, and neither needs vwf to construct a name from
configuration, which is the property the old adapter contract existed to
protect.

**Why the template is the adapter's today, and why moving it is safe.**
`/vwf:screens prompt` names it only as *the adapter's conventions template*
(`skills/screens/references/prompt-mode.md`) and never constructs a path into
another plugin — which is correct, since `${CLAUDE_PLUGIN_ROOT}` names only its
own. Once the adapter dissolves, vwf can own the file outright, because it names
no tool. **Fixed in passing 2026-08-28:** `CLAUDE.md` had listed `canvas-claude`
among vwf's `assets/templates/`, where it has never been.

### What the decision costs

Three amendments, none of them free:

- **The output vocabulary gains an install-script kind**, or "hook scripts are
  pack-only, never generated" relaxes to admit them
  ([`output-tree.md`](../../plugins/stackgen/assets/output-tree.md),
  [`kinds.md`](../../plugins/stackgen/assets/kinds.md)).
- **`.mcp.json` reopens as a permitted target**, under the existing tier-2
  consent model that already governs `.claude/settings.json` — a separate,
  skippable consent line, never folded into the ordinary dry-run gate.
- **The technology-free guard must survive the design move.** `plugins:check`
  bans `claude-design` in vwf outside a three-path allowlist, and the guard's
  own comment says adding an entry "should require arguing for it, which is the
  point". Keep the **per-tool** references (`claude-design`, `lovable`,
  `stitch`) on the stackgen side, materialized beside the MCP wiring — tool-
  specific API knowledge is stack knowledge. vwf then holds only the neutral
  dispatch skills, whose mention of all three reads as an enumeration and
  already passes. **If the per-tool references land in vwf instead, the guard
  needs new exceptions**, and that is the argument this plan declines to make.

### The ux-gate seam dissolves the same way

The gate is stack-specific (Flutter golden tests + `meetsGuideline`; Playwright

- axe) and the stack is known at materialization time — so the pack lands a
  repo-owned `ux-gate` skill and vwf invokes a **fixed** name in the repo's own
  `.claude/`. That removes the name-construction contract rather than rehoming
  it.

## Re-derived waves

- **Wave A — the part that passes today.** `devtools`' `scaffold` plus its five
  repo gates (`dprint`, `eslint`, `gitleaks`, `grype`, `pre-commit`) become
  stackgen's first pack. No LSP move, no MCP move, no design move, and **no
  dependency flip** — `mise` is a `/vwf:doctor` blocking mandate whose doctrine
  still lives in `devtools`, so flipping vwf's dependency would leave users the
  halt without the doctrine that explains it.
- **Wave B — capability contracts.** Unchanged from the old plan: the five
  neutral contracts join the curated knowledge, their named providers become
  packs. Nothing here failed the charter test.
- **Wave C — stacks become packs.** The 25 doctrine skills plus the stack
  templates. The 22 adapter skills retire here, not at Wave D, since stackgen's
  own two answer once the packs exist. The `-ux-gate` materialization lands
  here.

### Why the 22 adapter skills cannot retire yet — found 2026-08-29

Wave C assumed the adapter skills retire once packs exist, "since stackgen's own
two answer once the packs exist". Packs now exist and **stackgen's two cannot
answer in their place**, because they answer a different question.

`stackgen-stack-menu` lists **components** — one entry per `pack.yaml`. A
project pins a **bundle**, which `pack-format.md` defines as *"a recorded
composition of component refs, never a directory"*. Nothing yet performs that
composition, so nothing offers the user a bundle to pick.

The gap is concrete. The curated `typescript` menu offers **twelve named
compositions** — `typescript-effect-hono` for a service,
`typescript-astro-react` for a site, `typescript-effect-cli` *and*
`typescript-parseargs-cli` as two answers for `cli`, `pnpm-turbo` /
`pnpm-workspace` / `bun` as three for the repo axis. Against that, the landed
TypeScript bundle is **one** language component. Retiring the adapter today
would replace twelve reviewed options with one, and the framework components
those compositions name — Hono, Astro, Refine, Effect CLI, Pulumi, the Temporal
worker — are not packed at all.

**So retirement needs two things first**, and neither is a fold:

1. The missing **framework components**, one pack each.
2. A **composition step** — the menu offering bundles rather than components,
   and the template skill resolving a pinned bundle into its component refs. The
   kinds already say what composes with what; nothing yet does it.

Until both land, the curated adapters stay, and a plugin whose adapter is still
live cannot be deleted — which is the no-skill-lost rule doing its job rather
than an oversight.

## The skill census — run 2026-08-29

The check
[no-skill-lost](../memory/decisions/2026-08-27-no-skill-lost-in-the-merge-waves.md)
demanded, run against the thirteen plugins' **53** skills as they stood at
`65d2acd`. Every destination below was verified to exist on disk, not asserted.

| Outcome          | Count | Meaning                                                                                   |
| ---------------- | ----- | ----------------------------------------------------------------------------------------- |
| **Migrated**     | 25    | Lives in a pack, a stackgen asset, or vwf; file confirmed present                         |
| **Retired**      | 18    | Stack adapters superseded by stackgen's two plus bundles                                  |
| **Kept**         | 7     | The 4 `gcp`/`cloudflare` adapters, plus `mise`/`scaffold`/`doppler` — `devtools` survives |
| **Not migrated** | 3     | **Blocks its plugin's deletion** — the `gcp` three                                        |

**53 of 53 accounted for.** Nothing is unexplained, which is the property the
census exists to establish.

**Re-run 2026-08-29 after the `docker` fold**, and it still reconciles: 29
skills remain outside `vwf` and `stackgen`, and 24 are gone — the 18 retired
adapters, the 3 design imports absorbed into vwf, the 2 `-ux-gate` skills
materialized into their packs, and `devtools/docker`. Of the 29 remaining, 4 are
the kept `gcp`/`cloudflare` adapters, 7 block deletion, and 18 are migrated
skills whose curated source still ships beside its pack. `docker` moves from
*not migrated* to *migrated*, which is the only cell that changed.

**Re-run again after the `claude-code` dissolution**: 28 remain, 25 are gone.
`plugin-authoring` moves to *migrated* — split across a stackgen asset and this
repo's private tree — leaving **six** blockers. Both totals still reconcile
against 53.

**Re-run once more after `devtools` was reprieved.** Nothing moved on disk, but
three rows changed meaning: `mise`, `scaffold` and `doppler` are **kept**, not
*not migrated*, because the plugin holding them is no longer scheduled for
deletion. **Three blockers remain** — the `gcp` three — and they are the
deferred cloud research, blocking by design.

### The eight that blocked deletion

- `gcp/gcp-cost`, `gcp/gcp-iam`, `gcp/gcp-local-stack` — the deferred cloud
  research. Known, and blocking by design rather than by oversight.
- ~~`devtools/mise`, `devtools/scaffold`~~ — **resolved 2026-08-29**; see below.
- ~~`devtools/docker`~~ — **resolved 2026-08-29**; see below.
- ~~`devtools/doppler`~~ — **resolved 2026-08-29**, by dissolution; see below.
- ~~`claude-code/plugin-authoring`~~ — **resolved 2026-08-29**; see below.

Each is a **destination question, not a fold** — which is why the census is
worth running before deletions rather than after.

### Resolved 2026-08-29 — `devtools/docker`, and the eighth kind

Folding it required answering two things the item's one-line description did not
anticipate.

**It was two skills wearing one hat, and the fold split them.** Its own opening
paragraph said so: containers do two unrelated jobs, and conflating them is the
usual mistake. Only the deploy artifact is a `deploy-target`.

| Half                                                               | Landed in                               | Because                                                           |
| ------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------- |
| The deploy artifact — build file, ignore file, one digest promoted | `stacks/deploy-target/container-image/` | It is what a project pins on the deploy axis                      |
| The local stack — Compose behind `wait-on` gates                   | `assets/contracts/local-stack.md`       | A repo needs one whether or not it pins a container deploy target |

Putting the local stack inside the deploy pack would have made it conditional on
a deploy choice it has nothing to do with — a product deploying to a managed
cloud service still runs a local stack. The contract is the **first harness
contract** in `contracts/`, whose five existing files are all *capability*
contracts; it says so in its own opening line, and `taxonomy.md` records the
distinction so the directory does not quietly become two things.

**There was no kind a `deploy-target` pack could ride**, so this defines the
**eighth**, per `kinds.md`'s own practice of defining a kind at the wave that
needs it. It is the first with **no second half** — one component standing
alone, because there is no category above a provider-neutral target to write
doctrine at. Its discipline is a scope fence instead of a pairing: the pipeline
is the `ci-system`'s, the managed flavour a `cloud-provider`'s, the local stack
the harness contract's.

Defining it exposed that **both** deploy bundles had been declaring
`kind: language-bundle` as a placeholder. `container-generic`'s ref is now
`deploy-target/container-image@0.1.0` rather than `@generated`; `npm-package`
declares the right kind but keeps its `@generated` ref, since no `npm-registry`
pack exists yet.

**`devtools/docker` was deleted in the same commit** — the first pack whose
source skill did not survive its landing. The no-skill-lost rule is satisfied
because the pack and the contract together carry everything it said, which is
the test the rule actually asks for, rather than the plugin outliving it.

Two pieces of pre-existing residue were cleared in passing: the nine retired
adapters' dead `plugins/*/stacks/` trees are still present for eight of them
(`devtools`' was removed here, being the same artifact this pack curates), and
`docs/plugins/devtools.md` and `docs/plugins/stackgen.md` both still described
the Wave-C world. The stackgen kind table listed three kinds and called two of
them undefined; it now lists all eight.

- **Wave D — retirement, conditional.** Deletion still gated on the
  [no-skill-lost](../memory/decisions/2026-08-27-no-skill-lost-in-the-merge-waves.md)
  rule, with the before/after inventory counted against **53**, not 58. The
  marketplace floor is **three** entries (`vwf`, `stackgen`, `devtools`) plus
  whatever `gcp` and `cloudflare` resolve to. Wave D now also owes the three
  amendments under *What the decision costs* — the install-script kind, the
  `.mcp.json` reopening, and the guard surviving the design move — since each is
  a precondition for something Wave D deletes.

### Resolved 2026-08-29 — `claude-code`, dissolved rather than folded

The framing in the item above was wrong, and Viraj's correction is what fixed
it:

> Plugin creation is limited to this repo only and NOT part of distribution.
>
> - **Structure of plugin** (marketplace.json, plugin.json, etc) — limited to
>   this repo, must NOT be distributed.
> - **Doctrine to validate skills, agents, hooks, mcp, lsp, etc** — distributed
>   via stackgen, since it will generate skills, agents, etc which will be
>   validated by this doctrine.

`plugin-authoring` was never one thing, which is why no component type fit it.
It was two, with two different reasons to exist:

| Half                                                                                    | Landed in                                                 | Because                                                                                    |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin structure — manifest, discovery, versions, marketplace + its traps               | `.claude/skills/plugin-authoring/references/structure.md` | Nobody outside this repo builds plugins; distributing it teaches a thing we do not offer   |
| Artifact validity — frontmatter, invocation states, hook verdict shapes, MCP/LSP wiring | `plugins/stackgen/assets/artifact-doctrine.md`            | stackgen **generates** skills, agents and hooks; this is what its output is judged against |

The second is an **asset, not a pack** — it governs stackgen's output rather
than being part of it, is never materialized, and applies to every generation
run whatever the stack. The seam against `kinds.md` is clean: kinds decide what
an artifact must *cover*, this decides whether it *works*. The reviewer gained a
ninth check and the generator's write step now names it.

**The plugin is deleted**, along with `docs/plugins/claude-code.md`. The
marketplace is 14 entries.

**The `claude-code-plugin` bundle survives, trimmed.** It was kept for a reason
that had to be argued rather than assumed: it exists so this repo can stay
onboarded on vwf, and dogfooding is what has surfaced vwf's real gaps. It is
also not a special case — every one of the 19 bundles is a stack its author
uses, so "no outside demand" is a test this repo applies to nothing else. What
was actually wrong was its **body**, which restated plugin-structure doctrine
and shipped it to everyone; that is cut back to bare stack facts.

### Resolved 2026-08-29 — `devtools` survives, and three blockers dissolve

Put to Viraj as the type decision the plan said it was. The answer: `mise`
**stays in `devtools`**, and that plugin survives as vwf's one dependency.
Recorded in full at
[`2026-08-29-devtools-survives-the-waves.md`](../memory/decisions/2026-08-29-devtools-survives-the-waves.md).

The reasoning that outlives the call:

- **`mise` is a `/vwf:doctor` blocking mandate.** Doctrine explaining a halt
  belongs beside the halt, not in a plugin the user may not have pinned.
- **`scaffold` is a live seam, not doctrine** — `/vwf:setup` invokes it, and a
  skill vwf cannot see fails silently. The same shape that sent the design
  adapters to vwf. It also copies 28 task files into `.config/`, outside
  stackgen's `.claude/`-only output vocabulary.
- **`scaffold` cannot be split from `mise`**: it lays down the standard the
  `mise` skill defines. A writer and its spec do not live in different plugins.

**`devtools/doppler` stopped being a blocker without being answered.** It only
blocked because it had no home once `devtools` was deleted. There is no
deletion, so no `secrets` capability token needs minting in vwf — closed, not
deferred.

**The cost, stated rather than discovered later.** Seven bundles name mise in
prose and no component supplies it — `pnpm-workspace.md` says *"the task runner
is the only orchestration"*. That hole is permanent by choice now. A bundle
assuming the machine has a toolchain manager is no stranger than assuming it has
git, but it is an assumption, and `devtools` is where a user gets it.

**The north star closes at three**, not two: `vwf` + `stackgen` + `devtools`.
That supersedes the count in the 2026-08-17 decision, not its reasoning.

## Verification

Unchanged per wave: `plugins:marketplace --check`, `plugins:check`,
`vitest run`, `typescript:test`, `dprint check`. Two additions this plan owes:

- The **LSP-inertness claim** is moot for the registry that will not now be
  built, but the generated installer inherits the same question in a smaller
  form: what an install script writes must not start a language server in a repo
  that has no matching files. Prove the mechanism against the real CLI before
  Wave C ships one — it is `target-verifier`'s job.
- **That a generated install script is discovered and runnable at all** is
  unproven. It is a new output kind, and the charter forbade it until today.
- The **skill census** — 53 in, 53 accounted for — runs at every wave boundary,
  not only at Wave D.
