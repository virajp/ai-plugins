# The Onboard Pipeline

Read this in mode `onboard`. Step 0 has already decided which of the two
sub-paths applies — **blank** (no manifest, no source directories, no
`docs/blueprint/`) or **code** (anything else).

Neither sub-path validates, stamps, commits, or prints the chain. Each gathers
its facts, writes the docs it is responsible for, and hands both back to the
shared spine in SKILL.md. Everything written here goes through the dry-run and
consent discipline in [migration & consent](migration-and-consent.md).

## Blank — bootstrap only

A blank repo has nothing to interrogate. Asking it topology, registry or stack
questions asks the user to invent an architecture at the moment they have the
least information; those decisions belong to
`/product` and `/architecture`, which
have the product contract to derive them from. This path exists to make the repo
ready for that conversation and nothing more.

In order:

1. **Tooling.** If the mise config is missing, invoke
   `/scaffold`. If it fails, report the error and offer
   to continue without it, leaving the mise config to the user.
2. **Docs scaffold.** Create `docs/blueprint/` and `docs/plans/` with
   `docs/plans/archived/`. Nothing inside `docs/blueprint/` is authored here —
   an empty tree is the honest state of a product nobody has described yet, and
   a skeleton full of placeholders is not.
3. **The memory tree.** `docs/memory/` with its seven rooms and the three
   gitignored ones, plus the product's `mempalace.yaml`, per
   [the memory tree](memory-tree.md).
4. **The graph ignore file.** Write `.graphifyignore` at the repo root with the
   vwf-standard excludes, per `%%AI_PLUGINS_ROOT%%/assets/graphify.md`. A blank repo
   has no repo-specific noise to detect, so the standard set is the whole file.
5. **CLAUDE.md.** Merge the vwf section from
   `%%AI_PLUGINS_ROOT%%/assets/templates/project-claude.md` into the repo's
   `CLAUDE.md`, preserving everything already there, per
   [the CLAUDE.md section](claude-md.md).
6. **The two questions.** `product.name` and `memory.wing`, each one MCQ,
   proposed from the repo directory name. These are the **only** questions this
   path asks.

Return `product.name`, `memory.wing`, and both stamps. Write **no** `topology`,
`linkage`, `members`, `harness`, `ui`, `enforcement`, or per-project block: a
key describing projects that do not exist yet is not a default, it is a claim
the repo cannot support. Their absence is the **structure-pending** state, which
`/doctor` reads as early rather than as drift.

## Code — detect, then confirm

Detection is a starting point, never the truth. Everything below is presented
and corrected by MCQ, one decision per round, per
`%%AI_PLUGINS_ROOT%%/assets/elicitation.md`.

**Recall first.** Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, read room `decisions`
for prior topology, surface and stack confirmations — build on them rather than
re-asking. **Graph-first** where one exists: per
`%%AI_PLUGINS_ROOT%%/assets/graphify.md`, query `graphify-out/graph.json` for the
system shape before reading manifests, then confirm what it reports against
them. Both degrade silently when unavailable.

**Resolve the base repo before anything else**, per
`%%AI_PLUGINS_ROOT%%/assets/membership.md`. A run started inside a member of an
already-onboarded product must operate on the product, not re-onboard the one
repo it is standing in — which is exactly what a user adding a repo will do.

### Triangulate, don't interrogate

Role, platforms and stack are three mutually constraining facts, and reading
them as one chain turns four disjoint questions into one evidenced proposal.
Per [topology detection](topology-detection.md):

1. **Manifest → candidate templates.** Each project directory's manifest
   narrows the project-axis templates the installed stack plugins offer, asked
   for by contracted name per `%%AI_PLUGINS_ROOT%%/assets/stack-adapter.md`.
2. **Template → platforms.** A candidate declares the `platforms:` it serves, so
   the shortlist proposes the project's platform list rather than asking for it
   cold. Check it against the platforms-by-evidence rows — what the directory
   *looks like* is what settles a disagreement.
3. **Platforms → role.** The role is named by who consumes the output, per the
   consumer-domain rows. It is an index, never a gate; the platforms are what
   the rest of vwf branches on.
4. **Topology** from the repo signals — a workspace declaration, a single root
   manifest, `.gitmodules`, a `members:` list, a `.config/vwf-membership.yaml`.
   Present the matching template from [structure](workspace-structure.md) for
   confirmation; do not summarize all three.

Present each project as one proposal — role, platforms and candidate pin, each
with the evidence that produced it — and let the user correct it. Two things are
**never** assumed: a **screen platform**, because it makes the design system
mandatory, and a `packages` project's role, because the same package consumed
from two sides is a judgment call. A platform no installed plugin ships a
template for is a halt, not a free-text pin — the menu is the whole vocabulary.

### Multi-repo takes two more questions, in order

**Linkage** first — `submodule` (recommend it, and say why) or `siblings`.
Recommend, never enforce: a product whose repos already exist independently is a
legitimate `siblings` answer. **Then the members** — each one's `name`, `path`
relative to the base repo, git `url`, and which projects live in it. Under
`submodule` linkage `.gitmodules` already states all four; read them, present
them, confirm. Under `siblings` the `url` is the one fact nothing else records,
and the absent-member clone offer depends on it, so never leave it blank.

**Which members are present is detected, never asked and never recorded.** A
product with most members not on this machine is normal; note what is here and
scope every code-reading step to it.

**Adding a repo to an onboarded product is this same path** — run from inside
the new member, whose missing config resolves Step 0 to `onboard`. Base-repo
resolution reaches the product from there, and the run confirms that member's
four facts and acts on that delta alone.

### Then the writes

- **An existing `docs/blueprint/` or legacy `docs/specs/` tree** is handed to
  [the migrate pipeline](migrate-pipeline.md) once the confirmations above are
  in — same algorithm, with the decisions already carried.
- **Docs scaffold** for whatever is missing: the blueprint skeletons from
  `%%AI_PLUGINS_ROOT%%/assets/templates/`, `flows/index.md`, `entities/index.md`, the
  empty `apis/` and `apis/released/` directories, `docs/plans/` and
  `docs/plans/archived/`.
- **The graph ignore file**, per `%%AI_PLUGINS_ROOT%%/assets/graphify.md`: the
  vwf-standard excludes plus every committed-but-not-code tree detection turned
  up — vendored third-party code, committed generated output, large fixtures.
  Repo-specific additions are proposed with their evidence and confirmed;
  git-ignored trees are never restated. One file per locally-present repo in a
  `multi-repo` product.
- **Harness detection** per `%%AI_PLUGINS_ROOT%%/assets/harness.md` — which
  verification capabilities the repo can already run, and any non-canonical task
  names. Missing capabilities are **recorded, never built**;
  `/plan` injects their bootstrap when a cycle first needs
  one.
- **The environment catalog**, when the detected integrations or a
  secrets-manager `config` call for it, per
  [environment bootstrap](environment-bootstrap.md). Names only, never a value.
- **Tooling, CLAUDE.md and the memory tree** exactly as on the blank path.

### The recommendations report

Close by writing, not doing. A layout that differs from the chosen topology
template's grouping, and an `iac` project inside another project's repo, are
each recorded as a written recommendation naming the target layout from
[structure](workspace-structure.md) and the reason it is worth the work. setup
moves no source file, so nothing here is applied — the report is the
deliverable, and `/doctor` is what keeps it visible.

Return to the spine with: the confirmed topology and linkage, the members, the
per-project role/platforms/stack pins, the harness block, `product.name`,
`memory.wing`, any `enforcement:` decline recorded during the run, and the
recommendations.
