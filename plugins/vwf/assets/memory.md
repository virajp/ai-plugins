# Memory Protocol

vwf keeps cross-session memory in **two stores that are always written
together**: the **mempalace** MCP server, and a **markdown tree on disk** under
`docs/memory/`. Each cycle recalls prior decisions and findings instead of
re-deriving them, and review findings are filed once and recalled on fix
loop-backs — so multi-round detail never piles up in the orchestrator's context.
The orchestrator resolves the scope and persists durable decisions; the execute
subagents persist and recall their own findings directly, so that detail
bypasses the orchestrator entirely.

## The two stores

**Every write goes to both.** The markdown tree is not a fallback that only
fills up during an outage — it is a continuous mirror, which is what makes
mempalace **optional** rather than required:

| Store         | Path                             | Strength                                             |
| ------------- | -------------------------------- | ---------------------------------------------------- |
| **mempalace** | the MCP server                   | semantic search across everything, ranked by meaning |
| **markdown**  | `docs/memory/<room>/<drawer>.md` | always present, greppable, survives without a daemon |

**Recall reads mempalace first**, because semantic search finds things a keyword
never would. When mempalace is unavailable, recall falls back to the markdown
tree — and that fallback is honestly weaker: **grep-quality, not semantic**. It
finds a drawer whose words you can guess, not one that merely means the same
thing. Say so when it happens rather than presenting a degraded recall as a
complete one.

**Writes never block.** If mempalace is unreachable, write the markdown side and
carry on — the reverse (markdown unwritable) is a real error, since it is the
durable half.

## The markdown tree

One directory per room, one file per drawer, mirroring the room vocabulary
exactly:

```text
docs/memory/
├── decisions/<drawer>.md
├── problems/<drawer>.md
├── planning/<drawer>.md
├── gaps/<drawer>.md
├── runs/<drawer>.md
├── doctor/<drawer>.md
└── handoff/<drawer>.md      # includes the reserved next.md
```

Each file opens with the same AAAK-style line the drawer carries, then the
detail. A drawer written to mempalace and a file written here are the **same
content**, so either store alone is enough to resume work.

### What is committed, and what is not

The split follows one rule: **commit what every contributor needs; leave out
what only one developer needs.**

| Room                                        | Git        | Why                                                 |
| ------------------------------------------- | ---------- | --------------------------------------------------- |
| `decisions`, `planning`, `gaps`, `problems` | committed  | Durable product knowledge the whole team works from |
| `handoff`, `doctor`, `runs`                 | gitignored | One developer's session state, machine, or run      |

`/vwf:setup` writes the `.gitignore` entries (`docs/memory/handoff/`,
`docs/memory/doctor/`, `docs/memory/runs/`) when they are missing, the same way
it adds the `docs/scratchpad/` line.

`doctor` is ignored because its findings are about *this machine's* toolchain,
not the repo. `runs` is ignored because an execute journal is one developer's
run record. Both still exist locally, and both still survive a mempalace outage
— they just do not enter anyone else's diff.

> **`/vwf:handoff` and `/vwf:recall` never skip.** The handoff *is* the
> deliverable, not a side memory. The reserved **`next`** handoff writes
> `docs/memory/handoff/next.md` unconditionally, alongside the drawer, so both
> surfaces always carry it — and always at the **main checkout** root, since a
> gitignored file written inside a worktree dies with it. (Before format 19 this file lived at
> `docs/handoffs/next.md` and was committed; it now sits in the ignored half,
> because a handoff is personal.)

## Scope (wing + room)

- **wing** — the current project. The orchestrator resolves it once: use
  `memory.wing` from `.config/vwf.yaml` when present (falling back to
  `product.name`); otherwise reuse the project's existing wing from
  `mempalace_status`, else the first write creates it) and passes it to every
  subagent it dispatches. Subagents never resolve the wing themselves — they use
  the wing they were given.
- **room** — a **closed set of seven**. `decisions` (design/architecture
  decisions + the *why*), `problems` (review/security findings + how they were
  resolved), `planning` (plan rationale and deferred options), `gaps`
  (blueprint/plan holes surfaced **during execution** + how they were
  reconciled, and out-of-scope points **parked during elicitation** — see
  below), `runs` (the **execute** run journal — dependency order and per-step
  progress, for resuming a paused run; see below), `doctor` (`/vwf:doctor`'s
  findings per run, so a later run reports a known one as **known** rather than
  rediscovering it), and `handoff` (session handoffs — the one room
  `/vwf:handoff` and `/vwf:recall` own).

  **Never invent an eighth.** mempalace creates a room implicitly on first
  write, so a mistyped name (`decision` for `decisions`) succeeds, returns no
  error, and every later recall against the real room comes back empty. That
  silence is why the set is closed and why `/vwf:doctor` checks it.

## Repo config — `mempalace.yaml`

**One product, one wing — and one config file per mined tree, at its root.**
`/vwf:setup` writes them; `/vwf:doctor` reports
a config sitting anywhere other than a repo root, or one naming a different
wing, as **blocking**. How many there are follows the topology:

| Topology | Configs |
| --- | --- |
| `repo`, `monorepo` | **exactly one**, at the repo root |
| `multi-repo`, `linkage: submodule` | **exactly one**, at the base repo root; members get **none** |
| `multi-repo`, `linkage: siblings` | **one per repo** — base and every member — all naming the **same wing** |

**The path is not a preference.** `mempalace mine` looks for `mempalace.yaml` in
the directory it is pointed at and nowhere else — no parent search, no
`.config/` convention, and the CLI has no flag to name one. A config anywhere
else is therefore **silently inert**: the mine still runs, reports that it found
no config and is using auto-detected defaults, and files everything into
`general`. Nothing errors, so the only symptom is recall coming back empty
months later.

**That mechanism is the whole reason siblings need one config each.** A sibling
member sits *outside* the base repo's tree, so a single config at the base would
mine the base alone — the blueprint and the `docs/memory/` mirror, and none of
the product's code. Silently, in exactly the way above. Submodule members are
*inside* that tree, which is why they still need none.

**One wing per product, regardless.** Every config names the same
`memory.wing` resolved above. Repos are not their own wings: recall would
otherwise have to guess which of several wings holds an answer, and vwf's own
rooms are product-wide by nature — a decision about the API contract is not a
`backend` fact. A member config naming a different wing is the failure this rule
exists to prevent, and `/vwf:doctor` blocks on it.

**Submodules are mined by the base repo, not excluded from it.** The walk
descends into every submodule directory, and each directory's own `.gitignore`
joins the active matchers as it goes (they apply in ancestor order), so a
submodule's ignores are honoured without a config of its own. A submodule path in
`exclude_patterns` is now a bug: it drops that project's files from the palace
entirely.

```yaml
wing: <memory.wing>
exclude_patterns: # secrets first, then trees not worth mining
  - .env*
  - "*.pem"
  - "*.key"
  - "*.p12"
  - "*credentials*"
  - "*secret*"
  - .doppler/
  - .git/
  - node_modules/
  - dist/
rooms:
  - name: handoff
    description: Session handoffs from docs/memory/handoff/
    keywords: [ handoff, handoffs, session ]
  - name: general
    description: Files that don't fit other rooms
    keywords: []
```

`exclude_patterns` takes gitignore syntax and survives for exactly two jobs: the
secret denylist below, and trees no one gains from mining (dependency
directories, build output). Never a submodule path.

**The rooms vwf requires.** Seed **all seven** protocol rooms — `decisions`,
`problems`, `planning`, `gaps`, `runs`, `doctor`, `handoff` — then add
path-derived rooms for what the product actually holds (`documentation`,
`testing`, `configuration`, …). Without the seed, the first write creates the
room implicitly, with no keywords, so a `mine` routes nothing to it and the room
only ever holds what vwf put there by hand.

**Room routing walks path parts outermost-first and returns on the first
match.** So a broad keyword shadows every narrower room beneath it: a
`documentation` room keyed on `docs` swallows `docs/memory/handoff/` before the
`handoff` room is ever tested. Key `documentation` on `documentation`,
`blueprint`, `plans`, `prompts` — never on the bare parent directory that
contains another room's path.

**Collisions merge — now inside the one file.** A path-derived room covers every
project at once, so one `documentation` room holds all of the product's docs.
That is right for `documentation` and harmless for `general`; it is misleading
where the same word means different things per project (a backend
`configuration` of `deploy/` versus a frontend `configuration` of `config/`) —
the single room then quietly mixes two subjects. Name those apart rather than
letting one keyword claim both. This is also the shape `/vwf:setup` meets when
it unions several pre-existing per-repo files into one: the **same room name
carrying two different descriptions is a question for the user**, never a silent
merge.

## Secrets — what must never be mined

Mining ingests file **contents** into a semantic index that agents query and
read back into context. A secret that reaches the palace is not merely stored:
it is retrievable, it re-surfaces in an unrelated recall months later, and
deleting the source file does not delete the drawer. Treat the palace as a
published surface.

Two layers, and **both** are required:

1. **`.gitignore` is the primary, and it already works.** Mining honours every
   `.gitignore` in the tree **by default** — so `.env` files, untracked scratch
   and local credentials stay out because the repo already maintains and reviews
   that denylist for its own reasons. **Never disable it** (there is a flag to;
   it exists for non-git trees, not for repos).
2. **A pattern denylist in `exclude_patterns` is the backstop** — the block
   above. It catches the one case `.gitignore` cannot: **a secret that was
   committed anyway**, which is by definition not ignored. It also covers a tree
   that is not git-backed at all, where there is no `.gitignore` to honour.

Neither alone is enough: `.gitignore` is blind to what is already tracked, and a
hand-written pattern list is blind to everything nobody thought to name.

**Mine the checkout itself** — never an export, a copy, or a temporary tree.
Every drawer records the `source_path` it came from, so mining a copy points
recall at paths that do not exist and breaks the prune pass, which matches
drawers against those same paths to drop what has been gitignored, deleted or
moved.

**Neither `/vwf:setup` nor `/vwf:doctor` scans for actual secrets.** They check
only that the patterns are *configured*. Detecting credentials in a repo is a
dedicated scanner's job, and the `devtools` plugin already ships that doctrine —
two tools scanning for credentials under different rules produces a false sense
of coverage, not more of it.

## Recall — before work

Before deriving anything, `mempalace_search` (or `mempalace_kg_query`) scoped to
wing + room with a natural-language query for the entity/slice, `limit` 3-5.
Hits are **context, not truth**: the blueprint/plan/conventions docs on disk
stay authoritative. Use recall to skip resolved questions and to check work
against prior findings — never to replace reading a doc you must follow exactly.

**When mempalace is unavailable**, grep `docs/memory/<room>/` for the same query
terms. State that recall was degraded — a keyword sweep will miss a drawer that
means the same thing in different words, and presenting it as a clean recall is
how a resolved question gets re-asked.

## Persist — durable only

Store only **durable** outcomes — decisions and their rationale, findings and
how they were resolved, flagged drift — never transient chatter or text a doc
already captures verbatim.

**Write both stores, every time:** `mempalace_add_drawer(wing, room, content)`
**and** `docs/memory/<room>/<drawer>.md` with the same content. The orchestrator
may additionally use `mempalace_kg_add` for an atomic fact that may later change
(and `mempalace_kg_invalidate` it when it does) — the knowledge graph has no
markdown counterpart, so it is the one part that is lost without the daemon.

If mempalace is unreachable, write the markdown side and proceed. If the
markdown write fails, that is a real error worth surfacing: it is the half that
survives.

Keep entries compressed in the spirit of AAAK — tight, one fact per line,
pipe-separated fields, ISO dates, importance ★1-5; skip the personal emotion
markers, these are technical memories. Example:

    DECISION 2026-06-21 ★4 | entity:order | embed line-items vs ref → embed
    — items immutable post-checkout, read-locality wins | alt ref rejected (no reuse)

## Findings memory — execute loop-backs

Each review/security subagent files its **full** findings to room `problems`,
tagged `<slice>/<stage>/<round>` (e.g. `order/review/2`), and returns only its
terse contract block plus that tag. The orchestrator presents the terse block at
the gate and, on a fix loop-back, hands the coder just the **tag** — not the
findings text. The coder recalls the tagged findings from mempalace, fixes them,
and the detail never enters the orchestrator's context. This is the core context
optimization: rich review detail lives in mempalace, not in the conversation.

## Gap memory — blueprint/plan holes surfaced during execution

A **gap** is distinct from a finding: a finding is wrong *code*; a gap is a hole
in the *blueprint or plan* that execution exposed — an underspecified behaviour
the coder had to guess, a plan step contradicted by the real code, a requirement
the blueprint never stated that review/security found missing. Gaps are captured
**as they surface**, never silently worked around.

Each stage subagent that hits a gap files its **full** gap detail to room
`gaps`, tagged `<slice>/gap/<round>` — what is under/mis-specified, where, and
the assumption it proceeded on — and surfaces only a terse one-line pointer in
its return block. The orchestrator mirrors that terse line into a durable
**"Gaps surfaced during execution"** section in the plan doc (the on-disk copy
that survives a mempalace outage), and at reconcile recalls the `gaps` room to
drive the blueprint/plan fixes. Because mempalace is skip-if-unavailable, the
plan-doc line is the source of truth when recall is empty; the `gaps` room and
`docs/memory/gaps/` carry the rich detail.

**Parked scope — out-of-scope points raised during elicitation.** The same room
also holds what a Q&A answer surfaces *beyond the current pass's scope* (per the
elicitation protocol's scope check): the orchestrator files the full point to
room `gaps`, tagged `<slice>/parked` — what was raised, why it is out of scope
now, and what pass it belongs to — and mirrors a terse line into the pass's
durable doc (the flow/entity doc's Open Questions, the plan's "Out of scope for
this cycle", the product doc's Risks & assumptions). Parked points ride the
existing recall paths: `blueprint` and `plan` already recall room `gaps` before
working and treat closing recalled gaps as a first-class goal of the pass — so a
scope change arriving in a fresh session finds the parked point instead of
losing it. Same fallback rule: the doc line survives a mempalace outage.

## Run journal — execute resumability (execute only)

`/vwf:execute` keeps a single drawer per plan in room `runs` (drawer =
`<plan>`): the result of the plan's `requires:` prerequisite check (each
prerequisite plan and whether it is satisfied), the dependency-ordered step
sequence and, per step, its status (pending/done), commit ref, review/security
round counts, and gap tags. The orchestrator writes it when it derives the order
and updates it as each step completes (`mempalace_add_drawer` then
`mempalace_update_drawer`). Because an autonomous run's primary pause is a
resource cap (`/vwf:handoff` → later `/vwf:recall next`), a resumed run reads
this journal to skip finished steps and pick up at the current one — without it,
resume would re-implement completed work. Skip silently if mempalace is
unavailable; the worktree's commits are the fallback record. This room is
execute-specific; blueprint/plan do not use it.
