# vwf — Spec → Plan → Execute for Claude Code

`vwf` is the flagship plugin of the `virajp-plugins` marketplace — an
opinionated workflow that turns a vague feature request into shipped, reviewed
code through three disciplined phases:

1. **Spec** — keep an always-current blueprint of the *whole product*.
2. **Plan** — diff the spec against the real code for one slice, and write the
   delta to apply.
3. **Execute** — implement the plan under strict TDD, then run code review and
   security review behind approval gates.

You drive it with slash commands. Claude does the work, asks one question at a
time, and never writes until you approve.

The same marketplace also ships a handful of
**[supporting plugins](#supporting-plugins)** (coding-standard skills + language
servers) and a **[statusline](#statusline)** — all installable through one CLI,
[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins).

## Caveats

`vwf` is deliberately heavyweight. Know what you're signing up for before
adopting it.

**Model & cost**

- **Built for Opus with the 1M context window.** Every command runs on `opus`,
  and the orchestrator holds a lot at once — the spec, the plan, the registry,
  and each subagent's output. Run Claude Code on Opus with the
  **1-million-token** context (`claude-opus-4-8[1m]`); a smaller model or the
  standard window will degrade or overflow on a real cycle.
- **High token cost.** opus everywhere, and each `execute` cycle spawns several
  subagents (coder, code review, security review) with fix loop-backs. Expect a
  meaningful spend per slice — this is not a cheap workflow.

**Dependencies**

- **Hard external prerequisites.** `rtk` and `graphify` must be on your `PATH` —
  the `rtk hook claude` Bash hook fails without `rtk`. Dependency
  auto-install/enable needs Claude Code ≥ 2.1.143. See
  [Prerequisites](#prerequisites).
- **Memory degrades silently.** `vwf` recalls and persists through `mempalace`.
  If it's unavailable, every memory step is skipped by design — no error, but
  cross-cycle recall is lost (surfaced gaps still survive in the plan doc).
- **Leans on review engines.** `execute`'s code- and security-review stages run
  on the `/code-review` and `/security-review` engines.

**Fit**

- **High-touch, not autonomous.** It asks one question at a time and stops at a
  mandatory approval gate at every stage. It never runs end to end on its own —
  plan for an interactive session.
- **Requires a testable project.** `execute` enforces non-negotiable TDD and a
  coverage gate. A project without a test runner and coverage tooling won't fit
  the execute stage.
- **Assumes a registry-described workspace.** `plan` and `execute` map each
  slice to a project in the architecture registry and read its code (submodules
  included). You model the codebase with `/vwf:architecture` first; it won't
  operate on an ad-hoc folder.
- **Solo / small-team focus.** It is highly opinionated — one workflow, one set
  of conventions. Great for a solo dev or small team; not a configurable
  framework for a large org.

## Prerequisites

`vwf` shells out to a few external tools. Install them first — the installer
checks for each and prints the exact command for anything missing.

| Tool            | Why                                      | Install                               |
| --------------- | ---------------------------------------- | ------------------------------------- |
| mise            | resolves the toolchain                   | `brew install mise`                   |
| node + pnpm     | `context7` MCP server; the npm→pnpm hook | `mise use -g node@latest pnpm@latest` |
| Claude Code CLI | hosts the commands                       | `mise use -g claude-code@latest`      |
| rtk             | the `rtk hook claude` Bash hook          | `brew install --formulae rtk`         |
| graphify        | knowledge graph the commands rely on     | `mise use -g pipx:graphifyy@latest`   |

`vwf` also depends on three plugins — `context7`, `markdown`, and `mempalace` —
all resolved from the same `virajp-plugins` marketplace. Claude Code
**auto-installs and auto-enables** them when you enable `vwf` (requires Claude
Code ≥ 2.1.143).

## Install

```sh
# Installs vwf + its plugin dependencies, and wires up graphify
pnpx @askviraj/ai-plugins --plugin vwf
```

Installing outside a git repo? Add `--skip-graphify` to bypass graphify's
repo-scoped setup:

```sh
pnpx @askviraj/ai-plugins --plugin vwf --skip-graphify
```

Restart Claude Code afterward so the commands, hooks, and dependencies load.
(The examples here use `pnpx`; if you don't use `pnpm`, swap in `npx`.)

## The mental model

The three phases map to three questions:

- **Spec** answers *what should the whole product be?* — permanent,
  product-wide, organized by entity.
- **Plan** answers *what changes for this one slice, and in what order?* — a
  diff, not a re-spec, scoped to a single entity or section.
- **Execute** answers *is it built, correct, and safe?* — TDD, then review.

```mermaid
flowchart TD
    A["1 · /vwf:architecture"] --> B["2 · /vwf:spec"]
    B --> C["3 · /vwf:plan"]
    C --> D["4 · /vwf:execute"]
    D --> E["5 · /vwf:archive"]
    D -. "spec/plan gaps" .-> B
    D -. "spec/plan gaps" .-> C
```

`architecture` runs once to bootstrap; then you loop
`spec → plan → execute →
archive` per slice. When execution exposes a hole in
the spec or plan, `vwf` captures it and loops back to fix the source — never
silently working around it.

## The documents it maintains

`vwf` keeps everything in version-controlled Markdown under `docs/`. The spec is
the desired state; the plans are the changes you apply to reach it.

```text
docs/
├── specs/                       # the always-current blueprint (desired state)
│   ├── architecture.md          # system shape + machine-readable Project Registry
│   ├── conventions.md           # cross-cutting decisions (auth, errors, …)
│   └── <entity>.md              # one doc per entity (or an <entity>/ folder)
└── plans/                       # per-cycle plans (the diff to apply)
    ├── <date>-<time>-<slice>.md
    └── archived/                # retired, completed plans
```

Each entity doc holds the full-stack picture for that entity — stable product
intent at the top, volatile engineering detail (data model, API, jobs, screens)
below a marker. The **Project Registry** in `architecture.md` is a yaml block
that `spec` and `plan` parse to map an entity's sections to the right project by
`type` — so the workflow stays stack-agnostic.

## Commands

| Command               | Model  | What it does                                              |
| --------------------- | ------ | --------------------------------------------------------- |
| `/vwf:architecture`   | opus   | Bootstrap or update the system shape + Project Registry   |
| `/vwf:spec [entity]`  | opus   | Maintain the full-product blueprint, one doc per entity   |
| `/vwf:plan [slice]`   | opus   | Write a reviewable cycle plan — a diff of spec vs code    |
| `/vwf:execute [mode]` | opus   | Implement the plan under TDD, then code + security review |
| `/vwf:archive [plan]` | sonnet | Retire a completed plan into `docs/plans/archived/`       |
| `/vwf:handoff <name>` | opus   | Capture the session so work resumes in a fresh one        |
| `/vwf:recall <name>`  | sonnet | Resume from a handoff in a fresh session                  |
| `/vwf:git-workflow`   | —      | Internal — worktree isolation, commits, merges            |

### /vwf:architecture

Run this **first**. It elicits your system's shape — projects, their types and
stacks, how they interconnect, where they deploy — and writes
`docs/specs/architecture.md`, including the machine-readable Project Registry
the other commands depend on. Re-run it any time the topology changes; it asks
only about genuine deltas, never re-eliciting what's confirmed.

This is the one doc that *does* name technologies and infrastructure — the spec
deliberately doesn't.

### /vwf:spec

Maintain the desired end state of the **whole product**, one entity at a time:

```text
/vwf:spec order
```

`spec` reads the registry, works out which engineering surfaces apply to the
entity (data model, API, jobs, screens), and elicits the gaps with you. It then
writes `docs/specs/order.md` and updates `conventions.md` for any cross-cutting
decision raised.

A fresh **reviewer subagent** then checks the doc against a completeness
checklist and returns `NO GAPS` or a numbered list. Gaps loop back to you for
the specific open decisions, then re-review — until the doc passes. The spec is
permanent and product-wide; it is never feature-scoped.

### /vwf:plan

Produce a reviewable plan for one slice of the spec:

```text
/vwf:plan order
/vwf:plan order/api      # just one section of the entity
```

A plan is a **diff**. `plan` reads the desired state (the spec slice +
conventions + registry) and the actual state (the real code the registry maps
the slice to), then writes only the delta — what exists, what's missing, what
changes, and the order to do it in — to `docs/plans/<date>-<time>-<slice>.md`.
Steps are ordered for TDD: each names the failing test that defines "done". If
the spec implies a surface the code lacks, `plan` flags it as drift rather than
quietly resolving it. You approve the plan before any code is written.

### /vwf:execute

Implement an approved plan. Execution is mechanical from the plan, but strict:

```text
/vwf:execute            # full pipeline from the start
/vwf:execute review     # jump to a stage (the prior stage must be complete)
```

It runs three stages, each in a fresh purpose-built subagent, each behind a
**mandatory approval gate**:

| Stage    | Model  | What happens                                                                |
| -------- | ------ | --------------------------------------------------------------------------- |
| code     | sonnet | Implements the plan under TDD (RED → GREEN → REFACTOR) to the coverage gate |
| review   | opus   | Adversarial code review against the plan, spec, conventions, and stack      |
| security | opus   | Threat-models the change against the project's declared capabilities        |

```mermaid
flowchart TD
    C["code — TDD, coverage gate"] --> G1{"approve"}
    G1 -->|yes| R["review — code review"]
    G1 -->|findings| C
    R --> G2{"approve"}
    G2 -->|yes| S["security — security review"]
    G2 -->|findings| C
    S --> G3{"approve"}
    G3 -->|yes| RC["reconcile + merge"]
    G3 -->|findings| C
```

`vwf` never chains stages automatically — it pauses for your approval at every
gate. Review and security findings loop back to `code` to fix, then re-review.
When a stage exposes a **gap** (a hole in the spec or plan, not a code bug),
it's recorded — to the plan doc and to memory — and reconciled at the end of the
cycle, where `vwf` offers to fix the spec (`/vwf:spec`) or re-derive the plan
(`/vwf:plan`). It then reconciles the architecture registry and offers to
archive the plan.

### /vwf:archive

Move a finished plan out of the active set into `docs/plans/archived/`. It never
deletes. Run it manually, or accept the offer at the end of `execute`.

```text
/vwf:archive
```

### /vwf:handoff and /vwf:recall

Long sessions lose fidelity. When the context window grows **beyond ~60%**,
capture the session so a fresh one can continue:

```text
/vwf:handoff auth-refactor      # write a handoff, file it to memory
```

`handoff` writes a structured handoff document — goal, current state, key
decisions, open next steps, and (when there's a clear next action) a
ready-to-paste **next prompt** — and stores it in mempalace under your project.
In a new session:

```text
/vwf:recall auth-refactor       # rebuild context, then optionally run the next prompt
```

`recall` retrieves the handoff, reads the files it points to, summarizes where
you left off, and offers to run the captured next prompt. If mempalace is
unavailable, `handoff` falls back to `docs/handoffs/<name>.md` and `recall`
reads it from there.

### /vwf:git-workflow

Internal — you rarely invoke it directly. The other commands route **all** git
actions through it: it isolates work in a git worktree (never the main
checkout), commits with conventional messages, and merges. It never pushes
without your explicit request.

## How it asks questions

`vwf` is deliberately conversational. `architecture`, `spec`, and `plan` share
one **elicitation protocol**:

- **Explore first** — read the docs, code, and recent commits before asking
  anything; never ask what the registry or code already answers.
- **One decision per round** — multiple-choice with an "Other" escape hatch;
  each answer shapes the next question.
- **Only real decisions** — if exactly one idiomatic answer exists, it proceeds
  without asking. It never guesses an open decision — it records it instead.
- **Propose 2–3 approaches** — with trade-offs and a recommendation, before
  settling a direction.
- **Hard gate** — it presents the shape and waits for your approval before
  writing anything, however small the change looks.

## Memory

`vwf` uses the `mempalace` plugin as cross-session memory so each cycle builds
on the last instead of re-deriving it. It recalls prior decisions and findings
before working, and persists durable outcomes after. Memory is keyed by your
project (the **wing**) and split into rooms:

| Room        | Holds                                                      |
| ----------- | ---------------------------------------------------------- |
| `decisions` | design/architecture decisions and the *why*                |
| `problems`  | review and security findings and how they were resolved    |
| `planning`  | plan rationale and deferred options                        |
| `gaps`      | spec/plan holes surfaced during execution, and their fixes |
| `handoff`   | session handoffs for `/vwf:handoff` and `/vwf:recall`      |

Memory is best-effort: if mempalace is unavailable, `vwf` skips every memory
step and proceeds. Gaps are also mirrored into the plan doc, so they survive a
memory outage. See **[docs/mempalace.md](./docs/mempalace.md)**.

## A worked walkthrough

A first slice, end to end. Assume a backend service with an `order` entity.

```text
# 1. Bootstrap the system shape and registry (once per workspace)
/vwf:architecture

# 2. Specify the order entity — answer the questions, approve the doc
/vwf:spec order
#    → writes docs/specs/order.md, gated by the completeness reviewer

# 3. Plan the first slice — review the diff, approve it
/vwf:plan order
#    → writes docs/plans/2026-06-26-1430-order.md (TDD-ordered steps)

# 4. Execute — approve at each gate
/vwf:execute
#    → code (TDD) → [approve] → review → [approve] → security → [approve]
#    → reconcile registry + any gaps → merge via git-workflow

# 5. Archive the completed plan
/vwf:archive
```

From here, loop steps 2–5 per slice. Update the spec when the product changes;
re-run `architecture` only when the system's *shape* changes.

## vwf skills

Two skills back the workflow's quality. You don't invoke them directly — they
inform how Claude writes and reviews:

- **`karpathy-guidelines`** — behavioral rules that reduce common LLM coding
  mistakes: think before coding, keep changes surgical, surface assumptions,
  define verifiable success criteria.
- **`rest-api-design`** — technology-agnostic REST API principles (versioning,
  error formats, pagination, auth, OpenAPI), applied whenever the spec or plan
  touches an API surface.

## Tips

- **Run `architecture` first.** `spec` and `plan` halt without a registry.
- **Keep slices small.** One entity or one section per plan/execute cycle keeps
  reviews sharp and the diff reviewable.
- **Trust the gates.** Read what each stage reports before approving — the
  approval is the point, not a formality.
- **Hand off early.** A handoff written at 60% context is worth far more than
  one squeezed out at 95%.

---

## Supporting plugins

The marketplace ships additional plugins — opinionated coding-standard skills
and language servers. Most auto-apply by file path; install only the ones for
your stack. Each has a dedicated guide:

| Plugin                                 | What it provides                                                                                          | Install               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------- |
| **[markdown](./docs/markdown.md)**     | Always-on Markdown/documentation standards (auto-applies to `**/*.md`)                                    | `--plugin markdown`   |
| **[typescript](./docs/typescript.md)** | Effect-TS coding standards (7 skills) + the TypeScript/JavaScript language server                         | `--plugin typescript` |
| **[flutter](./docs/flutter.md)**       | Flutter/Dart (GetX) standards (8 skills) + bundled Dart/Kotlin/Swift language servers; **project-scoped** | `--plugin flutter`    |
| **[mise](./docs/mise.md)**             | mise standards (the `.config/` three-file split + task library) + a `/mise:scaffold` command              | `--plugin mise`       |
| **[context7](./docs/context7.md)**     | The Context7 MCP server — up-to-date library docs on demand                                               | `--plugin context7`   |
| **[mempalace](./docs/mempalace.md)**   | AI memory system (external; also a `vwf` dependency)                                                      | `--plugin mempalace`  |

```sh
pnpx @askviraj/ai-plugins --plugin typescript --plugin markdown
```

## Statusline

A standalone, powerline-style statusline (main two-line bar + subagent panel),
fully data-driven from JSON and themeable across three config layers (defaults →
`~/.config/statusline.json` → `<repo-root>/.config/statusline.json`). It
installs through the same CLI — not the plugin marketplace — copying the script
to `~/.claude/scripts/` and writing the chosen key(s) into
`~/.claude/settings.json`. Requires a [Nerd Font](https://www.nerdfonts.com/).

```sh
# install both surfaces (or use --statusline / --subagentstatusline individually)
pnpx @askviraj/ai-plugins --statusline --subagentstatusline
```

See **[docs/statusline.md](./docs/statusline.md)** for setup and the full
configuration reference.

## The installer CLI

[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins)
drives the Claude Code CLI: it adds the `virajp-plugins` marketplace
(user-scoped) and installs each plugin at its scope. It only ever registers and
refreshes `virajp-plugins` — every plugin resolves from it alone.

```sh
# Everything (user-scoped plugins + statusline)
pnpx @askviraj/ai-plugins --all

# All user-scoped plugins, no statusline
pnpx @askviraj/ai-plugins --plugins

# Specific plugins (repeatable; the only way to install a project-scoped one)
pnpx @askviraj/ai-plugins --plugin vwf --plugin flutter

# Versions: CLI, statusline, and each plugin's installed-vs-latest (with scope)
pnpx @askviraj/ai-plugins --version

# Upgrade installed plugins + refresh the statusline
pnpx @askviraj/ai-plugins --upgrade

# Idempotent install + upgrade — safe to drop in a setup script
pnpx @askviraj/ai-plugins --all --upgrade

# Uninstall (mirrors the install flags)
pnpx @askviraj/ai-plugins --uninstall --plugin vwf
pnpx @askviraj/ai-plugins --uninstall --all
```

Notes:

- The bulk flags (`--all` / `--plugins`) act on **user-scoped** plugins only.
  `flutter` is **project-scoped** — install it explicitly with
  `--plugin flutter` from within the project that needs it.
- `--scope user|project` overrides a plugin's default scope; the marketplace add
  is always user-scoped.
- The installer **checks every required external tool** for what you're
  installing and prints the install command for anything missing — it never
  installs a dependency for you.

## Credits & acknowledgements

This project is a thin layer over a lot of excellent work. It would not exist —
or would be far poorer — without these. Thank you to their authors and
maintainers. 🙏

- **[Claude Code](https://claude.ai/code)** by
  [Anthropic](https://anthropic.com) — the host these plugins, hooks, and
  statusline plug into.
- **[MemPalace](https://github.com/MemPalace/mempalace)** — the AI memory system
  that powers `vwf`'s cross-session recall (re-listed here as a dependency).
- **[Context7](https://github.com/upstash/context7)** by
  [Upstash](https://upstash.com) — the MCP docs server behind the `context7`
  plugin.
- **[mise](https://mise.jdx.dev/)** by Jeff Dickey — resolves the toolchain the
  plugins and hooks depend on.
- **[pnpm](https://pnpm.io/)** — the package manager the `npm→pnpm` hook and
  `context7` rely on.
- **[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)**,
  the **[Dart SDK](https://dart.dev/)**,
  **[kotlin-lsp](https://github.com/Kotlin/kotlin-lsp)**, and
  **[SourceKit-LSP](https://github.com/swiftlang/sourcekit-lsp)** — the engines
  behind the language-server plugins.
- **[rtk](https://github.com/rtk-ai/rtk) (Rust Token Killer)** — the
  token-saving proxy `vwf`'s Bash hook shells out to (installed via
  `brew install --formulae rtk`).
- **[graphify](https://github.com/safishamsi/graphify)** — the knowledge-graph
  tool `vwf` integrates with.
- **[oclif](https://oclif.io/)** — the framework this installer CLI is built on.
- **[Nerd Fonts](https://www.nerdfonts.com/)** — the glyphs that make the
  statusline render, and the **[Gruvbox](https://github.com/morhetz/gruvbox)**
  palette it ships by default.
