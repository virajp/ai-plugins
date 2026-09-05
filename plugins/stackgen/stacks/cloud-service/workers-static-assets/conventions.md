# Cloudflare Workers Static Assets — conventions

An **assets-only Worker**: the build output directory is the whole
deployment. There is no `main`, so no script runs; the edge matches a
request against the uploaded file set and serves it. `wrangler deploy`
uploads the directory and that is the release.

**This is a hosting pin, and it produces an artifact.** Unlike
`zero-trust-access`, which fronts something that runs elsewhere, this is
where the project actually runs — which makes it the entry a `site`
project pins on the `deploy` axis. The two compose: a static site behind
the identity-aware proxy is both pins on the same axis, and neither
replaces the other.

## What this component writes

**`wrangler.jsonc` at the repo root**, not under `.config/`. Wrangler
discovers its configuration by walking up from the working directory to a
`wrangler.jsonc` / `wrangler.toml`, and it has no ambient way to be told
otherwise — the alternative is `--config .config/wrangler.jsonc` on every
invocation any caller might ever type, which is a flag someone eventually
forgets and then deploys from a config that does not exist. The root
allowlist admits the file for exactly that reason
(`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`); being on the list makes
it landable, not standard, and only a `static-hosting` pack ships one.

**`.config/mise/tasks/p/<project-id>/deploy`**, an overlay in the
project's own task group. It ships as `p/_project/deploy` — a marked
directory name, not a task — and the command that pins this stack renames
the directory to the project's registry id. Until it is renamed the task
is inert rather than wrong: mise ignores a task directory whose name
starts with an underscore, which is the same rule that keeps `_scripts/`
out of `mise tasks`.

**Two marked positions in `wrangler.jsonc`**, both filled by the pinning
command and neither guessable by the pack: the Worker `name`, and the
`routes[]` entry that binds it to a custom domain. Everything else ships
with a real value, because everything else is this component's judgment
rather than the repo's identity.

## Credentials

`wrangler` reads **`CLOUDFLARE_API_TOKEN`** and
**`CLOUDFLARE_ACCOUNT_ID`** from the environment. They are account-wide
values shared across every repo that deploys to the account, so the
secrets convention names them **`GLB_CLOUDFLARE_API_TOKEN`** and
**`GLB_CLOUDFLARE_ACCOUNT_ID`** in the secrets provider
(`${CLAUDE_PLUGIN_ROOT}/assets/contracts/secrets.md`), and the provider
supplies them to the process under the names wrangler expects. They never
appear in `wrangler.jsonc`, and the deploy task refuses to start without
them rather than letting wrangler fail with an auth trace that reads like
a network problem.

`wrangler login` is the interactive alternative and is a developer's
convenience only. It stores an OAuth grant on one laptop; CI has no
browser and no laptop, and a pipeline that depends on someone's grant is
one that breaks when they leave.

## The pipeline

**The task CI must run is `p:<project-id>:deploy`.** The workflow that
calls it is the repo's own — a pack states the task name and never writes
the workflow (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`, the charter
fence). Nothing here decides the trigger either; that belongs to the CI
system pinned on the project's `cicd` axis.

The task does not build. It runs `p:<project-id>:build` when that task
exists and otherwise assumes the output directory is already built,
because what produces the directory is the framework's business and not
this component's.

## The artifact contract

**A directory of files** — `./dist` by default, matching what most static
builders emit and overridable in one place when a framework disagrees.

- **Fingerprinted assets are immutable.** Where the framework hashes
  content into the filename, those paths get a long `max-age` with
  `immutable`; the entry HTML does not, or a deploy is invisible to every
  browser that already has it.
- **`404.html` at the directory root** is what `not_found_handling:
  "404-page"` serves, so the build has to emit one. A missing file turns
  every unknown path into a bare edge 404 with no branding and no
  navigation, and nothing reports it.
- **One deploy is distinguishable from the next** by the uploaded file
  set, which is what makes the rollback path a version rather than a
  rebuild.

## What is explicitly not here

**No Worker script.** No `main`, no `assets.binding`, no
`run_worker_first`. Those are the shape where code fronts the files —
server-side rendering, an API route beside the site, an auth check at the
edge — and that is a separate pack under its own effort, **not offered
here**.

**No other Cloudflare service.** Pages, R2, D1, KV, Durable Objects,
Queues, Images and Stream remain planned under their own effort and are
**not offered**. A service nobody wrote doctrine for is a service nobody
reviewed; that gap is one to name rather than to fill from general
Cloudflare knowledge.

**No wrangler pin.** Wrangler is a development dependency of the project
that deploys, declared in that project's language manifest — and a
manifest is outside the config tier's fence. The deploy task calls the
manifest's wrangler through the package manager rather than a globally
pinned binary, so the version CI runs is the version the lockfile
records.

Full judgment: the `workers-static-assets` skill and its references. The
provider-wide doctrine it cites — the account model, the role grants,
seat-shaped billing, the private plane — is the `cloudflare` skill's.
