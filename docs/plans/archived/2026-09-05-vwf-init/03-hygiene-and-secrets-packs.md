# U3 — The repo-hygiene pack, and the doppler and fnox config trees

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/repo-hygiene/**` (new),
  `plugins/stackgen/stacks/capability-provider/{doppler,fnox}/**`. Touch nothing
  outside this list. The bundle files and the taxonomy are U5's; the mise pack
  is U1's.
- **Model:** inherit
- **Read first:** `capability-provider/doppler/**` and `fnox/**` top to bottom;
  `plugins/stackgen/assets/pack-format.md` §Layout and §`pack.yaml`;
  `plugins/stackgen/assets/output-tree.md` §"The fourth target";
  `plugins/stackgen/assets/contracts/secrets.md`.
- **Lazy-load:** read-only specimens —
  `~/Projects/github.com/95octane/95octane/.gitignore` (section banners and
  why-comments), `~/Projects/github.com/virajp/virajp.dev/.gitignore` (the mise
  local patterns),
  `~/Projects/github.com/virajp/claude-status/
  .gitattributes`,
  `~/Projects/github.com/95octane/95octane/.config/mise/
  tasks/setup/doppler`.

## Ruling

D1 (reversal 1): doppler and fnox packs gain `config/` trees.

D3: "`.editorconfig` + `.gitattributes`; … `LICENSE` + `SECURITY.md` asked per
repo; Renovate config at `.config/renovate.json`."

D16: "Doppler default: `DOPPLER_PROJECT` and `DOPPLER_CONFIG = "local"` in the
environment, one Doppler project per repo, one config `local`, key names
`<REPO>_<KEY>` with `GLB_<KEY>` for shared values, documented in the doppler
pack's conventions and as a comment block beside the env keys. fnox alternative:
'Root fnox.toml, accepted exception', keychain provider with
`prefix = "global/"`, `fnox.local.toml` gitignored."

D18: "the pack ships the sectioned base (macOS, AI tooling, mise local files,
env and secret files, worktrees, scratchpad); init fetches the templates for the
detected stack from `github/gitignore` at run time and appends each as its own
`# ==== <Name> ====` section".

D26: "Doppler project name defaults to the repo directory's basename
(`basename "$MISE_PROJECT_ROOT"`), overridable by `DOPPLER_PROJECT` in
`mise.local.toml`."

D27: "The secrets packs ship `.config/mise/conf.d/<provider>.toml` (mise
auto-loads `conf.d/*.toml`), carrying `[env]` defaults … and nothing else, so
`mise.toml` stays provider-free."

D29: "New component kind `repo-hygiene` … one pack
`stacks/repo-hygiene/
repo-hygiene/`, one unconditional bundle … fetched by the
fixed slug `repo-hygiene`. Bar in `kinds.md`: ignore set, editor and attribute
defaults, licensing and security contact, dependency updates."

D30: "init asks MIT, Apache-2.0 or none; the hygiene pack ships both texts under
`config/_licenses/{MIT,Apache-2.0}.txt` (outside the copied tree; init copies
the chosen one to `LICENSE` with the year and holder filled)."

D37: the fixed root exceptions list, quoted in full in index.md.

Index facts: Doppler honours `DOPPLER_PROJECT`/`DOPPLER_CONFIG` from the
environment and `doppler setup --no-interactive --project X --config Y --scope

<dir>` needs no repo file; fnox's keychain provider shape; `fnox.local.toml` is
the gitignored override; Renovate has a mise manager.

## Edits

1. **`stacks/repo-hygiene/repo-hygiene/pack.yaml`** — `name: repo-hygiene`,
   `version: 1.0.0`, `type: repo-hygiene`, `kind: repo-hygiene`, `axis: repo`,
   `harness: n/a`, a summary; comment that U5's `kinds.md` bar is the four
   topics in D29.
2. **`stacks/repo-hygiene/repo-hygiene/config/.gitignore`** — banner sections in
   this order, each entry with a one-line why where non-obvious: `macOS`,
   `Editors` (`.idea/`, `*.swp`; **not** `.vscode/` — a committed
   `.vscode/settings.json` carries the dprint pointer), `AI tooling`
   (`.claude/settings.local.json`, `.claude/worktrees/`, `.claude/cache/`,
   `.claude/todos.json`, `.worktrees/`, `.opencode/`), `mise`
   (`mise.local.toml`, `.mise.local.toml`, `.config/mise.local.toml`,
   `.config/mise.*.local.toml`, `.config/mise/config.*.local.toml`,
   `mise.local.lock`), `Secrets and env` (`.env`, `.env.*`, `!.env.example`,
   `fnox.local.toml`, `*.pem`, `*.key`, `*.p12`), `Scratch`
   (`docs/scratchpad/`), `Reports` (`gitleaks-report.*`, `sbom.*`,
   `grype-report.*`). End with a comment: "stack sections below this line are
   appended by `/vwf:init` from github/gitignore, one `# ==== <Name>
   ====`
   banner each".
3. **`config/.editorconfig`** — `root = true`; `[*]` utf-8, lf, final newline,
   trim trailing whitespace, 2-space indent; `[*.md]` no trailing-whitespace
   trim; `[Makefile]` tabs; `[*.{py,dart}]` 4 spaces.
4. **`config/.gitattributes`** — `* text=auto eol=lf`;
   `*.lock linguist-
   generated`, `pnpm-lock.yaml linguist-generated`,
   `mise.lock
   linguist-generated`; `graphify-out/graph.json merge=graphify`
   with a comment that the driver is registered by the graph tooling; binary
   patterns (`*.png`, `*.woff2`, …) `-text -diff`.
5. **`config/.config/renovate.json`** — `$schema`,
   `extends:
   ["config:recommended"]`, the mise manager enabled, pre-commit
   manager enabled, `lockFileMaintenance` weekly, a
   `minimumReleaseAge: "10 hours"` line mirroring the mise setting, grouped
   minor/patch updates.
6. **`config/SECURITY.md`** — two paragraphs: report privately via GitHub
   security advisories at `<REPO_URL>/security/advisories/new`; supported
   versions = the latest release. Placeholders init fills are spelled
   `<REPO_URL>` and nothing else.
7. **`config/_licenses/MIT.txt`**, **`config/_licenses/Apache-2.0.txt`** —
   verbatim texts with `<YEAR>` and `<HOLDER>` placeholders. Document in
   `conventions.md` that `_licenses/` is **not** copied into the repo; init
   picks one.
8. **`stacks/repo-hygiene/repo-hygiene/conventions.md`** — what the pack writes,
   the root-file allowlist (D37) as the doctrine, the gitignore section rule,
   the placeholder vocabulary (`<REPO_URL>`, `<YEAR>`, `<HOLDER>`), and the
   sentence that this bundle is unconditional and fetched by the fixed slug
   `repo-hygiene`.
9. **`stacks/repo-hygiene/repo-hygiene/skills/repo-hygiene/SKILL.md`** —
   `user-invocable: false`, `paths:` `.gitignore`, `.editorconfig`,
   `.gitattributes`, `SECURITY.md`, `.config/renovate.json`; short doctrine for
   editing those files (keep sections, keep why-comments, never remove the mise
   local patterns).
10. **`capability-provider/doppler/config/.config/mise/conf.d/doppler.toml`** —
    `[tools] doppler = { version = "latest" }`;
    `[env] DOPPLER_CONFIG =
    "local"`,
    `DOPPLER_PROJECT = "{{ exec(command='basename \"$MISE_PROJECT_
    ROOT\"') }}"`
    (verify the template syntax against the mise docs; fall back to a documented
    literal placeholder if `exec` cannot see `MISE_PROJECT_ROOT`); a comment
    block stating D16's naming convention (`<REPO>_<KEY>`, `GLB_<KEY>`), that
    one Doppler project per repo holds every sub-project's keys, and that
    `mise.local.toml` overrides the project name.
11. **`capability-provider/doppler/config/.config/mise/tasks/setup/secrets`** —
    overlays the mise pack's slot: `print_header`, `doppler --version`, skip
    with `print_warn` when `doppler me` fails (not logged in) — exit 0, then
    `doppler setup --no-interactive --no-read-env --project "$DOPPLER_PROJECT"
    --config "$DOPPLER_CONFIG" --scope "$MISE_PROJECT_ROOT"`;
    `print_success`. Bash, `#USAGE`-free, sources `helpers`.
12. **`capability-provider/fnox/config/fnox.toml`** —
    `[providers] keychain =
    { type = "keychain", service = "fnox", prefix = "global/" }`,
    an empty `[secrets]` with a commented example
    (`GLB_EXAMPLE = { provider =
    "keychain", value = "example", description = "…" }`),
    `if_missing =
    "warn"`. **`config/.config/mise/conf.d/fnox.toml`** —
    `[tools] fnox =
    { version = "latest" }` and a comment that activation is
    `fnox activate` or `fnox exec --`, not a mise directive.
    **`config/.config/mise/tasks/
    setup/secrets`** — overlay: verify
    `fnox --version`, `fnox get GLB_EXAMPLE
    --if-missing warn` style smoke,
    print the keychain prefix; exit 0.
13. **doppler and fnox `conventions.md`, `skills/*/SKILL.md`, `pack.yaml`** —
    "What this pack writes" sections; `version: 1.0.0`; the naming convention
    (D16) in both; fnox's root-file exception stated with the reason (cwd-
    upward discovery only).

## Verification

- `mise run plugins:check` green (rule 11 exec bits on the two `setup/secrets`
  overlays; strict-YAML frontmatter on the new skill).
- `shellcheck -x` clean on both overlays.
- `taplo check` on every shipped `.toml`;
  `python3 -c 'import json;
  json.load(open(...))'` on `renovate.json`.
- `git check-ignore -q --no-index` against a scratch copy of the gitignore
  confirms `.config/mise.local.toml`, `.env`, `fnox.local.toml` are ignored and
  `.env.example` is not.
- No maintainer repo names in shipped files.

## Guardrails

- Do not create `stacks/bundles/repo-hygiene.md` or edit `taxonomy.md` /
  `kinds.md` — U5 does, using the kind name `repo-hygiene` exactly.
- Do not edit the mise pack's `setup/secrets` slot (U1); overlay it from the
  provider packs only.
- Write with Write/Edit; `cat` is `bat`.
- `plugins/**/*.md` is not dprint-formatted; match fold width by hand.

## Commit

`feat(stackgen): repo-hygiene pack, and doppler and fnox ship their env and setup:secrets overlays`
— written by the orchestrator after the wave gate, not by the unit.
