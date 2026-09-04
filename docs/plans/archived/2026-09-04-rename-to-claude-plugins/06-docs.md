# U6 — Docs reconciled, the reversal recorded

- **Wave:** 2
- **Depends on:** U1, U2, U3, U4, U5
- **Owns:** `readme.md`, `CLAUDE.md`, `installer/CLAUDE.md`, `docs/**`
  **except** `docs/memory/**` and `docs/plans/**`, `.claude/docs/**`,
  `.claude/skills/**`, `.claude/agents/**`, and the new
  `docs/memory/decisions/2026-09-04-installer-command-follows-the-package.md`
- **Model:** inherit
- **Read first:** the `docs-reconciler` findings the orchestrator passes in,
  every `DOCS FALSIFIED:` line from wave 1, then each file below before editing
  it.
- **Lazy-load:**
  `docs/memory/decisions/2026-08-29-devtools-survives-the-waves.md` (a recent
  decisions doc, for the format to mirror)

## Ruling

Quoted from index.md:

> Reversal, named as one. The installer doctrine (`installer/CLAUDE.md`,
> `.claude/docs/installer/packaging.md`, `docs/installer/internals.md`,
> `tsup.config.ts`'s comment, and the archived plan
> `docs/plans/archived/02-rename-installer.md`) says *the artifact is
> `installer.mjs`; the command is `ai-plugins`; the bin key is never renamed
> because it is what users invoke and what the Trusted Publisher is bound to*.
> That decision is overturned: the bin key becomes `claude-plugins` because the
> package and repo are renamed and a command that matches neither is worse than
> a one-time command change. The Trusted-Publisher half of the rationale was
> also wrong — npm binds the publisher to the **package name**, not the bin key.

> 2 — Marketplace name: `virajp-plugins` stays. 14 — On-disk names: Receipts
> dir, payload path, mempalace state dir and wing all stay. 6 — Stub publish
> path: Manual `npm publish` by the user from `sunset/`, after the new package's
> first release is live, plus `npm deprecate`.

New identities: npm package `@virajp.dev/claude-plugins`, command
`claude-plugins`, GitHub repo `virajp/claude-plugins`. The old package
`@askviraj/ai-plugins` is sunset, not removed.

## Edits

Under `CLAUDE.md`'s rule *docs ship with the change*, reconcile exactly what the
diff falsified — every passage that names the old package, the old command, or
the old repo path — and nothing else. The survey's list, to be merged with the
reconciler's findings:

1. **`readme.md`** — package name and `pnpx` lines (~35, ~86, ~112, ~268, ~291,
   ~301, ~319-328), repo paths (~94, ~156, ~167). Add one short passage near the
   install section saying `@askviraj/ai-plugins` is sunset and only prints a
   pointer. Leave `virajp-plugins`, `@askviraj/linter` (~141) and
   `claude-status` (~273) lines alone.
2. **`CLAUDE.md`** — ~16, ~181, ~206, ~245-249: package name, `pnpx` lines, the
   `claude plugin marketplace add` path. Mention `sunset/` in *One authored
   tree* in one line (a standalone package, never built, published by hand
   once). Do not widen tables beyond what dprint re-pads.
3. **`installer/CLAUDE.md`** — title (~1), invocation (~11), marketplace path
   (~16), and the *artifact vs command* passage (~44-47) rewritten to the new
   doctrine: artifact `installer.mjs`, command `claude-plugins`, Trusted
   Publisher bound to the package name. `CLAUDE_PLUGINS_SOURCE_DIR` where the
   old env var appears.
4. **`docs/installer/index.md`**, **`usage.md`**, **`targets.md`**,
   **`internals.md`** — every package, command and repo-path mention the survey
   listed (`index.md` ~3, ~8, ~15, ~85; `usage.md` ~3-19, ~56, ~186, ~189, ~203,
   ~231; `targets.md` ~10, ~25, ~104; `internals.md` ~87, ~90-93). In
   `index.md`, one sentence on the sunset of the old package.
5. **`docs/plugins/vwf.md`** (~19, ~29),
   **`docs/plugins/karpathy-guidelines.md`** (~72),
   **`docs/how-to/greenfield/single-repo.md`** (~25) — repo path and package
   name only.
6. **`docs/plugins/stackgen.md`** — if it describes the `setup/ai` pack task,
   say it now lists marketplace source and name pairs.
7. **`.claude/docs/ci-and-releases.md`** — ~26 (the marketplace add path), ~85
   (tag → package table), ~121, ~167 (the Trusted Publisher setup names the new
   package **and** notes the first publish is manual because npm cannot bind a
   publisher to a package that does not exist). Add the sunset publish and
   `npm deprecate` as a one-time manual step in the release section.
8. **`.claude/docs/plugins.md`** (~76 worked example URL),
   **`.claude/docs/dev-marketplace.md`** (~86 the `or: virajp/…` comment),
   **`.claude/docs/installer/packaging.md`** (~10-14 the bin-key rationale
   rewritten as above; ~43-49 `CLAUDE_PLUGINS_SOURCE_DIR`; ~79, ~86),
   **`.claude/skills/release/SKILL.md`** (~140 commit URL),
   **`.claude/agents/target-verifier.md`** (package or command name if any; the
   `ai-plugins/receipts` dir at ~136, ~149, ~226 **stays**).
9. **`.claude/skills/stackgen-plugin/**`** and
   **`.claude/skills/vwf-plugin/**`** — only if the reconciler or a
   `DOCS FALSIFIED:` line names a passage.
10. **New:
    `docs/memory/decisions/2026-09-04-installer-command-follows-the-package.md`**
    — the reversal, in the repo's decisions-doc format: what was decided before
    and where, what changed and why, what stayed (marketplace name, on-disk
    names), the sunset mechanism, and the manual first-publish fact. Add the
    `Mirrors the mempalace drawer (wing ai-plugins, room decisions)` header line
    the sibling docs carry, verbatim in shape.

## Verification

- The rename grep from index.md's *Gates the orchestrator keeps*, scoped to the
  owned paths, returns only passages that deliberately name the old package as
  sunset and the on-disk names.
- This returns nothing:

  ```sh
  grep -rn 'the command is `ai-plugins`' . --exclude-dir=node_modules --exclude-dir=archived --exclude-dir=memory
  ```
- `pnpm exec dprint check` — `CLAUDE.md`, `installer/CLAUDE.md` and `readme.md`
  are formatted.
- Every `DOCS FALSIFIED:` line from wave 1 is either applied or answered in the
  return block with why not.

## Guardrails

- Do not edit `docs/memory/**` (other than the one new file) or `docs/plans/**`
  — historical records.
- Do not touch code, `package.json` files, `plugins/**` manifests or generated
  files.
- `plugins/**/*.md` is not dprint-formatted; `CLAUDE.md`, `installer/CLAUDE.md`
  and `readme.md` are — widening a table cell re-pads every row, so keep new
  cells within the existing width where possible.
- Do not rewrite passages the change did not falsify.

## Commit

`docs: name the claude-plugins repo and package, record the command reversal` —
written by the orchestrator after the wave gate, not by the unit.
