# U4 — The `cloudflare-workers-static` bundle, and the reservation redeemed

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/bundles/**`,
  `plugins/stackgen/stacks/cloud-provider/cloudflare/conventions.md`. Touch
  nothing outside this list — in particular nothing else in the provider pack.
- **Model:** inherit
- **Read first:** `plugins/stackgen/stacks/bundles/cloudflare-zero-trust.md` and
  `gcp-cloud-run.md` top to bottom (frontmatter shape; what a bundle body
  decides that no component decides alone; the "composes with a hosting pin"
  passage at `cloudflare-zero-trust.md:26-32`; the reservation paragraph at
  `:34-39`); `plugins/stackgen/stacks/cloud-provider/cloudflare/conventions.md`
  (the reservation at `:5-13`);
  `plugins/stackgen/assets/pack-format.md:
  144-170` (bundle frontmatter keys,
  `unconditional:`).
- **Lazy-load:** `plugins/stackgen/stacks/bundles/mise.md` for how a bundle
  states its seams with other bundles.

## Ruling

D1: composed with the existing `cloud-provider/cloudflare` unchanged.

D2: Workers-with-a-script is added by name to the reserved list.

D9 *(assumed)*: `artifact: static-assets`.

D13 *(assumed)*: slug `cloudflare-workers-static`, name "Cloudflare Workers
Static Assets", `axis: deploy`, `kind: cloud-provider`,
`artifact:
static-assets`, components `cloud-provider/cloudflare@0.1.0` and
`cloud-service/workers-static-assets@0.1.0`. Not `unconditional`.

D14 *(assumed)*: `cloud-provider/cloudflare` stays at `0.1.0`; only the
reservation paragraph in its `conventions.md` changes.

## Edits

1. **`bundles/cloudflare-workers-static.md`** — new. Frontmatter per D13; **no**
   `unconditional:` key. Body in the `gcp-cloud-run.md` register, carrying what
   the combination decides: the artifact is a directory of files, and there is
   no promotion by digest — the same build output is deployed to one Worker name
   per environment, and the pipeline's job is to make that build reproducible;
   release is behind `p:<id>:deploy`, never a workflow this bundle ships; what
   is explicitly not here (a Worker script, any other Cloudflare service); and
   the seam with `cloudflare-zero-trust` — that bundle "composes with a hosting
   pin rather than replacing one", and this is the hosting pin it pairs with, so
   a `site` behind Access pins both.
2. **`bundles/cloudflare-zero-trust.md:26-32`** — the "composes with a hosting
   pin" passage may now name the pin: "such as `cloudflare-workers-static`". One
   clause, no restructuring.
3. **`bundles/cloudflare-zero-trust.md:34-39`** — the reservation paragraph
   removes "Workers" from the reserved list and states, in the same voice, that
   Workers Static Assets is now offered as `cloudflare-workers-static`, while
   **a Worker script fronting those assets** (SSR on Workers), Pages, R2, D1,
   KV, Durable Objects, Queues, Images and Stream remain planned under their own
   effort and are not offered here. The "a gap to name, not a gap to fill from
   general Cloudflare knowledge" sentence stays.
4. **`cloud-provider/cloudflare/conventions.md:5-13`** — the same edit to the
   provider's reservation paragraph: it "exists to support **Zero Trust Access**
   and **Workers Static Assets**", the reserved list drops "Workers" and gains
   "a Worker script fronting static assets", and the closing rule — "a service
   this component has not written doctrine for is a service it does not offer" —
   stays verbatim.

## Verification

- `mise run plugins:check` exits 0.
- `grep -n "unconditional" plugins/stackgen/stacks/bundles/cloudflare-workers-
  static.md`
  is empty.
- `grep -n "static-assets" plugins/stackgen/stacks/bundles/cloudflare-workers-
  static.md`
  hits the frontmatter `artifact:` line.
- `grep -n "Workers" plugins/stackgen/stacks/bundles/cloudflare-zero-trust.md
  plugins/stackgen/stacks/cloud-provider/cloudflare/conventions.md`
  — every hit either offers Workers Static Assets or reserves a Worker *script*;
  no line reserves "Workers" as a bare word.
- The bundle's two component refs name versions the packs actually carry:
  `cloud-provider/cloudflare/pack.yaml` `0.1.0` and
  `cloud-service/workers-static-assets/pack.yaml` `0.1.0` (U3's — read it, do
  not edit it).

## Guardrails

- Do not edit anything in `cloud-provider/cloudflare/` except `conventions.md`,
  and in that file only the reservation paragraph. Do not bump its `pack.yaml`.
- Do not create or edit the service pack (U3's) or any asset (U1's, U2's).
- `plugins/**/*.md` is not dprint-formatted; match the fold width by hand. `cat`
  is aliased to `bat` — Write/Edit only.
- `plugins/stackgen/stacks/inventory.md` is generated (U7's); never touch it.

## Commit

`feat(stackgen): offer cloudflare-workers-static and narrow the Cloudflare reservation`
— written by the orchestrator after the wave gate, not by the unit.
