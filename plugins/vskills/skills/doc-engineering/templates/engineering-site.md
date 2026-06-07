# <Page / Route Group> — Site Engineering

> Replace `<site-framework>` and rendering terms with the project's stack from
> the architecture registry. Include only the capability sections the project
> declares (ssr/ssg, cms-content, seo, etc.).

## Pages & Routes

| Route | Dynamic Segments | Purpose |
| ----- | ---------------- | ------- |

## Content Model

<!-- What content/data each page displays. -->

## Data Sources

<!-- APIs, packages, or content sources each page reads (link to service/packages
docs). -->

## Rendering Strategy

<!-- Per-route: static / server-rendered / hybrid; revalidation; caching. Only
if the project declares ssr/ssg. -->

## Navigation & Linking

<!-- Internal links, dynamic route generation, how pages connect. -->

## Layout (regions, top → bottom)

<!-- The wireframe substitute: the page as ordered regions, each listing its
elements. Square brackets mark conditionally shown elements. -->

## Elements & Actions

| Element | Type | Content / Source | Event | Result |
| ------- | ---- | ---------------- | ----- | ------ |

## States

<!-- Every state the page can render: loading/SSR-pending, populated, empty,
error/404, auth-gated, offline. -->

| State | Trigger | What's shown | Available actions |
| ----- | ------- | ------------ | ----------------- |

## Forms

<!-- Only if the page has inputs. Note client vs server validation. -->

| Field | Type | Required | Validation | Default | Error copy |
| ----- | ---- | -------- | ---------- | ------- | ---------- |

## Interaction Flows

<!-- Numbered multi-step interactions: user action → system response →
resulting state. -->

## SEO

<!-- Meta tags, sitemap, structured data, canonical URLs per route. Only if the
project declares seo. -->
