---
role: site
name: TypeScript · Astro (SSR) · React
languages: [ typescript ]
optional_languages: []
frameworks: [ astro, react, effect ]
dependencies: [ tailwindcss, radix-ui, vitest ]
---

# Web (site) — TypeScript · Astro (SSR) · React

`web` is the public website: an [Astro](https://astro.build) **SSR** app (server
output on the Node adapter) with [React](https://react.dev) islands for the
interactive parts. Typical duties: share/preview pages with dynamic OG tags,
legal pages, and small account-facing flows.

A `site` calls someone else's API rather than publishing its own — SSR is not a
published API. A project that owns an API contract is `fullstack` instead.

This doc covers the **project axis** only; backing services and deploy target
are their own axes.

## Stack

- **Framework**: Astro `output: "server"` + `@astrojs/node` (standalone), file
  routes under `src/pages/` (`.astro` pages plus `.ts` SSR API endpoints); React
  via `@astrojs/react` only where interactivity demands it.
- **UI**: shadcn-style components — Radix UI primitives + Tailwind CSS with
  `class-variance-authority`/`clsx`/`tailwind-merge`, icons via `lucide-react`.
- **Effect in SSR**: a shared `AppLayer` (the common package's aggregate
  services layer merged with the telemetry layer over a fetch HTTP client);
  pages and endpoints run Effect programs against it.
- **Data flow**: read-only datastore access happens server-side **via the common
  package's layers** (never a vendor SDK import, never from the browser), typed
  by the common `schemas/*`. Writes and privileged actions belong to the
  `service` — the site reaches it through **same-origin SSR proxy endpoints**
  (server-to-server fetch relaying status/body, hiding the service host and
  avoiding CORS).
- **Layout**: `src/pages/` (routes), `src/components/` (+ `components/ui/`),
  `src/layouts/`, `src/lib/` (the layer + data readers), `_shared/` (config,
  runtime); middleware sets per-route cache policy.
- **Config**: Effect `Config` + `Schema`, fail-fast; secrets injected by
  whatever the backing axis names; environment-driven domains in
  `astro.config.mjs`.
- **Observability**: OpenTelemetry via Effect (enabled when the OTLP endpoint is
  configured).

## Testing

Vitest with a **jsdom** environment + Testing Library for the React islands; v8
coverage at 100% on an explicitly scoped include (`lib/`, `components/`, the SSR
endpoints), excluding `.astro` shells and the `ui/` primitives.
