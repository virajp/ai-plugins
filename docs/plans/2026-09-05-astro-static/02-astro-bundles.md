# U2 — Two static bundles, and the SSR bundle re-pinned to the real pack

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/bundles/typescript-astro-react.md`,
  `plugins/stackgen/stacks/bundles/typescript-astro-static.md` (new),
  `plugins/stackgen/stacks/bundles/typescript-astro-static-react.md` (new).
  Touch nothing outside this list — no other bundle, no pack.
- **Model:** inherit
- **Read first:** `plugins/stackgen/stacks/bundles/typescript-astro-react.md`
  top to bottom; `typescript-parseargs-cli.md` and `typescript-effect-cli.md`
  (the sibling precedent — same platform, with and without a framework);
  `cloudflare-zero-trust.md:26-32` (how a bundle body names a pairing on another
  axis); `plugins/stackgen/assets/pack-format.md:144-154` (bundle frontmatter
  keys); `plugins/stackgen/stacks/framework/astro/pack.yaml` (U1's — read the
  `version:`; never edit).
- **Lazy-load:** `plugins/stackgen/stacks/framework/astro/conventions.md` (U1's)
  for the `## Build output` heading the static bundles cite, and the mode
  doctrine the SSR body now defers to. If U1 has not landed when you write, cite
  the heading by the name D5 fixes and say so in a `GAP:`.

## Ruling

D1: a sibling bundle per mode, not a mode field.

D2 / D3: the SSR bundle re-pins `framework/astro@0.1.0`; both static bundles pin
the same pack.

D4: "Two static bundles, with and without": `typescript-astro-static` carries no
islands framework; `typescript-astro-static-react` carries
`framework/react@generated`.

D6 *(assumed)*: slugs and names as stated; the SSR bundle keeps its name.

D7 *(assumed)*: static composition `language/typescript@0.1.0`,
`package-manager/pnpm@0.1.0`, `toolchain-gate/tsconfig@0.1.0`,
`toolchain-gate/eslint@0.1.0`, `framework/astro@0.1.0`; static · React adds
`framework/react@generated`; neither carries `framework/effect`.

D10 *(assumed)*: static — Vitest, node, no jsdom; static · React — Vitest +
jsdom + Testing Library; no 100 % rule copied.

D11 *(assumed)*: the SSR body keeps its decisions but cites the pack for what
Astro is and how output modes work; "SSR is not a published API" stays.

D12 *(assumed)*: each static bundle's body names `cloudflare-workers-static` as
the deploy pairing it was built for, in `cloudflare-zero-trust.md:26-32`'s
voice, and states the artifact is a directory of files at `./dist` per the
pack's named fact. Frontmatter names no deploy slug.

## Edits

1. **`typescript-astro-static.md`** — new. Frontmatter:
   `name: TypeScript ·
   Astro (static)`, `axis: project`,
   `kind: language-bundle`, `components:` per D7 (five refs),
   `platforms: [site]`. **No** `unconditional:`. Body heading
   `# site — TypeScript · Astro (static)`. Body, in the parseargs register: what
   a static `site` is (a content surface built once, served as files, calling
   someone else's API if it calls one at all; "SSR is not a published API"
   restated as "a static site publishes no API"); **Stack** — Astro
   `output: "static"` (the default; the pack's static-output reference carries
   the rest), file routes and content collections, no islands framework and why
   (zero JavaScript by default is the point; a repo that needs an island picks
   the `· React` sibling or the SSR bundle), the `src/` layout; **Build output**
   — a directory of files at `./dist`, citing the pack's `## Build output` fact,
   and the deploy pairing per D12; **Testing** per D10; the axis note ("this doc
   covers the project axis only") copied from the SSR bundle.
2. **`typescript-astro-static-react.md`** — new. Same as edit 1 with
   `name: TypeScript · Astro (static) · React`, `framework/react@generated`
   added to `components:`, an **islands** paragraph (React via the Astro
   integration only where interactivity demands it, hydrated per island, never a
   client-side router; the UI kit is the repo's call — do not copy the SSR
   bundle's shadcn/Radix/Tailwind list as a decision, name it as one option),
   and **Testing** with jsdom + Testing Library for the islands.
3. **`typescript-astro-react.md`** — frontmatter: `framework/astro@generated` →
   `framework/astro@0.1.0`; everything else in the frontmatter unchanged
   (`framework/react@generated` and `framework/effect@0.1.0` stay). Body: the
   opening paragraph's description of Astro and the **Framework** stack bullet
   defer to the pack ("the `astro` pack carries the framework and the
   output-mode decision; this bundle pins `output: "server"` on the Node adapter
   because …") rather than describing Astro from scratch; every other decision
   (React islands, UI kit, `AppLayer`, proxy endpoints, cache middleware,
   config, observability, testing) stays as written. Add one sentence naming the
   two static siblings so a reader on this page can find them.

## Verification

- `mise run plugins:check` exits 0.
- `grep -c "framework/astro@generated" plugins/stackgen/stacks/bundles/*.md`
  totals 0;
  `grep -l "framework/astro@0.1.0" plugins/stackgen/stacks/bundles/
  *.md`
  returns exactly the three Astro bundles.
- `grep -n "unconditional" plugins/stackgen/stacks/bundles/typescript-astro-
  *.md`
  is empty.
- `grep -n "^- site" plugins/stackgen/stacks/bundles/typescript-astro-*.md` hits
  all three.
- Every `components:` ref in the three files either ends in `@generated` or
  names a `plugins/stackgen/stacks/<type>/<slug>/pack.yaml` that exists and
  declares that version — check by hand; nothing else does.
- The retired-terms scan: no backticked `web` on a line that also carries
  another platform token or the word "token"; no literal `stacks/project/`.
- `mise run plugins:inventory --check` is expected to be red until the
  orchestrator regenerates; say so, do not run the generator.

## Guardrails

- Do not edit any other bundle — the Workers plan owns `cloudflare-*.md`, and
  nothing else changes. Do not edit the pack (U1's).
- Frontmatter names no deploy slug; the pairing is body prose only (D12).
- `plugins/**/*.md` is not dprint-formatted; match the fold width by hand. `cat`
  is aliased to `bat` — Write/Edit only. Strict YAML in the frontmatter.
- `plugins/stackgen/stacks/inventory.md` is generated (U4's); never touch it.

## Commit

`feat(stackgen): offer typescript-astro-static and -static-react; re-pin the SSR bundle to the astro pack`
— written by the orchestrator after the wave gate, not by the unit.
