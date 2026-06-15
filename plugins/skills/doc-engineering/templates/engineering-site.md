# Site Engineering Template

Engineering contract for one page or route group. Save as
`docs/engineering/site/{page}.md`.

> Replace `{site-framework}` and rendering terms with the project's stack from
> the architecture registry. Include only the capability sections the project
> declares (ssr/ssg, cms-content, seo, etc.). Auth-gated states link to
> `../foundations/auth.md` — don't restate the auth flow.

```template
# {Page} — Site Engineering

> Built on `{site-framework}`. Auth-gated routes link to
> `../foundations/auth.md`. Include only the capability sections this project
> declares.

## Pages & Routes

| Route | Dynamic Segments | Purpose |
| ----- | ---------------- | ------- |
| [route] | [segments] | [purpose] |

## Content Model

[What content/data each page displays.]

## Data Sources

[APIs, packages, or content sources each page reads — link to service/packages
docs.]

## Rendering Strategy

[Per-route: static / server-rendered / hybrid; revalidation; caching. Only if
the project declares ssr/ssg.]

## Navigation & Linking

[Internal links, dynamic route generation, how pages connect.]

## Layout (regions, top → bottom)

[The wireframe substitute: the page as ordered regions, each listing its
elements. Square brackets mark conditionally shown elements.]

## Elements & Actions

| Element | Type | Content / Source | Event | Result |
| ------- | ---- | ---------------- | ----- | ------ |
| [element] | [type] | [source] | [event] | [result] |

## States

> Every state the page can render: loading/SSR-pending, populated, empty,
> error/404, auth-gated, offline.

| State | Trigger | What's shown | Available actions |
| ----- | ------- | ------------ | ----------------- |
| [state] | [trigger] | [what's shown] | [actions] |

## Forms

> Only if the page has inputs. Note client vs server validation.

| Field | Type | Required | Validation | Default | Error copy |
| ----- | ---- | -------- | ---------- | ------- | ---------- |
| [field] | [type] | [yes/no] | [validation] | [default] | [error copy] |

## Interaction Flows

1. [user action] → [system response] → [resulting state]

## SEO

[Meta tags, sitemap, structured data, canonical URLs per route. Only if the
project declares seo.]
```

## Field Documentation

| Field                                                           | Convention | Description                                                     |
| --------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `{page}`                                                        | variable   | Page or route-group name, used in the heading and the doc path. |
| `{site-framework}`                                              | variable   | The web framework from the project `stack` (e.g. Next.js).      |
| `[route]` / `[element]` / `[state]` / `[field]`                 | prose      | Table row content.                                              |
| `[Content Model]` / `[Data Sources]` / `[Navigation & Linking]` | prose      | Section bodies as described below.                              |

## Section Specifications

| Section                              | Required                         | Guidance                                                                                                                            |
| ------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pages & Routes                       | Always                           | One row per route, with dynamic segments.                                                                                           |
| Content Model / Data Sources         | Always                           | What each page shows and where the data comes from (link to service/packages docs).                                                 |
| Rendering Strategy                   | If `ssr`/`ssg`                   | Per-route strategy, revalidation, caching. Omit otherwise.                                                                          |
| Navigation & Linking                 | Always                           | How pages connect; dynamic route generation.                                                                                        |
| Layout / Elements & Actions / States | Always                           | The programmable spec — every element gets an event/result; every state a trigger. Auth-gated states link to `foundations/auth.md`. |
| Forms                                | If inputs exist                  | One row per field; note client vs server validation.                                                                                |
| Interaction Flows                    | If multi-step interactions exist | Numbered: action → response → state.                                                                                                |
| SEO                                  | If `seo` declared                | Meta tags, sitemap, structured data, canonical URLs. Omit otherwise.                                                                |
