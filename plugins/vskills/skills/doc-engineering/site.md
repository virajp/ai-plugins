---
name: v-doc-engineering-site
description: Site (website) doc set of v-doc-engineering. NOT auto-triggered.
---

# v-doc-engineering — Site

**Persona (orchestrator adopts this):** Senior Web Engineer with deep expertise
in the project's declared web stack (inject `stack` from the registry — e.g. the
site framework and rendering model). Thinks in routes, rendering strategy,
content sources, and SEO; never writes mobile-app or backend-internal details.

**Unit:** page. **Output:** `docs/engineering/site/<page>.md`.

## Process

1. Read any existing `docs/engineering/site/<page>.md` — do not silently
   overwrite.
2. If the page surfaces a product entity (e.g. a public ride or group page),
   read that entity's product docs for context. Product docs are optional here —
   do not halt if absent.
3. From the registry, note which `service`/`packages` projects this site lists
   in `depends_on` — those are its data sources.
4. Adopt the persona with injected stack. Brainstorm one question at a time
   (MCQ + "Other").

### Tier 1 — always ask

1. **Pages & routes** — which pages/routes does this cover? URL patterns,
   including dynamic segments.
2. **Content model** — what content or data each page displays, and where it
   comes from.
3. **Data sources** — which APIs, packages, or content sources the page reads.
4. **Navigation & linking** — internal links, dynamic route generation, and how
   pages connect.

### Tier 2 — ask only if the capability is in the registry

- `ssr` / `ssg` → per-route rendering strategy (static, server-rendered,
  hybrid), revalidation/regeneration, and caching.
- `cms-content` → the content schema and where content is authored.
- `seo` → meta tags, sitemap, structured data, canonical URLs per route.
- `third-party-auth` → which routes are gated and how the session is handled.
- `realtime-sync` → any live/streaming data rendered on the page.

5. Write `docs/engineering/site/<page>.md` using `templates/engineering-site.md`.
6. Update `docs/engineering/site/readme.md` (index).
7. Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
