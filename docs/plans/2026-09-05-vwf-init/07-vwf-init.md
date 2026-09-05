# U7 — `/vwf:init`: the skill and its two pipelines

- **Wave:** 2
- **Depends on:** U1 (task contract, legacy-name table), U3 (hygiene pack,
  placeholders), U5 (the three fixed slugs, the fragment tier, the root
  allowlist)
- **Owns:** `plugins/vwf/skills/init/**` — `SKILL.md`, `references/new-repo.md`,
  `references/existing-repo.md`, `references/fragments-and-sections.md`,
  `references/readme-and-license.md`. Touch nothing outside this list. `setup/`,
  `readme/` and `git-workflow/` are U8's; the stackgen packs are landed and
  read-only for you.
- **Model:** inherit
- **Read first:** `.claude/skills/vwf-plugin/SKILL.md` §"Adding a skill" and the
  invocation table (lines ~102-124); `plugins/vwf/skills/setup/SKILL.md` and
  `references/onboard-pipeline.md` **as committed at wave 1's end** (the Tooling
  step you are absorbing; U8 rewrites it concurrently — read, never edit);
  `plugins/vwf/assets/stack-adapter.md` (how a vwf skill invokes
  `<plugin>-stack-template <slug>`);
  `plugins/stackgen/skills/stackgen-stack-
  template/SKILL.md` and
  `references/materializer.md` as landed by U5;
  `plugins/stackgen/stacks/toolchain-manager/mise/skills/mise/references/
  task-library.md`
  as landed by U1 (the legacy table, the `p:` rule);
  `plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md` as landed
  by U3; `.claude/skills/plugin-authoring/references/checks.md` §rule 10 (lines
  ~78, 109) — **your prose must pass it**.
- **Lazy-load:** `scripts/src/check.ts` `:614-760` (`TOOL_TOKENS`, the exception
  list, `ENUMERATION_PEERS`, the 100-char window, `prescribes()`) if a rule-10
  finding appears;
  `plugins/vwf/skills/setup/references/
  topology-detection.md` (member
  detection: submodules and registry ids).

## Ruling

D1: "`/vwf:init` is a stack-agnostic orchestrator; the mise pack, the gate
packs, the hygiene pack and the secrets packs ship every file."

D3: hygiene additions; D4: no CI workflow.

D5: "`init` is to setup the base repo, `setup` is to setup `vwf`." Setup's
Tooling step moves wholesale into init.

D6: "init is therefore user- **and** model-invocable
(`disable-model-invocation: false`)."

D7: "Survey, plan, one consent, then apply: init diffs the repo against the
shape, shows one plan (moves, creates, renames, fragment merges), applies on one
yes, never edits app code, `package.json` or CI workflows."

D10: "zsh task files on an existing repo are flagged in init's plan for rewrite,
with zsh-only syntax reported rather than auto-translated."

D12: "`.config/vwf.yaml`'s registry ids when present, else the sub-project
directory, else the repo name … Existing `p:` groups meaning something else are
renamed by init on an existing repo."

D13: member flags generated from registry ids or submodule names.

D18: "init fetches the templates for the detected stack from `github/gitignore`
at run time and appends each as its own `# ==== <Name> ====` section, never
duplicating one already present."

D20, D33: fragment merge between `# >>> pre-commit.d/<name>.yaml` /
`# <<< pre-commit.d/<name>.yaml` markers, re-runnable.

D21: "H1 repo name + one-line brief, then name /vwf:readme … An existing
`README.md` is `git mv`'d to `readme.md`, content untouched."

D28: "init creates `p/<id>/_default` as a `#PLACEHOLDER` slot per project".

D30: "init asks MIT, Apache-2.0 or none; … init copies the chosen one to
`LICENSE` with the year and holder filled."

D32: "init reads [the legacy-name table] to rename tasks on an existing repo, so
vwf prose names no tool."

D37: the root allowlist.

New dependencies: "`/vwf:init` fetches
`https://raw.githubusercontent.com/
github/gitignore/main/<Name>.gitignore` when
appending stack sections … init prints the skipped section names when offline."

## Edits

1. **`SKILL.md`** — frontmatter: `name: init`, `description:` (one strict-YAML
   line: bootstrap a new repo or reshape an existing one to the standard layout
   — every config under `.config/`, the toolchain manager's five-file split and
   task library, the repo gates, hygiene files, a secrets provider — from the
   stack adapter's three unconditional bundles; stack-agnostic),
   `disable-model-invocation: false`,
   `argument-hint: "[--new | --existing]
   [target-dir]"`. Body: purpose in two
   paragraphs; **Step 0 — mode**: `--new` / `--existing` or detect (a repo with
   no `.config/` and no task files is new; anything else is existing); the
   **hard rules** — writes only what a pack declares plus the placeholders it
   fills (`<REPO_URL>`, `<YEAR>`, `<HOLDER>`), never app code, never
   `package.json` or any manifest, never a CI workflow, never `CLAUDE.md`
   (vwf's), never a readme beyond the stub; names no technology (say "the
   toolchain pack", "the gates pack", "the hygiene pack", "the secrets provider
   pack", "the task-name contract", "the legacy-name table") — mirror setup's
   existing fixed-slug sentence verbatim in form: "fetched by the fixed slugs
   `mise`, `repo-gates` and `repo-hygiene` — fixed, never constructed"; the
   **two questions** it asks a new repo (repo name and a one-line brief — the
   brief may be empty) and the **three** it asks any repo (secrets provider: the
   default or the alternative, named by the adapter's bundle list, never in vwf
   prose; license: MIT / Apache-2.0 / none; security-contact URL, defaulting to
   the origin remote's advisories page); the pipelines by reference; the final
   report shape (files written, files moved, tasks renamed, sections appended,
   fragments merged, the `/vwf:readme` and `/vwf:setup` next-step lines).
2. **`references/new-repo.md`** — the ordered pipeline: (1) `git init` if
   needed, default branch `main`, create `develop`; (2) materialize the three
   unconditional bundles by fixed slug through the stack adapter, in the
   precedence order U5 documents, consent-gated as setup's Tooling step was
   (copy its deferral rule: a decline is a deferral, never a halt); (3) the
   secrets provider bundle by the slug the user picked from the adapter's list;
   (4) fill placeholders; (5) `.gitignore` stack sections per
   `fragments-and-sections.md` (detected stack = the language / package-manager
   packs the adapter's lockfile records, else none yet); (6) `pre-commit.d`
   merge; (7) `p/<id>/_default` per D28 for every project id (D12); (8) the
   readme stub and LICENSE per `readme-and-license.md`; (9) the editor pointer
   file for the formatter config (the setting name the dprint pack's conventions
   quote); (10) `mise run init` (the chmod task) then `mise
   trust`; (11)
   offer `mise run setup:all`; (12) the report, then the two next-step lines.
3. **`references/existing-repo.md`** — **survey**: root files against the
   allowlist (D37) → moves into `.config/` with the rename map
   (`.pre-commit-
   config.yaml` → `.config/pre-commit-config.yaml`,
   `dprint.json` → `.config/dprint.json`, and every other tool config the packs
   ship — derive the map from the packs' `config/` trees, never hardcode names
   in this file); `README.md` → `readme.md`; task files under
   `.config/mise/
   tasks/`: names against the legacy table (D32), shebangs
   (zsh → flag), the helper file name (D8: `_helpers` → `helpers`, and the
   `source` lines that name it), `p:` groups whose segment is not a project id
   (D12 → flag with the proposed rename); missing files from the three bundles;
   missing `pre-commit.d` fragments for landed packs; gitignore sections
   missing; git-conventional-commits types outside the ten (D19 → mapped:
   `chore`, `build`, `ci`, `deps`, `config`, `release` → `ops`; `style` →
   `refactor`; `spec`, `blueprint` → `docs`; `add` → `feat`). **Plan**: one
   document printed in sections (moves / creates / renames / rewrites-flagged /
   appends / merges), each line `old → new` or `+ path`, with a count line.
   **Consent**: one question — apply all, or stop. **Apply**: `git mv` for moves
   and the readme; the materializer with re-sync for files a landed pack already
   owns (through the adapter's sync skill, so the user sees the diff); sed-free
   rewrites of `--config` paths inside task files and the pre-commit config
   using Edit (BSD sed trap); the fragment merge; the gitignore append; never
   touch a file outside the survey's list. **Report** as in new-repo. State the
   invariant: running init twice on a shaped repo produces an empty plan.
4. **`references/fragments-and-sections.md`** — the gitignore append algorithm
   (fetch by template name from the github/gitignore raw URL; map the pack name
   to the template name via a small table living in the hygiene pack's
   conventions, not here; skip with a printed note when offline or 404; banner
   `# ==== <Name> ====`; idempotent by banner); the pre-commit merge algorithm
   (D20, D33: collect `.config/pre-commit.d/*.yaml` sorted by name, for each
   replace or append the marker-delimited block under `repos:`, preserve
   everything outside markers byte-for-byte, then
   `pre-commit
   validate-config -c`).
5. **`references/readme-and-license.md`** — D21 stub (`# <name>` + brief), D30
   license copy with `<YEAR>`/`<HOLDER>` from `git config user.name` and the
   current year, `SECURITY.md` `<REPO_URL>` from the origin remote,
   `.gitattributes`/`.editorconfig` copied as-is, Renovate config as-is.

## Verification

- `mise run plugins:check` green with **zero** findings under
  `plugins/vwf/skills/init/` — rule 4 (strict YAML) and rule 10 (technology-
  free) especially. Iterate on wording until rule 10 is silent; do not add an
  exception to `check.ts`.
- `grep -rn -i 'mise\|dprint\|doppler\|fnox\|gitleaks\|grype\|pnpm\|renovate' plugins/vwf/skills/init/`
  returns only the fixed-slug enumeration lines (`mise`, `repo-gates`,
  `repo-hygiene` together) — report every other hit as a rule-10 risk you
  removed.
- Every `${CLAUDE_PLUGIN_ROOT}/…` reference resolves inside `plugins/vwf/` (rule
  6).
- Every `it.cmd()`-style skill invocation names a skill that exists and is
  model-invocable (`stackgen-stack-template`, `stackgen-sync`, `readme`, `setup`
  is **not** invocable — never call it; name it in prose only).

## Guardrails

- Do not edit `setup/`, `readme/`, `git-workflow/` (U8) or any stackgen file.
- `plugins/**/*.md` is not dprint-formatted; match fold width by hand.
- Strict-YAML frontmatter: no unquoted colon-space inside the description.
- Write with Write/Edit; `cat` is `bat`.
- No maintainer repo names, no absolute paths.

## Commit

`feat(vwf): /vwf:init bootstraps a new repo or reshapes an existing one from the three unconditional bundles`
— written by the orchestrator after the wave gate, not by the unit.
