# devtools plugin

The `devtools` plugin is the **developer-machine toolchain**, in one place. It
teaches an opinionated [mise](https://mise.jdx.dev) standard — the `.config/`
three-file `MISE_ENV` split (`mise.toml` / `mise.dev.toml` / `mise.ci.toml`) and
a mandatory file-based task library under `.config/mise/tasks/` — plus a
`/devtools:scaffold` skill that lays both into a repo. Around that sit the tools
the stack templates name: Doppler, Docker/OCI, dprint, ESLint, gitleaks, grype,
and pre-commit. It also owns the one provider-neutral **deploy** template,
`container-generic`.

It is a **`vwf` dependency**, and that is load-bearing rather than tidiness:
`/vwf:setup` orchestrates `/devtools:scaffold`, and a skill vwf cannot see fails
**silently** — indistinguishable from one that ran and returned nothing.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install devtools@virajp-plugins
```

Add `--scope project` to scope it to one repo instead of every repo on your
machine. Installing `vwf` pulls this plugin in automatically, via Claude Code's
own plugin-dependency resolution (≥ 2.1.143) — nothing here needs installing by
name for a vwf user.

### There is no install-time binary gate any more

A plugin's `requires:` list — the hard install gate this section used to
describe — is retired, and did not come back with the installer's `--all`,
`--user` and `--project` flags. A missing binary no longer fails the install; it
surfaces instead as a `/vwf:doctor` **blocking** finding, and `/vwf:setup` and
`/vwf:execute` both halt on one. Run `/vwf:doctor` after installing to see what
your machine is missing.

`mise` is the one tool this plugin cannot work without — `scaffold` writes mise
config and the whole task library is mise tasks. `doppler`, `dprint`, `eslint`,
`gitleaks`, `grype` and `pre-commit` are all documented here and executed by
**your** repo, never by this plugin — that has not changed.

## Skills

Every skill except `scaffold` and the two stack adapters is **auto-applying**:
it loads when you edit the file it governs, and never otherwise.

| Skill                     | Governs                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `mise`                    | mise config + anything under `.config/mise/tasks/` — the standard below |
| `scaffold`                | user- **and** model-invocable; lays the standard into a repo            |
| `doppler`                 | **development** secret injection — never the production answer          |
| `docker`                  | Dockerfiles, `.dockerignore`, compose files; the local stack            |
| `dprint`                  | `dprint.json` — the repo's single formatter                             |
| `eslint`                  | eslint config / `.config/linter.yaml` — the correctness gate            |
| `gitleaks`                | `.config/gitleaks.toml` — the secret scanner                            |
| `grype`                   | `.config/grype.yaml` — the dependency vulnerability scanner             |
| `pre-commit`              | `.config/pre-commit-config.yaml` — the local gate                       |
| `devtools-stack-menu`     | the vwf stack-adapter menu — one deploy template, `container-generic`   |
| `devtools-stack-template` | the vwf stack-adapter payload for that template                         |

`dprint` and `eslint` own the **gate's shape** — one root config, plugins pinned
by version, flat config only, zero formatting rules in the linter, an override
scoped by `files` glob rather than disabled globally. Which rules a *language*
runs is the language plugin's: for TypeScript that is
[`typescript:lint-format`](./typescript.md#skills), which governs the same files
from the other side.

### Secrets: development only

**Doppler is a development tool.** Secrets reach a process as environment
variables and are never read from a committed file — that rule holds in every
environment, and it is the injector that changes: Doppler locally, the CI
system's secret store in CI, the cloud plugin's secret manager in production
(`gcp` → Secret Manager, `cloudflare` → Workers secrets).

Wrap the **mise task**, never the application binary:

```sh
doppler run -- mise run dev
```

That is what makes the same task run with and without Doppler — CI calls
`mise run dev` directly under its own injected environment, and the task is
identical either way.

There is deliberately **no `secrets` plugin** in this marketplace. Dev secrets
are `devtools`; production secrets belong to whichever cloud plugin the project
deploys on. A product that needs Doppler at runtime has moved a dev tool into
production.

## Stack templates

`devtools` owns exactly one vwf stack template, on the **deploy** axis:

| Slug                | Axis     | What it pins                                              |
| ------------------- | -------- | --------------------------------------------------------- |
| `container-generic` | `deploy` | An OCI image, any registry, any host that runs containers |

It is the option to pick when the product must not be tied to one cloud, and it
lives here because Docker is developer tooling and the template names no
provider. The image is built once and **promoted** between environments rather
than rebuilt — which is what makes the tested artifact and the released artifact
the same artifact. Configuration arrives as environment variables from the host,
so the image carries nothing environment-specific and no provider-specific
entrypoint or agent.

A **managed** container host (Cloud Run, GKE) comes from the project's cloud
plugin instead; this template stays deliberately silent on which host runs the
image, and the menu says so on every answer rather than coming back quietly
short.

There is no `container` capability plugin: a container is not a backing
capability, it is how a deployable is packaged.

### The local stack

The `docker` skill's second subject is the other job containers do — the backing
services `e2e_local` needs, run under Compose. This is the **one harness
capability whose mechanism vwf fixes**: composed services behind `wait-on`
readiness gates, because the acceptance verifier depends on a deterministic
ready signal. An ad-hoc `sleep` is a finding, not a variant — long enough on a
laptop is short enough on a loaded CI runner.

Which services run in the stack is the **backing** axis's decision. This plugin
owns the wiring; the [datastore](./datastore.md), [identity](./identity.md) or
[orchestration](./orchestration.md) plugin owns what is wired. A product whose
`e2e_local` needs no backing services needs no Compose file at all.

## The mise standard

The rest of this guide is the `mise` skill's subject: how the toolchain is
pinned, where env values live, and the task library everything else runs
through.

### The three-file split

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

### The task library

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
  `code:all`. `code:sec` (and so `code:all`) invokes grype and gitleaks, which
  live in `mise.dev.toml` — run it under the dev toolchain (`MISE_ENV=dev`).
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

## /devtools:scaffold

`/devtools:scaffold [target-dir]` lays the whole standard into a repo. It
defaults to the current repo root; pass a directory to scaffold into
`<dir>/.config/`. The command:

1. **Detects the stack** — `package.json`/`pnpm-lock.yaml` (Node),
   `pyproject.toml`/`uv.lock` (Python), `pubspec.yaml` (Flutter) — and detected
   tool configs (`dprint.json`, `.pre-commit-config.yaml`, and so on).
2. **Confirms** what it cannot infer in one batched round: whether the repo is
   built/deployed through CI/CD, and which runtime env vars differ between local
   and production.
3. **Writes the config files** per the three-file split, including the Node gpg
   workaround when the runtime is Node.
4. **Copies the shipped task templates** rather than hand-writing them.

For a Node repo, the shipped `code/lint` runs `pnpm dlx @askviraj/linter` — the
author's personal default. Scaffold flags this and offers to swap in the repo's
own linter (e.g. `eslint`, `biome`) instead.

The templates live as a **common base plus one stack overlay**. `common/` is
identical everywhere — `_scripts/_helpers`, the `code/*` quality gates,
`setup/mise`, and `setup/precommit`. The `node/`, `flutter/`, or `python/`
overlay supplies the stack-divergent `code/format`, `code/lint`, the install
sub-tasks, and `setup/all` (the entrypoint that names those install tasks). The
overlay is copied on top of `common/`, merging into `code/` and `setup/`.

The skill is **model-invocable as well as user-invocable**, because `/vwf:setup`
orchestrates it. Flipping it to user-only would break setup silently rather than
noisily.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that depends on this one.
- [cicd plugin](./cicd.md) — the pipelines that assume mise provides the
  toolchain.
- [typescript plugin](./typescript.md) — the language side of the lint/format
  gate.
