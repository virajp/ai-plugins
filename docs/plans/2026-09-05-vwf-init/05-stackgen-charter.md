# U5 — The charter reopens, the hygiene kind and bundle, the adapter skills

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/assets/**` (`taxonomy.md`, `kinds.md`,
  `output-tree.md`, `pack-format.md`, `artifact-doctrine.md`, `contracts/**`),
  `plugins/stackgen/skills/stackgen-stack-template/**`,
  `plugins/stackgen/skills/stackgen-stack-menu/**`,
  `plugins/stackgen/skills/stackgen-sync/**`,
  `plugins/stackgen/stacks/bundles/**`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `output-tree.md` §"The fourth target" and §"The three consent
  tiers"; `pack-format.md` §Layout, §Rules; `taxonomy.md` lines 15-95;
  `kinds.md` §`repo-gate` and §`toolchain-manager`;
  `stackgen-stack-template/SKILL.md` and `references/materializer.md` §"The
  fence"; `stackgen-stack-menu/SKILL.md` lines 20-40 and 85-95;
  `stackgen-sync/SKILL.md`; `stacks/bundles/{mise,repo-gates,doppler,fnox}.md`.
- **Lazy-load:** `docs/plans/archived/2026-09-01-devtools-dissolution.md` §C,
  §D, §J, §K (the fence's origin, for the wording of its reopening).

## Ruling

D1 (reversal 1): "The charter fence opens for gate config files … Now the
dprint, pre-commit, gitleaks, grype, doppler and fnox packs ship `config/`
trees. `package.json` and CI workflows stay fenced."

D6: setup detects the shape via "the stack adapter's lockfile lists all three
unconditional slugs".

D20, D33: fragments under `.config/pre-commit.d/`, merged by init between
markers.

D27: `.config/mise/conf.d/<provider>.toml` is a tier a provider pack contributes
to.

D29: "New component kind `repo-hygiene` (fourth `repo`-axis kind beside
`repo-gate`, `toolchain-manager`, `workspace`), one pack
`stacks/repo-hygiene/repo-hygiene/`, one unconditional bundle
`stacks/bundles/repo-hygiene.md`, fetched by the fixed slug `repo-hygiene`. Bar
in `kinds.md`: ignore set, editor and attribute defaults, licensing and security
contact, dependency updates."

D36: "`pack-format.md` documents the `config/`, `conf.d` and `pre-commit.d`
tiers so a generated pack *may* ship them; teaching `generator.md` to emit them
is parked."

D37: the fixed root exceptions, quoted in full in index.md.

## Edits

1. **`assets/output-tree.md`** — rewrite §"The fourth target — repo config
   files" (line ~101-152): the tier now covers (a) the mise config split and
   task library, (b) gate config files
   (`.config/{dprint.json,taplo.toml,
   pre-commit-config.yaml,git-conventional-commits.yaml,gitleaks.toml,
   grype.yaml}`),
   (c) hygiene files at the root allowlist (D37) and `.config/renovate.json`,
   (d) provider fragments `.config/mise/conf.d/*.toml`, (e) hook fragments
   `.config/pre-commit.d/*.yaml` that the materializer copies verbatim and
   **`/vwf:init` merges** — the materializer never edits
   `pre-commit-config.yaml`. Replace the fence paragraph with: the fence was
   opened on 2026-09-05 for gate and provider config files; what stays outside
   it is `package.json` and every language manifest, CI workflows, editor
   settings other than the dprint pointer, and `CLAUDE.md` (vwf's). Keep the
   "charters ratchet" warning and restate it against these four. Precedence
   stays toolchain-manager → repo-gate → repo-hygiene → package-manager /
   language → app-framework → capability-provider; later wins; per-file in the
   lockfile. Note that init runs with the lockfile as its shape detector: all
   three unconditional slugs (`mise`, `repo-gates`, `repo-hygiene`) present =
   shaped.
2. **`assets/pack-format.md`** — §Layout gains `config/` sub-conventions:
   `config/.config/…` copied to the repo root; `config/_licenses/` and any
   `config/_*` directory is **not** copied (a pack-private payload init reads);
   `conf.d` and `pre-commit.d` fragment naming `<pack-name>.<ext>`. §Rules:
   update the rule at `:47-53`; a generated pack may ship these tiers.
3. **`assets/taxonomy.md`** — add `repo-hygiene` at the `repo` axis with a
   one-line definition; note its capability seam is none.
4. **`assets/kinds.md`** — add
   `## repo-hygiene — the files every repo carries
   regardless of stack` with
   the four-topic bar (D29), the once-per-repo rule, the seam sentences with
   `repo-gate` (gates scan; hygiene declares what is ignored) and
   `toolchain-manager` (mise local patterns are hygiene's to ignore, mise's to
   document). Update the `repo-gate` and `toolchain-manager` sections' "what
   this kind writes" to name their new config files.
5. **`stacks/bundles/repo-hygiene.md`** — new, mirroring `mise.md`'s form:
   `name: repo-hygiene`, `axis: repo`, `kind: repo-hygiene`,
   `unconditional:
   true`, `components: [repo-hygiene/repo-hygiene@1.0.0]`,
   prose on why it is unconditional and fetched by fixed slug. **`mise.md`** and
   **`repo-gates.md`**: component versions `@1.0.0`; the prose sentence about
   "what the task library is" gains the five-file split and the three groups;
   `repo-gates.md` gains "each gate now ships its config file" and names
   `repo-hygiene` as the third unconditional bundle. **`doppler.md`**,
   **`fnox.md`**: mention the `conf.d` and `setup:secrets` overlay they ship.
6. **`skills/stackgen-stack-menu/SKILL.md`** — the fixed-slug sentence lists
   three slugs (`mise`, `repo-gates`, `repo-hygiene`) and says `/vwf:init`
   fetches them (not `/vwf:setup`).
7. **`skills/stackgen-stack-template/SKILL.md`** and
   **`references/materializer.md`** — the fence paragraphs rewritten to match
   edit 1; the copy rule for `config/_*` (skip); fragment tiers are copied
   verbatim and left for init to merge; the lockfile records
   `pre-commit.d/*.yaml` like any file; add the D37 root allowlist as the
   materializer's own assertion (refuse to land a file at the root that is not
   on it; report it).
8. **`skills/stackgen-sync/SKILL.md`** — the re-sync diff covers config-tier
   files, with the note that a merged `pre-commit-config.yaml` is compared
   **outside** the `# >>>`/`# <<<` markers only (the fragments inside are
   re-merged by init, not diffed by sync).
9. **`assets/contracts/secrets.md`** — the naming convention `<REPO>_<KEY>` /
   `GLB_<KEY>` as the neutral contract line (provider-free wording).

## Verification

- `mise run plugins:check` green — rule 12 (retired vocabulary) will flag the
  lines that name the old fence or old task names; carry the exemption marker on
  those exact lines per `checks.md:169-175`.
- `grep -rn 'unconditional' stacks/bundles/` finds exactly three files.
- `grep -n 'repo-hygiene' assets/taxonomy.md assets/kinds.md` finds both.
- `grep -rn '/vwf:setup' skills/stackgen-stack-menu/SKILL.md` finds no remaining
  claim that setup fetches the slugs.

## Guardrails

- Do not create or edit any pack under `stacks/*/*/` (U1–U4 own them).
- `plugins/**/*.md` is not dprint-formatted; match fold width by hand.
- Do not rename the bundle `kind: repo-gate` used by the gate packs'
  `pack.yaml`.
- Write with Write/Edit; `cat` is `bat`.

## Commit

`feat(stackgen): open the charter for gate and provider config, add the repo-hygiene kind and bundle`
— written by the orchestrator after the wave gate, not by the unit.
