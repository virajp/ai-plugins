# U4 — Docs: the readme, the maintainer map, the third tag family

- **Wave:** 3
- **Depends on:** U1, U2
- **Owns:** `readme.md`, `CLAUDE.md`, `installer/CLAUDE.md`, `site/CLAUDE.md`
  (new), `.claude/docs/**`, `.claude/agents/docs-reconciler.md`,
  `.claude/skills/vwf-plugin/SKILL.md`,
  `.claude/skills/stackgen-plugin/SKILL.md`,
  `.claude/skills/plugin-authoring/SKILL.md`, `.claude/skills/release/SKILL.md`,
  `.claude/skills/create-plan/SKILL.md`, `.claude/skills/execute-plan/SKILL.md`,
  `mempalace.yaml`,
  `docs/memory/decisions/2026-09-05-website-on-workers-static-assets.md` (new).
  Touch nothing outside this list.
- **Model:** inherit
- **Read first:** the `docs-reconciler` agent's findings for the wave 1–2 diff
  (the orchestrator dispatches it first and passes them in), every
  `DOCS FALSIFIED:` line U1–U3 returned, the inbound-reference list in
  index.md's Facts, and then every owned file top to bottom.
- **Lazy-load:** `.github/workflows/site.yml`, `.config/mise/tasks/site/release`
  (to describe them accurately), `site/src/lib/routes.ts` (the route rule the
  readme links must follow).

## Ruling

Decision 13: "The 15 links into the moved trees become
`https://claude-plugins.virajp.dev/<route>` (with anchors, e.g.
`/plugins/vwf/#caveats`); `readme.md:247` (inventory) stays an in-repo link; the
header image becomes
`https://claude-plugins.virajp.dev/brand/social-preview.png`. Nothing else in
the readme changes."

Decision 17: "`site/CLAUDE.md`, the installer precedent (a tree that is not
shipped carries its context in place), plus a row in the three-homes table in
`CLAUDE.md`."

Decision 18: "Prose updates only in `mempalace.yaml`; no `site` room."

Decision 21: "Every `site-v<version>` tag carries a GitHub Release in the
release skill's note format, like `installer-v*`. In-sync releases cut plugin,
installer and site tags from one `main` merge in that order."

Decision 2 (to be documented, not implemented here): the `site:version` /
`site:release` tasks, `site.yml`'s two jobs, and "a merge to `main` ships
nothing until a tag is cut."

The reversal from the Goal: "the request said Cloudflare Pages … the user chose
Workers Static Assets."

`CLAUDE.md`'s rule: docs ship with the change, in the same commit.

## Edits

1. **`readme.md`** — the header `<img src>` at `:2` becomes
   `https://claude-plugins.virajp.dev/brand/social-preview.png`. Each link into
   the moved trees becomes the site URL by the route rule:
   `./docs/plugins/vwf.md` → `https://claude-plugins.virajp.dev/plugins/vwf/`,
   with its anchor kept (`:82` → `/plugins/vwf/#caveats`);
   `./docs/how-to/index.md` → `/how-to/`; `./docs/installer/` → `/installer/`;
   `usage.md`/`targets.md`/`internals.md` → `/installer/usage/` etc.;
   `mempalace.md`, `karpathy-guidelines.md`, `stackgen.md` likewise. `:247`
   (`plugins/stackgen/stacks/inventory.md`) stays. Add one sentence where the
   manual is first named (`:27-29`) saying the manual and guides are published
   at `claude-plugins.virajp.dev` and built from `site/`. No other prose
   changes; note that widening a table cell re-pads the row (dprint).
2. **`CLAUDE.md`** — `:72` names the user-facing tree: rewrite to `readme.md`
   plus `site/src/content/docs/{plugins,how-to,installer}`, published at
   `https://claude-plugins.virajp.dev`. The three-homes table gains a `site/`
   row → `site/CLAUDE.md`, loads when Claude reads or edits `site/`. The "What
   This Repo Is" intro gains one sentence: the repo also ships the website. The
   tag-family table gains `site-v<version>` | the website | `site.yml` →
   `wrangler deploy`. The "Ask the user before running `plugins:release` or
   `i:release`" lines (two places) add `site:release`. `:194` (installer
   reference path) points at the site URL and the new path. The Tasks section
   gains a `site:check` bullet ("runs in `site.yml`, not `plugins.yml`"). The
   `.gitignore` traps paragraph mentions `site/dist/` and `site/.astro/` beside
   `bin/`.
3. **`installer/CLAUDE.md`** — `:5` and `:214`: the user-facing reference is
   `site/src/content/docs/installer/` (published at
   `https://claude-plugins.virajp.dev/installer/`); the same-commit rule names
   that path.
4. **`site/CLAUDE.md`** (new, dprint-formatted like `installer/CLAUDE.md`) — the
   site's home: what it is (Astro 6, static, Workers Static Assets at
   `claude-plugins.virajp.dev`); the tree (`src/content/docs/` is the authored
   manual, `src/pages/index.astro` the landing, `src/lib/remark-docs-links.ts`
   the link rule, `scripts/check-links.ts` the gate, `public/brand/` the
   assets); the rules (radius 0, dark only, mono is semantic, no em-dashes,
   frontmatter is strict YAML and a bad one drops the page silently, relative
   `.md` links only inside the collection, absolute GitHub URLs for anything
   else); the tasks (`site:dev`, `site:build`, `site:check`, `site:version`,
   `site:release`); the release model (version in `site/package.json`, bump on
   `develop`, tag from `main`, `site.yml` deploys on the tag, a `main` merge
   ships nothing); the design source (Claude Design project id and the three
   page names); the traps (the 10-hour dependency cooldown, Astro 6 heading ids
   match GitHub so never add a slug plugin, `pnpx` not `npx`).
5. **`.claude/docs/ci-and-releases.md`** — the tag-family table gains the
   `site-v*` row; a "The website" subsection describes `site.yml` (the `build`
   gate on `site/**` paths, the tag-only `deploy` job with the two verification
   steps mirrored from `release.yml`, the two secrets), why it is a third file,
   and the `site:release` ritual. Note the concurrency and that `plugins.yml` is
   untouched.
6. **`.claude/docs/repo-shape.md`** — the tree diagram gains `site/`; `:83`'s
   readme link follows the new path; the mise task inventory gains the `site:*`
   family.
7. **`.claude/docs/plugins.md`** — only if the reconciler flags a passage (the
   plugin inventory is unchanged).
8. **`.claude/agents/docs-reconciler.md`** — `:5-6`, `:19-20`, `:41-47`: every
   `docs/plugins/…` and `docs/installer/…` path becomes its
   `site/src/content/docs/…` form; add a row for `site/CLAUDE.md` (the site's
   own context) and one for `readme.md`'s site links.
9. **`.claude/skills/vwf-plugin/SKILL.md`** `:43, :159, :161`;
   **`.claude/skills/stackgen-plugin/SKILL.md`** `:41, :135`;
   **`.claude/skills/plugin-authoring/SKILL.md`** `:108, :110`;
   **`.claude/skills/create-plan/SKILL.md`** `:51`;
   **`.claude/skills/execute-plan/SKILL.md`** wherever it lists the docs unit's
   owned paths — the same path substitution, keeping every sentence's meaning.
10. **`.claude/skills/release/SKILL.md`** — the surfaces table gains the site
    row (`site-v<version>` | `site:release` | Cloudflare deploy + GitHub
    Release); a "Releasing the site" section mirroring "Releasing the installer
    CLI" (bump with `site:version` on `develop`, merge, `site:release` on
    `main`, `gh release create site-vX.Y.Z` in the note format); an "In sync"
    paragraph: when plugins, installer and site release together, cut them from
    the same `main` merge in the order plugins → installer → site, each with its
    own note; the "Before cutting" checklist names
    `site/src/content/docs/<plugin>.md` where `:180` names `docs/plugins/`.
11. **`mempalace.yaml`** — `:12, :18, :83, :88, :103`: prose and room
    descriptions name the new paths; routing keywords unchanged.
12. **`docs/memory/decisions/2026-09-05-website-on-workers-static-assets.md`** —
    in the folder's existing format: the decision (Workers Static Assets, not
    Pages; tag-driven deploy on `site-v*`; docs moved under `site/`; dark-only
    blueprint design), the alternatives rejected (Pages, dashboard git
    integration, deploy on `main` push, `site/docs/`), and why (Cloudflare's own
    guidance; the repo's tag model; one authored docs tree that GitHub and the
    site both read).
13. Apply every `docs-reconciler` finding and every `DOCS FALSIFIED:` line from
    U1–U3 not already covered above; list each applied one in `CHANGED:`.

## Verification

- `grep -rn 'docs/plugins/\|docs/how-to/\|docs/installer/\|docs/assets/' readme.md CLAUDE.md installer/CLAUDE.md .claude/ mempalace.yaml`
  prints nothing except lines inside `docs/plans/**` quotations, if any.
- `grep -c 'claude-plugins.virajp.dev' readme.md` ≥ 16 (15 links + the image).
- `grep -n 'site-v' CLAUDE.md .claude/docs/ci-and-releases.md .claude/skills/release/SKILL.md`
  finds the new family in all three.
- `grep -n 'site:release' CLAUDE.md` finds both ask-first lines.
- `mise run code:format` reports nothing under the owned paths (all are
  dprint-formatted; `site/CLAUDE.md` included by `**/*.md`).
- `mise run site:check` still green (the readme is not a site input, but
  `site/CLAUDE.md` sits inside `site/` and must not be picked up by the
  collection: its path is outside `src/content/docs`, confirm the build page
  count is unchanged).
- No em-dash added to any visible string in `site/CLAUDE.md`'s examples of site
  copy (the file itself may use the repo's prose style).

## Guardrails

- Do not edit anything under `site/` other than `site/CLAUDE.md`.
- Do not edit `docs/memory/**` other than the one new decision file, and never
  `docs/plans/archived/**`.
- Do not change `release.yml`, `plugins.yml` or any task file; describe them.
- Do not rewrite readme prose beyond decision 13's one added sentence.
- `CLAUDE.md`, `installer/CLAUDE.md`, `readme.md` and `.claude/docs/**` are
  dprint-formatted: widening a table cell re-pads the row; run the formatter and
  re-read the diff.
- `cat` is aliased to `bat`; use Write/Edit.

## Commit

`docs: publish the manual at claude-plugins.virajp.dev, add the site home and the site-v tag family`
— written by the orchestrator after the wave gate, not by the unit.
