# Code Intelligence (graphify)

vwf uses the **graphify** CLI as its code-intelligence layer. When a repo
carries a knowledge graph (`graphify-out/graph.json` at the workspace root),
every codebase-*understanding* question — what exists, where something lives,
who calls what, what depends on what, does something like X already exist — goes
to the graph **first**; raw file reading is reserved for verification and for
the change itself. This keeps large surveys (a plan's actual-state read, a
reviewer's impact analysis, topology detection) out of brute-force Grep sweeps.

> The `graphify` CLI is an installer-guaranteed dependency of vwf, but a **graph
> is per-repo**. If no graph is reachable (see Worktrees) or the CLI is missing,
> skip every graph step **silently** and fall back to direct Read/Grep/Glob —
> never block on it, and **never build or update a graph mid-run** (`/graphify`,
> `graphify extract`, `graphify update` are long, LLM-driven builds). Only
> `/vwf:setup` builds graphs, behind explicit consent.

## How to query

Run from the directory that holds `graphify-out/` (the workspace root):

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
