# mise plugin

The `mise` plugin teaches Claude Code an opinionated
[mise](https://mise.jdx.dev) standard: the `.config/` three-file `MISE_ENV`
split (`mise.toml` / `mise.dev.toml` / `mise.ci.toml`), a mandatory file-based
task library (quality gates and bootstrap tasks under `.config/mise/tasks/`),
and a `/mise:scaffold` command that lays both into a repo. The bundled `mise`
skill auto-applies whenever you edit mise config or a task file — its `paths`
match `**/mise.toml`, `**/mise.dev.toml`, `**/mise.ci.toml`, the same three
under `**/.config/`, and any file under `**/.config/mise/tasks/**`.

## Install

```bash
pnpx @askviraj/ai-plugins --plugin mise
```

## The three-file split

mise config lives under `.config/`, where mise resolves `MISE_ENV` variants. A
repo built or deployed through CI/CD splits its config across three files. mise
loads `mise.toml` first, then deep-merges the active `MISE_ENV` variant on top,
so each variant holds only deltas — never a copy of the base. Never duplicate a
tool or setting across files; put it in the lowest layer that needs it.

| File            | Loads when         | Holds                                                                         |
| --------------- | ------------------ | ----------------------------------------------------------------------------- |
| `mise.toml`     | always (every env) | shared `[settings]`, runtime `[tools]`, common `[env]`, `[tasks.init]`        |
| `mise.dev.toml` | `MISE_ENV=dev`     | dev-only tooling, shell aliases, local/dev env values                         |
| `mise.ci.toml`  | `MISE_ENV=ci`      | CI/production-only settings + tools, the node-gpg workaround, prod env values |

Selecting the environment:

- **Developers** export `MISE_ENV=dev` in their shell, so the dev toolchain and
  local env values load automatically.
- **CI/CD pipelines and production runtimes** set `MISE_ENV=ci`, so the CI/prod
  overrides apply.
- With `MISE_ENV` unset, only `mise.toml` loads — the minimal, portable base.

A repo with no CI/CD and no deploy target needs only `mise.toml`. Add the
variants when a pipeline or deployed environment appears.

`mise.toml` carries the language **runtime only** in `[tools]`. Formatters,
linters, security scanners, and other dev tooling belong in `mise.dev.toml`, so
a fresh checkout or a CI build does not pull them. `[tasks.init]` is the
exception that lives in the base: file-based tasks must be executable under
`MISE_ENV=ci` too.

`mise.dev.toml` holds the **local values** of runtime env vars (verbose logging,
local hosts, test credentials). `mise.ci.toml` carries the **production values**
of those same keys. Dev and prod differ only in value, not in variable name.

### CI node-gpg workaround

For any **Node** project, `mise.ci.toml` must set:

```toml
[settings]
node.gpg_verify = false
```

CI runs on Linux, where mise's bundled Node release-key gpg import can fail with
"no valid OpenPGP data found". This disables **only** Node's signature check —
the tarball is still SHA256-verified. Keep the general `gpg_verify = true` in
`mise.toml` intact.

## The task library

Once tasks grow past one-liners, drive everything through executable task files
under `.config/mise/tasks/`. mise turns nested directories into colon-separated
names: `.config/mise/tasks/code/format` becomes `mise run code:format`. List
them with `mise tasks`. Reserve `[tasks.*]` toml entries for trivial run-strings
and `depends` aggregations.

Every repo ships the same mandatory set. The contract — helpers,
`#MISE`/`#USAGE` headers, flags — is identical across stacks; only the commands
inside `code/*` and `setup/*` change with the tech stack.

- **`code/*` — quality gates.** `code/format`, `code/lint`, `code/sec` (grype +
  gitleaks), `code/precommit`, `code/git-config`, and the `code/all` aggregator
  (`format` → `lint` → `sec`). `code:all` is the one-command gate; `precommit`
  and `git-config` are wired into the pre-commit hooks and `setup`, not into
  `code:all`.
- **`setup/*` — bootstrap & upgrade.** `setup:all` is the entrypoint — run it on
  clone and to re-sync. It directly invokes every setup sub-task (`setup:mise`,
  the stack's install steps, `setup:precommit`) and stays idempotent. `--clean`
  wipes deps and caches first.
- **`_scripts/_helpers`.** The `_scripts/` directory is underscore-prefixed, so
  mise treats it as **not a task**. It holds the shared shell library (colors
  plus `print_header` / `print_warn` / `print_error` / `line_sep`) that every
  task sources as its first real line for uniform output.
- **`[tasks.init]`.** A toml task in `mise.toml` that chmods every file under
  `.config/mise/tasks/` executable. It lives in the base so tasks run in every
  env, CI included; `setup:all` and others declare `#MISE depends=["init"]`.

The `mise` skill carries the full detail — task-file anatomy, the `--fix` /
`--debug` / `--clean` flag conventions, and the per-stack command tables.

## /mise:scaffold

`/mise:scaffold [target-dir]` lays the whole standard into a repo. It defaults
to the current repo root; pass a directory to scaffold into `<dir>/.config/`.
The command:

1. **Detects the stack** — `package.json`/`pnpm-lock.yaml` (Node),
   `pyproject.toml`/`uv.lock` (Python), `pubspec.yaml` (Flutter) — and detected
   tool configs (`dprint.json`, `.pre-commit-config.yaml`, and so on).
2. **Confirms** what it cannot infer in one batched round: whether the repo is
   built/deployed through CI/CD, and which runtime env vars differ between local
   and production.
3. **Writes the config files** per the three-file split, including the Node gpg
   workaround when the runtime is Node.
4. **Copies the shipped task templates** rather than hand-writing them.

The templates live as a **common base plus one stack overlay**. `common/` is
identical everywhere — `_scripts/_helpers`, the `code/*` quality gates,
`setup/mise`, and `setup/precommit`. The `node/`, `flutter/`, or `python/`
overlay supplies the stack-divergent `code/format`, `code/lint`, the install
sub-tasks, and `setup/all` (the entrypoint that names those install tasks). The
overlay is copied on top of `common/`, merging into `code/` and `setup/`.

## See also

- [../readme.md](../readme.md)
