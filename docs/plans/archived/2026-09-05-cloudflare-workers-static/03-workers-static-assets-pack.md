# U3 — The `cloud-service/workers-static-assets` pack

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/cloud-service/workers-static-assets/**` —
  everything under it is new. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `plugins/stackgen/stacks/cloud-service/zero-trust-access/**`
  top to bottom (the Cloudflare sibling: `pack.yaml` field shape, the
  "capability deliberately unset" comment, one reference per bar topic, the
  citation seam to the provider doctrine);
  `plugins/stackgen/stacks/cloud-provider/cloudflare/conventions.md` and its
  skill (what you cite, never restate); `plugins/stackgen/assets/kinds.md`
  §`cloud-provider` (`:186-259`) for the five service topics and the three
  extension topics; `plugins/stackgen/assets/pack-format.md` for the `pack.yaml`
  fields and the `config/` sub-conventions;
  `plugins/stackgen/stacks/package-manager/pnpm/config/.config/mise/tasks/code/
  format`
  as the overlay task model; and
  `plugins/stackgen/stacks/toolchain-manager/mise/skills/mise/references/task-
  library.md`
  §`p:<project-id>:*` and §slots.
- **Lazy-load:** `site/wrangler.jsonc` and `.config/mise/tasks/site/release` in
  this repo — the maintainer's proven assets-only setup, read-only, for shape
  and why-comments; copy neither the name nor the domain.

## Ruling

D1: `cloud-service` under `cloud-provider`, composed with the existing
`cloud-provider/cloudflare` unchanged. "Doesn't change the shape. CloudFlare
have many services and stackgen doesn't cover them all."

D2: "Static assets now, SSR as its own pack later": an assets-only Worker with
no `main`.

D3 / D4: category `static-hosting`, carrying the five service topics plus
Artifact, Pipeline and Health.

D5: "Add `wrangler.jsonc` to the root allowlist": the pack ships
`config/wrangler.jsonc` at the repo root.

D7: "A p:<project>:deploy overlay": the pack ships
`config/.config/mise/tasks/p/_project/deploy`, a marked-position directory that
the pinning command renames to the project id; it runs `wrangler deploy` and the
pack names it as the task CI must run. No workflow file.

D8: "Ship it with marked positions": `wrangler.jsonc` ships real values for
`$schema`, `compatibility_date`, `assets.directory` (`./dist`) and
`assets.not_found_handling` (`"404-page"`); `name` and the `routes[].pattern`
are marked slots the pinning command fills, in the same comment form the mise
pack uses for member flags.

D9 *(assumed)*: `artifact: static-assets`.

D10 *(assumed)*: credentials documented as `GLB_CLOUDFLARE_API_TOKEN` and
`GLB_CLOUDFLARE_ACCOUNT_ID`, read from the environment the secrets provider
supplies, never from a file.

D11 *(assumed)*: `capability` unset, with the `zero-trust-access` comment shape.

D12 *(assumed)*: `harness.health` is an HTTP probe of `/` and of a known 404
path; `task: n/a`.

D15 *(assumed)*: the pack pins nothing in mise; the task calls the manifest's
wrangler through the package manager.

## Edits

1. **`pack.yaml`** — `name: Cloudflare Workers Static Assets`; a `summary` in
   the sibling's voice (an assets-only Worker: the build directory is the whole
   deployment, no script, no bindings, the edge serves files);
   `version:
   0.1.0`; `type: cloud-service`; `category: static-hosting`; the
   `capability` comment per D11; `kind: cloud-provider`; `axis: deploy`;
   `artifact:
   static-assets`; `harness:` with `health` per D12 (mechanism
   text names the two probes and why a 404 probe proves `not_found_handling`
   landed), `e2e_staging` (a preview deployment is a separate Worker name or a
   versions upload, and the suite targets its URL — state it, decide nothing)
   and `local_stack` (`wrangler dev` serves the directory locally with the same
   routing rules; that is the substitution, and its fidelity trap is that it
   does not exercise the custom domain or TLS).
2. **`conventions.md`** — the component's prose, copied verbatim into the
   template payload, so it must carry: what this pack writes (`wrangler.jsonc`
   at the root — and **why the root**, citing the allowlist rule and that
   wrangler discovers its config there; the `p/_project/deploy` overlay); the
   marked positions and who fills them; the credentials rule (D10) with the two
   names and a sentence that `wrangler login` is the interactive alternative and
   is never what CI does; the task CI must run (`p:<id>:deploy`) and that the
   workflow is the repo's per the charter fence; the artifact contract (a
   directory of files, `./dist` by default, immutable assets by content hash
   where the framework provides it, `404.html` at the directory root for
   `404-page`); what is explicitly **not** here — a Worker script,
   `run_worker_first`, `assets.binding`, and every other Cloudflare service,
   naming the reserved list.
3. **`config/wrangler.jsonc`** — per D8. Comments explain each real value in the
   maintainer's voice (see `site/wrangler.jsonc` for the register, not the
   values). The two marked positions use a comment block in the same form the
   mise pack uses for member flags in `setup/all` and `mise.dev.toml` — read
   those to match it exactly — and the `routes` entry ships **commented out** as
   the template, with the comment stating that a repo with no custom domain
   deletes the block and gets `<name>.<account>.workers.dev`. Ship
   `compatibility_date` as today's date in `YYYY-MM-DD`. The file must be valid
   JSONC: strip `//` and `/* */` comments and it parses as JSON.
4. **`config/.config/mise/tasks/p/_project/deploy`** — executable,
   `#!/usr/bin/env bash`, `set -euo pipefail`, sources helpers with the
   `# shellcheck source=/dev/null` directive on its own line;
   `#MISE
   description=`, `#MISE dir="{{ config_root }}"`;
   `#USAGE flag "--dry-run"` mapped to `wrangler deploy --dry-run`. Before
   invoking anything it checks `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` are set and non-empty and exits non-zero with a
   message naming both and the secrets-provider convention that supplies them
   (D10) — never a wrangler auth trace. It resolves wrangler as
   `pnpm exec wrangler` when a `pnpm-lock.yaml` is present, else `npx wrangler`
   (D15), with a comment saying why the pack pins nothing. `print_header` once,
   `print_subheader` per step (the build is **not** this task's — it runs
   whatever `p:<id>:build` exists via `have_task`, else states the assumption
   that `./dist` is already built). The `_project` directory name is the marked
   position; a header comment in the file says the pinning command renames the
   directory to the project id and that `_`-prefixed entries are otherwise never
   copied — so this one must be renamed, not skipped. **Confirm against
   `pack-format.md`'s `config/_*` rule** that a directory *inside*
   `config/.config/...` is not caught by the top-level `_`-skip; if it is,
   record it as `UNRESOLVED:` with the two options (a different marker, or a
   top-level rule change).
5. **`skills/workers-static-assets/SKILL.md`** — the router, frontmatter in the
   sibling's exact shape (`name`, `version: 0.1.0`, `category`, `description`,
   `license`, `allowed-tools`), model-invocable, not paths-scoped
   (`kinds.md:211`). One reference per bar topic, eight in all.
6. **`skills/workers-static-assets/references/`** — `pick-and-trade.md`,
   `service-doctrine.md`, `cost-shape.md`, `identity-shape.md`, `local-dev.md`,
   `artifact.md`, `pipeline.md`, `health.md`. Each individually researched
   against Context7's `/websites/developers_cloudflare_workers` and cited; the
   cost and identity references **cite** the provider doctrine
   (`cloud-provider/cloudflare/skills/…`) and never restate it. Facts the plan
   already established: assets-only needs no `main`; `not_found_handling` is
   `404-page` or `single-page-application`; a subpath route needs Wrangler ≥
   3.98.0; `wrangler deploy --temporary` (≥ 4.102.0) deploys to a claimable
   preview account; the API token needs the Workers Scripts edit permission
   scoped to the account.

## Verification

- `mise run plugins:check` exits 0 **once U5 has landed** — before that, rule 11
  refuses `wrangler.jsonc` at the root; that is expected, say so in the report,
  and do not move the file.
- `mise run plugins:shellcheck` exits 0 (the deploy task is in its walk).
- `find config -type f -path '*/tasks/*' ! -perm -u+x` is empty; the task's
  first line is `#!/usr/bin/env bash`.
- Strip comments from `config/wrangler.jsonc` and parse it: valid JSON, with
  `assets.directory`, `assets.not_found_handling` and `compatibility_date`
  present.
- `ls skills/workers-static-assets/references/ | wc -l` = 8.
- `grep -rn "95octane\|virajp\|claude-plugins" .` inside the pack is empty.

## Guardrails

- Do not edit `cloud-provider/cloudflare/**` (U4 owns its `conventions.md`;
  nothing else in it changes), any asset (U1's, U2's), any bundle (U4's), or
  `check.ts` (U5's).
- `plugins/**/*.md` is not dprint-formatted; `config/` is excluded from this
  repo's dprint entirely — format payload files by hand and never with this
  repo's `code:format`.
- `cat` is aliased to `bat` — Write/Edit, never heredocs. A pipe containing
  `npm` is rewritten to `pnpm` by a hook — use Write for any such line, and note
  the fallback in edit 4 names `npx`.
- No absolute paths, no repo names, no account ids, no domains in shipped files.

## Commit

`feat(stackgen): add the workers-static-assets pack — an assets-only Worker with wrangler.jsonc and a deploy overlay`
— written by the orchestrator after the wave gate, not by the unit.
