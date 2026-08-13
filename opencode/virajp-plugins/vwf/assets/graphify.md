# Code Intelligence (graphify)

vwf uses the **graphify** CLI as its code-intelligence layer. When a repo
carries a knowledge graph (`graphify-out/graph.json` at the checkout root),
every codebase-*understanding* question — what exists, where something lives,
who calls what, what depends on what, does something like X already exist — goes
to the graph **first**; raw file reading is reserved for verification and for
the change itself. This keeps large surveys (a plan's actual-state read, a
reviewer's impact analysis, topology detection) out of brute-force Grep sweeps.

> **graphify is mandatory**, and the mandate is enforced at the **entry gate**,
> never mid-run. Two different things are being checked:
>
> - **The CLI** is a hard requirement. Missing → `vwf-doctor` §8 reports it as
>   **blocking**, and `/vwf-setup` and `vwf-execute` halt on it the way
>   `execute` already halts on a missing LSP.
> - **A graph is per-checkout**, and its absence *at a checkout root* is equally
>   blocking — `/vwf-setup` is what resolves it, behind consent.
>   In a `multi-repo` product that means **one graph per repo**, refreshed by
>   that repo's own hook, and the gate covers **every locally-present** repo: the
>   base and each member that is actually cloned here. An **absent** member is
>   not a finding — it is the recorded blind spot from the membership contract
>   (`%%AI_PLUGINS_ROOT%%/assets/membership.md`), and gating on a repo the user
>   declined to clone would halt a run they already consented to narrow.
>
> **A worktree with no local `graphify-out/` is not an absence.** Resolving to
> the main checkout's graph (see Worktrees) is the normal, expected path and is
> never reported. Were it treated as missing, every `execute` run would halt,
> since worktrees never carry a graph of their own.
>
> **Mid-run, still degrade rather than crash.** Once past the gate, a graph that
> turns out to be unreachable means falling back to direct Read/Grep/Glob — the
> gate exists so this is rare, not so a long-running pipeline dies in the
> middle. And **never build or update a graph mid-run** (`/graphify`,
> `graphify extract`, `graphify update` are long, LLM-driven builds). Only
> `/vwf-setup` builds graphs, behind explicit consent.

## How to query

Run from the directory that holds `graphify-out/` (the checkout root). In a
`multi-repo` product, that is **the repo holding the code you are asking
about** — every consumer here is already per-repo scoped, so a question about a
member's code is asked of that member's graph, never the base's:

```bash
graphify query "<natural-language question>"   # BFS — broad context
graphify query "<question>" --dfs              # DFS — trace one specific path
graphify query "<question>" --budget 1500      # cap the answer at N tokens
graphify path "<ConceptA>" "<ConceptB>"        # shortest connection between two nodes
graphify explain "<Node>"                      # plain-language explanation of one node
```

## The graph orients; the file verifies

Graph answers are **navigation, not evidence**. Any decision, plan step, or
finding that rests on exact code must be confirmed by reading the file the graph
points to — a cited location is always a `file:line` you read, never the graph's
word. Graph edges carry EXTRACTED/INFERRED/AMBIGUOUS provenance: treat INFERRED
and AMBIGUOUS as leads to check, not facts.

## Freshness — the graph is the last commit

The post-commit hook rebuilds the graph when code lands, so the graph reflects
the repo **as of the last commit**. Uncommitted work — the diff under review,
the coder's in-progress changes — is never in it. Read the diff and any files
you are changing directly; use the graph for the pre-change surroundings (call
sites, dependents, reuse candidates, entry points).

## Worktrees

vwf pipelines run in dedicated worktrees, where the untracked `graphify-out/`
usually does not exist. When the current checkout has no graph, resolve the
**main checkout** (`git rev-parse --git-common-dir` — its parent directory) and,
if that root holds `graphify-out/graph.json`, run the query from there. That
graph reflects the main checkout's last commit — treat it strictly as
**pre-change context**; nothing committed only in the worktree is in it. If
neither location has a graph, fall back to direct reads.
