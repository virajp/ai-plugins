# Decision — the charter fence opens for gate and provider config files

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` · **Reverses** the
`config/`-tier fence as written in `assets/output-tree.md`,
`assets/pack-format.md`,
`skills/stackgen-stack-template/references/materializer.md` and
`skills/stackgen-stack-template/SKILL.md` · **Umbrella**
[`2026-09-05-vwf-init-and-the-repo-shape.md`](./2026-09-05-vwf-init-and-the-repo-shape.md)

## What was decided before

A pack's `config/` tree could carry the toolchain manager's own config and its
task library, and **nothing else**. The fence was stated four times in almost
the same words: the tier is *"deliberately not extended to `dprint.json`,
`.config/pre-commit-config.yaml`, `package.json` or a CI workflow"*, and *"a
gate pack names its config file as a prerequisite the repo still owns"*.

## What changed

The tier now has five kinds of entry, and gate and provider configs are three of
them:

- **(b)** a gate's own config — `.config/dprint.json`, `.config/taplo.toml`,
  `.config/pre-commit-config.yaml`, `.config/gitleaks.toml`,
  `.config/grype.yaml`, `.config/git-conventional-commits.yaml`;
- **(c)** the hygiene files — `.gitignore`, `.editorconfig`, `.gitattributes`,
  `SECURITY.md`, `.config/renovate.json`, the licence texts;
- **(d)** a provider's environment fragment, `.config/mise/conf.d/<pack>.toml`;
- **(e)** a hook fragment, `.config/pre-commit.d/<pack>.yaml`, copied verbatim
  and merged into the pre-commit config by `/vwf:init` alone.

`package.json`, any language manifest or lockfile, and CI workflow files stay
**outside** the fence. A new **root allowlist** replaces the old blanket ban: a
pack may land `.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`,
`SECURITY.md`, `readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs` and a
language's mandated manifests at the repo root, and nothing else. Being on the
list is a ceiling, not a licence — no pack may ship `readme.md` or `CLAUDE.md`,
which remain `/vwf:readme`'s and `/vwf:setup`'s.

## Why

The fence existed so a pack could not silently take ownership of a file the repo
author writes by hand. But the file the fence protected hardest — the pre-commit
config — is exactly the one nobody could produce: `/vwf:init` cannot write it
(vwf names no tool), the gate packs were forbidden from writing it, and so a
freshly shaped repo had gates installed and no gate configuration. Naming a
config as a *prerequisite* is only honest when someone else supplies it, and
nobody did.

What actually keeps the guarantee is not the file list but the terms already
attached to every other target: it **merges, never owns**, it is recorded in the
lockfile per file with the component that supplied it, it takes its own consent
line, and removal is by subtraction of exactly the recorded keys. Those terms
survive the widening; the list did not need to.

## What it costs, stated plainly

Two costs, both real and both paid during this plan's own run:

- **Formatting a payload here breaks it there.** The packs ship files their own
  formatter formats. Formatted with *this* repo's dprint config, four of them
  came out different from what the *shipped* config produces, and a freshly
  initialised repo failed its own first `--all-files` hook run. The fix is a
  dprint exclusion on `plugins/*/stacks/*/*/config/` and a rule that payload
  bytes are the target's, never this repo's.
- **The checker had to grow.** Rule 11 widened from "task files are executable"
  to five assertions over the whole tier — exec bit, known shebang, hook exec
  bit and shebang, root allowlist, and every `pre-commit.d/*.yaml` parsing with
  a top-level `repos:` list. Each of those failure modes is silent in the target
  repo, which is why it is a checker rule and not a review note.

## Addendum — 2026-09-05: `wrangler.jsonc` joins the allowlist

The root allowlist above gained a tenth entry the same day, on the
`2026-09-05-cloudflare-workers-static` branch: `wrangler.jsonc`, alongside
`.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`, `SECURITY.md`,
`readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs` and a language's
mandated manifests. Everything the original decision settled stands — what is
outside the fence, the merges-never-owns terms, the ceiling-not-a-licence rule
that still bars a pack from shipping `readme.md` or `CLAUDE.md`.

Why it moved: `cloud-service/workers-static-assets` is the first cloud pack to
ship a `config/` tree at all, and wrangler discovers its config **only at the
repo root**. That left two ways to ship one — the root file, or `--config` on
every invocation any caller might type — and a flag every caller has to remember
is the worse of the two. It is the same exception `eslint.config.mjs` already
is, which is what makes it a widening of one entry rather than a new principle:
being on the list makes a file landable, not standard, and only a
`static-hosting` service pack ships this one.

The widening is carried in `assets/output-tree.md`,
`skills/stackgen-stack-template/references/materializer.md`, the hygiene pack's
`conventions.md`, and `plugins:check` rule 11 in `scripts/src/check.ts` with its
test.
