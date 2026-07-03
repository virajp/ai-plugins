# Web (site) — Reference Stack

`web` is the public website: an [Astro](https://astro.build) **SSR** app (server
output on the Node adapter) with [React](https://react.dev) islands for the
interactive parts, deployed as one Cloud Run service. Typical duties:
share/preview pages with dynamic OG tags, legal pages, and small account-facing
flows.

## Stack

- **Framework**: Astro `output: "server"` + `@astrojs/node` (standalone), file
  routes under `src/pages/` (`.astro` pages plus `.ts` SSR API endpoints); React
  via `@astrojs/react` only where interactivity demands it.
- **UI**: shadcn-style components — Radix UI primitives + Tailwind CSS with
  `class-variance-authority`/`clsx`/`tailwind-merge`, icons via `lucide-react`.
- **Effect in SSR**: a shared `AppLayer` (the common package's aggregate
  services layer merged with the telemetry layer over a fetch HTTP client);
  pages and endpoints run Effect programs against it.
- **Data flow**: read-only Firestore access happens server-side **via the common
  package's layers** (never a Firebase SDK import, never from the browser),
  typed by the common `schemas/*`. Writes and privileged actions belong to the
  `service` — the site reaches it through **same-origin SSR proxy endpoints**
  (server-to-server fetch relaying status/body, hiding the service host and
  avoiding CORS).
- **Layout**: `src/pages/` (routes), `src/components/` (+ `components/ui/`),
  `src/layouts/`, `src/lib/` (the layer + data readers), `_shared/` (config,
  runtime); middleware sets per-route cache policy.
- **Config**: Effect `Config` + `Schema`, fail-fast; Doppler-injected secrets;
  environment-driven domains in `astro.config.mjs`.
- **Observability**: OpenTelemetry via Effect (enabled when the OTLP endpoint is
  configured).

## Testing

Vitest with a **jsdom** environment + Testing Library for the React islands; v8
coverage at 100% on an explicitly scoped include (`lib/`, `components/`, the SSR
endpoints), excluding `.astro` shells and the `ui/` primitives.

## Deployment

The shared monorepo Dockerfile (`APP_NAME=web`) → Artifact Registry → Cloud Run,
tag-triggered through GitHub Actions. See the monorepo stack doc.
