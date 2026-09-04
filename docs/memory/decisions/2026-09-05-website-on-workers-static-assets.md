# Decision — the website on Cloudflare Workers Static Assets

**Date** 2026-09-05 · **Branch** `develop` (worktree `2026-09-05-website`) ·
**Plan** `docs/plans/2026-09-05-website/` · **Reverses** the request's own
framing (Cloudflare Pages), not a prior repo decision.

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`).

## What was decided

- **Host: Cloudflare Workers Static Assets, not Pages.** `site/wrangler.jsonc`
  names `dist/`, a `404-page` fallback and the custom-domain route
  `claude-plugins.virajp.dev`; there is no Worker script.
- **Deploy is tag-driven.** The site is a third releasable project beside the
  plugins and the installer, versioned in `site/package.json` and released by
  `mise run site:release`, which cuts `site-v<version>` from `main`.
  `.github/workflows/site.yml` gates every change touching `site/**` and deploys
  only on that tag, after verifying it matches the package version and is
  reachable from `main`. A merge to `main` ships nothing.
- **The docs moved under `site/`.** `docs/plugins`, `docs/how-to` and
  `docs/installer` became `site/src/content/docs/{plugins,how-to,installer}`,
  and `docs/assets` became `site/public/brand/`. Every page gained frontmatter;
  the twelve links that left the trees became absolute GitHub URLs; a remark
  plugin resolves the rest to routes at build time and fails the build on one
  that escapes.
- **Dark-only blueprint design.** The design system and the landing and docs
  pages were authored in Claude Design first (project
  `bb1f0a69-4c72-4f0e-91fd-186a963b568b`); the site implements the chosen
  composite verbatim. No light mode.

## Alternatives rejected

- **Cloudflare Pages.** What the request named.
- **The dashboard's git integration.** Would deploy on push with no gate of the
  repo's own.
- **Deploy on every push to `main`.** Would ship a merge before anyone chose to,
  the opposite of how the plugins and the installer release.
- **`site/docs/`, `site/content/`, `site/src/assets/`** as the content home.

## Why

- **Cloudflare's own guidance.** Its best-practices page now steers new static
  sites to Workers Static Assets, and Astro's deploy guide targets Workers.
- **The repo's tag model.** `develop` takes the work and `main` is what users
  read, but only a namespaced tag ships anything — `<name>-v*` for a plugin,
  `installer-v*` for the CLI. `site-v*` keeps the website on the same rule, so a
  docs fix can land on `main` without deploying and the release stays a
  deliberate act with a GitHub Release beside it.
- **One authored docs tree.** The markdown under `site/src/content/docs/` is
  read by GitHub and built by Astro; nothing is copied or generated from it, so
  the "docs ship with the change" rule still names one place.
