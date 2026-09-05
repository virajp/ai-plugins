# U1 — The `static-hosting` category and its bar

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/assets/taxonomy.md`,
  `plugins/stackgen/assets/kinds.md`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** both owned files top to bottom, then
  `plugins/stackgen/stacks/cloud-service/zero-trust-access/pack.yaml` and
  `plugins/stackgen/stacks/cloud-service/cloud-run/pack.yaml` for how a category
  is declared and how the extension is claimed.
- **Lazy-load:** `plugins/stackgen/assets/pack-format.md` §the `pack.yaml`
  fields, only if the category enum is restated there.

## Ruling

D3: "Add a new category": `static-hosting`, appended to the closed list at
`taxonomy.md:94-95`.

D4: "Same three as compute": `kinds.md:193-194` and `:252` gate the extension on
`compute` **or** `static-hosting`; topics 6–8 are Artifact, Pipeline, Health.

D17 *(assumed)*: `kinds.md`'s per-kind reviewer section gains one clause for
`cloud-provider`: a `static-hosting` service whose artifact is not a directory
of files, or that ships a Worker script, is a gap.

## Edits

1. **`taxonomy.md:94-95`** — the `cloud-service` category list gains
   `static-hosting`, placed after `cdn` (the two are neighbours in meaning and
   the contrast is what makes each legible: `cdn` caches an origin,
   `static-
   hosting` *is* the origin). Keep the list's fold width.
2. **`taxonomy.md:118-125`** — the "no capability token today" paragraph names
   `cdn`, `secrets-manager` and `access`; it gains `static-hosting` as a fourth
   with the same reasoning: the component leaves `capability` unset, and minting
   is vwf's move. Do not invent a token.
3. **`kinds.md:193-194`** — "plus a three-topic extension where the service's
   category is `compute`" becomes "… is `compute` or `static-hosting`". One
   sentence following it states why the two share a bar: both are deploy
   targets, and a deploy target must say what it publishes, how it gets there
   and how you know it is up, whether the artifact is an image or a directory of
   files.
4. **`kinds.md:198-200`** — the axis bullet, "a `compute` service is a deploy
   target, as is anything else that fronts the deployment", names
   `static-hosting` explicitly beside `compute`.
5. **`kinds.md:250-259`** — the heading "**Compute-category extension** — a
   `cloud-service` in category `compute` is a deploy target and carries three
   more" becomes the deploy-target extension for both categories. Topic 6's text
   is image-specific ("one multi-stage Dockerfile, the same digest promoted
   across environments"); rewrite it so it states the contract per category: for
   `compute` the image and its digest, for `static-hosting` the build output
   directory and its content hash or immutable-asset rule. Topics 7 and 8 are
   already category-neutral; leave their wording, add nothing.
6. **`kinds.md` §What the reviewer checks per kind (~`:1010-1026`)** — the
   `cloud-provider` sentence gains one clause per D17. Keep it to one sentence
   in the existing voice.

## Verification

- `mise run plugins:check` exits 0.
- `grep -n "static-hosting" plugins/stackgen/assets/taxonomy.md` hits the
  category list and the no-token paragraph (≥ 2 lines).
- `grep -n "static-hosting" plugins/stackgen/assets/kinds.md` hits the extension
  condition, the axis bullet, the extension heading or its body, and the
  reviewer clause (≥ 4 lines).
- `grep -c "compute" plugins/stackgen/assets/kinds.md` did not decrease — the
  edit widens, it does not rename.

## Guardrails

- Do not edit `pack-format.md`, `output-tree.md` or any other asset (U2's, or
  nobody's). Do not create the pack (U3's) or touch a bundle (U4's).
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width by
  hand.
- `cat` is aliased to `bat` — write with Write/Edit, never `cat >` heredocs.
- Do not mint a capability token. Do not add a fourth topic to the extension.

## Commit

`feat(stackgen): add the static-hosting category and give it the deploy-target bar`
— written by the orchestrator after the wave gate, not by the unit.
