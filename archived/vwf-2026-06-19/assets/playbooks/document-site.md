<purpose>
Document one page of a `site` (website) project: read context, elicit the page's
routes, content, and programmable interaction spec through tiered questions, and
write the site engineering doc.
</purpose>

<user-story>
As a web engineer, I want a buildable spec for a site's page, so that the team can
implement its routes, content, states, and interactions without a wireframe.
</user-story>

<when-to-use>
- Documenting a `site` (website) project's page during the pipeline's author
  phase of the `/vwf:engineering` command
- The architecture registry lists the project as `type: site`
</when-to-use>

**Persona:** Senior Web Engineer with deep expertise in the project's declared
web stack (inject `stack` from the registry — e.g. the site framework and
rendering model). Thinks in routes, rendering strategy, content sources, and
SEO; never writes mobile-app or backend-internal details.

**Unit:** page. **Output:** `docs/engineering/site/<page>.md`.

<steps>

<step name="read_context" priority="first">
Read any existing `docs/engineering/site/<page>.md` — do not silently overwrite.
If the page surfaces a product entity (e.g. a public ride or group page), read
that entity's product docs for context. Product docs are optional here — do not
halt if absent. From the registry, note which `service`/`packages` projects this
site lists in `depends_on` — those are its data sources.
</step>

<step name="elicit_spec">
These are the questions for the pipeline's **audit + clarify** phases. The audit
subagent surfaces the applicable ones (Tier 1 always; Tier 2 only if the
capability is in the registry) and frames multi-valued ones as options; the
orchestrator asks them in batches. The author subagent (this persona, injected
stack) writes the answers — pre-filled from the Codebase Map where unambiguous.

### Tier 1 — always ask

1. **Pages & routes** — which pages/routes does this cover? URL patterns,
   including dynamic segments.
2. **Content model** — what content or data each page displays, and where it
   comes from.
3. **Data sources** — which APIs, packages, or content sources the page reads.
4. **Navigation & linking** — internal links, dynamic route generation, and how
   pages connect.

### Tier 1 — per page (programmable interaction spec)

For **every** page, walk these so it can be built without a wireframe (same
discipline as a mobile screen):

5. **Layout regions** — the page top-to-bottom as ordered regions, and the
   elements in each region.
6. **Elements & actions** — for every interactive element (link, button, form
   control, filter): its type, content/source, the event (click / submit / input
   / scroll), and the result (navigate / submit form / call API / reveal).
7. **States** — every state the page can render (loading/SSR-pending, populated,
   empty, error/404, and any auth-gated or offline states), the trigger, what's
   shown, and available actions.
8. **Forms** — if the page has inputs: per field, type, required, validation,
   default, and error copy. Note client vs server validation.
9. **Interaction flows** — numbered sequences for multi-step interactions
   (search-as-you-type, paginated load, multi-step submit): user action → system
   response → resulting state.

### Tier 2 — ask only if the capability is in the registry

- `ssr` / `ssg` → per-route rendering strategy (static, server-rendered,
  hybrid), revalidation/regeneration, and caching.
- `cms-content` → the content schema and where content is authored.
- `seo` → meta tags, sitemap, structured data, canonical URLs per route.
- `third-party-auth` → which routes are gated and how the session is handled.
  Link auth-gated states to `foundations/auth.md` rather than restating the
  flow.
- `realtime-sync` → any live/streaming data rendered on the page.
  </step>

<step name="write_doc">
Write `docs/engineering/site/<page>.md` using `${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-site.md`.

Update `docs/engineering/site/readme.md` (index).
</step>

</steps>

> Review is centralized: the pipeline's **verify** phase runs the Ralph reviewer
> on the written docs and the orchestrator applies the per-unit approval gate.
> The reviewer should flag any page with an unhandled state (e.g. missing
> 404/empty) or an interactive element with no defined event/result.

<output>
`docs/engineering/site/<page>.md` — the page's buildable spec (routes, content
model, data sources, navigation, layout regions, elements & actions, states,
forms, interaction flows) — plus an updated site index, passing the Ralph
reviewer.
</output>

<acceptance-criteria>
- [ ] Existing doc read; not silently overwritten
- [ ] Surfaced product entity docs read where present (optional, not halting)
- [ ] `depends_on` data sources noted from the registry
- [ ] Tier 1 always-ask and per-page interaction-spec questions answered
- [ ] Tier 2 asked only for declared capabilities
- [ ] Doc written from `${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-site.md`
- [ ] Site index updated
- [ ] Review delegated to the pipeline's verify phase (unhandled states / event-less elements flagged there)
</acceptance-criteria>
