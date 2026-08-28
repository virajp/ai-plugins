# Plan: the merge waves, re-derived from stackgen's charter

**Status: draft, 2026-08-28. Not approved. Nothing moves.** This supersedes
Phase 5 of [2026-08-19-stackgen.md](./2026-08-19-stackgen.md), whose Wave A does
not survive the charter that plan's own post-execution revision produced.

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

## The residue, which is the real finding

Six skills and five machinery items share one property: **they are
plugin-manifest features or live delegation seams, and no repo file can express
them.** They are what the two-plugin north star has no room for.

| Item                                                             | Why it resists                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 LSP declarations (`typescript`, `dart`, `kotlin`, `sourcekit`) | A language server is declared in a plugin manifest. Charter excludes it; `language_facts` only tells `/vwf:doctor` what to *check*, never provides the server |
| the `claude-design` HTTP MCP server                              | Same: manifest-only                                                                                                                                           |
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

### One residue item has a clean answer

**The `-ux-gate` seam dissolves if stackgen materializes it.** The gate is
stack-specific (Flutter golden tests + `meetsGuideline`; Playwright + axe), and
the stack is known at materialization time — so the pack lands a repo-owned
`ux-gate` skill and vwf invokes a **fixed** name in the repo's own `.claude/`
instead of constructing one. That removes the name-construction contract rather
than rehoming it, and it passes the charter.

The design seam cannot take the same route: the tool is per-project config and
would materialize fine, but the **MCP server underneath it is manifest-only**.

## The decision this plan is blocked on

**The two-plugin north star does not close.** After every pack lands and every
doctrine skill materializes, a residue remains that only a plugin manifest can
hold: four language servers, one MCP server, and the design-import seam that
depends on it. Three ways out, and this plan does not pick one:

1. **vwf absorbs it.** Precedent exists — vwf already absorbed context7's MCP
   server on the grounds it was useful only alongside vwf. The cost is the
   coupling both contracts exist to prevent: vwf would ship four language
   servers and three design-tool references, and `design-tools`' pointed absence
   from vwf's dependencies becomes meaningless.
2. **A third plugin survives** holding the manifest layer — the north star
   becomes vwf + stackgen + adapters. Honest about what a manifest can do that a
   repo file cannot, at the cost of the two-plugin goal.
3. **Drop the surfaces.** Language servers become the user's own config; design
   import retires to export-only, which
   [`design-adapter.md`](../../plugins/vwf/assets/design-adapter.md) notes has
   always been adapter-free. Smallest surface, real capability loss.

## Re-derived waves, once that is answered

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
  rule, with the before/after inventory counted against **53**, not 58. Wave D
  cannot start until the residue decision above is executed, because that is
  what decides whether the marketplace shrinks to two entries or three.

## Verification

Unchanged per wave: `plugins:marketplace --check`, `plugins:check`,
`vitest run`, `typescript:test`, `dprint check`. Two additions this plan owes:

- The **LSP-inertness claim** is unverified. The old Wave A assumed a merged
  registry stays inert until matching files exist; nothing in this repo
  documents that. If it is wrong, every install starts four language servers in
  every repo. Prove it against the real CLI before any LSP move — it is
  `target-verifier`'s job.
- The **skill census** — 53 in, 53 accounted for — runs at every wave boundary,
  not only at Wave D.
