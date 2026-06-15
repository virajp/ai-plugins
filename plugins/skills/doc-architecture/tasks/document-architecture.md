<purpose>
Create or update the one workspace-level `docs/architecture.md` — the source of
truth, written for two readers: a human engineer who needs the system's shape,
and the `doc-engineering` skill, which parses the machine-readable Project
Registry block to decide which doc set, stack vocabulary, and deep questions
apply to each project.
</purpose>

<user-story>
As an engineer, I want a single architecture doc with a machine-readable project
registry, so that humans understand the system's shape and downstream tooling
can parse each project's type, stack, and capabilities.
</user-story>

<when-to-use>
- Standing up the architecture doc for a workspace for the first time
- Recording a new project, stack, or capability in the registry
- Entry point routes here for any create-or-update of `docs/architecture.md`
</when-to-use>

## Doc Path

| Doc          | Path                                                        |
| ------------ | ----------------------------------------------------------- |
| Architecture | `docs/architecture.md`                                      |
| Template     | `.claude/skills/doc-architecture/templates/architecture.md` |

There is exactly one architecture doc per workspace. It describes every project.

## Topology

The orchestrator (your interactive session) adopts the persona and runs the
entire flow — elicitation and writing. No subagents: this skill is interactive
end-to-end and has no isolated review step. (This is deliberate; a subagent
cannot run an interactive multiple-choice elicitation.)

<steps>

<step name="session_model_check" priority="first">
State which model you are running as. If it is not Opus, alert the user: "This
skill is designed for Opus. You appear to be on `<model>`. Run `/model opus` and
re-invoke." Halt until the user confirms Opus or explicitly tells you to proceed
anyway.
</step>

<step name="setup_and_detect_mode">
1. Invoke `skills:git-workflow` — keep the worktree **local**, never push
   remotely.
2. **Detect mode.** If `docs/architecture.md` exists, read it fully — this is an
   update; preserve confirmed content and only fill or revise. If it does not
   exist, this is first creation.
</step>

<step name="elicit_system_level">
Adopt the Senior Systems Architect persona. Invoke `superpowers:brainstorming`
to elicit the content below. **Ask one question at a time. Every question must
offer multiple-choice answers, including an "Other (please specify)" option** —
even where the answer is open (stack, path), offer the common choices plus Other
so the user is never forced into unstructured free text.

Elicit the **system-level** content (prose):

- System overview — what the system is, its high-level shape, the cloud-hosted
  vs client-device split, and the shared-package strategy.
- How projects interconnect — who calls whom, the auth flow, the data flow.
- Hosting & deployment — where each project runs and how it ships.
  </step>

<step name="elicit_project_registry">
Elicit the **per-project registry** content. Enumerate the projects first, then
for each project gather:

- `name`
- `type` — one of: `service`, `worker`, `packages`, `site`, `frontend`
  (definitions below)
- `path` — repo or directory location
- `stack` — languages and frameworks (offer common per-type options + Other)
- `capabilities` — multi-select from the **Capability Vocabulary** below, plus
  Other. These gate the deep questions `doc-engineering` will ask.
- `depends_on` — other projects/packages it depends on (multi-select from the
  enumerated projects, plus None)
- `doc_unit` — `entity`, `page`, or `module` (default by type below)
  </step>

<step name="elicit_cross_cutting">
Elicit the **cross-cutting decisions** — one-line selections for system-wide
concerns. These are the inputs `doc-engineering`'s foundations mode expands into
canonical contracts. Record only the *decision* here (e.g. `auth:
firebase-id-token`), not the full spec. Ask one at a time (MCQ + "Other"), and
let the user mark a concern **not applicable** so it is omitted:

- `auth` — authentication mechanism (e.g. third-party ID token, JWT, session
  cookie, none)
- `errors` — error strategy (e.g. coded envelope, HTTP-status-only)
- `observability` — logging/metrics/tracing approach (or none)
- `config` — configuration & secrets approach (e.g. env vars, secrets manager)
- `testing` — testing strategy (or none)
- `integrations` — external services the system depends on (or none)

Capture these in the `cross_cutting` block of the registry and the matching
Cross-cutting Decisions prose table. Omit concerns the system does not have.
</step>

<step name="write_doc">
1. Write `docs/architecture.md` from `templates/architecture.md`. Fill the human
   prose sections from `elicit_system_level`, the `` ```yaml `` Project Registry
   block from `elicit_project_registry`, and the Cross-cutting Decisions table +
   `cross_cutting` registry block from `elicit_cross_cutting`. Keep the prose and
   the registry in sync — every project in the registry must be described in the
   prose and vice versa, and the cross-cutting table must match the
   `cross_cutting` block.
2. Mark anything genuinely unresolved with `<!-- TODO: needs input -->` rather
   than guessing.
3. When done, suggest:
   `commit changes, merge to default branch of main worktree, push changes,
   switch to main worktree & clean up additional worktree`
</step>

</steps>

## Project Types

| Type       | What it is                                 | Default `doc_unit` | Hosted on |
| ---------- | ------------------------------------------ | ------------------ | --------- |
| `service`  | API backend                                | `entity`           | cloud     |
| `worker`   | Background-task processor                  | `entity`           | cloud     |
| `packages` | Shared libraries used by others            | `module`           | n/a (lib) |
| `site`     | Website                                    | `page`             | cloud     |
| `frontend` | Client-side application (mobile apps only) | `entity`           | device    |

`service`, `worker`, `packages`, and `site` are cloud-hosted; `frontend` runs on
the client (browser, mobile device, or desktop) and ships through whatever
distribution channel the project uses (app store, web host, etc.).

## Capability Vocabulary

Capabilities are stack-agnostic feature flags. They are the gates that decide
which deep, stack-specific questions `doc-engineering` asks. Pick all that apply
per project; add Other for anything not listed. This list is extensible — add
new capabilities as the system grows.

- **Data & storage:** `document-datastore`, `relational-datastore`,
  `object-file-storage`, `cache-layer`, `search-index`
- **Async & messaging:** `durable-workflows`, `message-queue`, `pub-sub`,
  `scheduled-jobs`
- **Realtime & comms:** `realtime-sync`, `realtime-location`,
  `push-notifications`, `voice-audio`
- **Auth & identity:** `third-party-auth`, `custom-claims-rbac`
- **Commerce:** `payments-subscriptions`
- **Geo:** `maps-navigation`
- **Web rendering:** `ssr`, `ssg`, `cms-content`, `seo`
- **Mobile:** `offline-first`, `deep-linking`, `device-permissions`
- **Observability:** `distributed-tracing`

## Commit Message Format

Use conventional commits. Examples:

```text
docs(architecture): create system architecture doc
docs(architecture): add worker project to registry
docs(architecture): update service capabilities — add realtime-location
```

<output>
`docs/architecture.md` — the single workspace architecture doc, with human prose
sections and a machine-readable Project Registry `yaml` block kept in sync.
</output>

<acceptance-criteria>
- [ ] Session model confirmed as Opus (or user explicitly overrode)
- [ ] Mode detected (create vs update) and existing content preserved on update
- [ ] System-level prose elicited via one-at-a-time MCQ questions
- [ ] Every project has name, type, path, stack, capabilities, depends_on, doc_unit
- [ ] Cross-cutting decisions elicited; only applicable concerns recorded in the
      `cross_cutting` block and the matching prose table
- [ ] Prose and Project Registry are in sync — no project in one but not the other;
      cross-cutting table matches the `cross_cutting` block
- [ ] Unresolved items marked with `<!-- TODO: needs input -->`, not guessed
</acceptance-criteria>
