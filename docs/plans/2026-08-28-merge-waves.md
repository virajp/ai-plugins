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
- **Wave D — retirement, conditional.** Deletion still gated on the
  [no-skill-lost](../memory/decisions/2026-08-27-no-skill-lost-in-the-merge-waves.md)
  rule, with the before/after inventory counted against **53**, not 58. The
  marketplace shrinks to **two** entries. Wave D now also owes the three
  amendments under *What the decision costs* — the install-script kind, the
  `.mcp.json` reopening, and the guard surviving the design move — since each is
  a precondition for something Wave D deletes.

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
