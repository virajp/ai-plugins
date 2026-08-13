# Code Intelligence — graphify (§8)

Read this before running §8. **Two of its four checks are blocking** — a missing
CLI and a graph absent from both checkouts — so this section is never skipped,
whatever the run's project scope.

Per `%%AI_PLUGINS_ROOT%%/assets/graphify.md`, graphify is vwf's
code-intelligence layer: `plan`'s surveyor, the code/security reviewers, the
coder, `architecture`, `feedback` and docs-sync all orient graph-first. graphify
is **mandatory**, so the first two checks below are **blocking** and the last
two remain **degradations**. Check:

- **The `graphify` CLI on `PATH`.** Missing → **blocking**, remedy
  `mise use -g pipx:graphifyy@latest` (the double-`y` is the real package name,
  not a typo). This is *missing*, not *unavailable* — there is a command to
  suggest. Its Python/uv toolchain is a prerequisite of that remedy, not a
  separate finding.
- **A graph at each checkout root** (`graphify-out/graph.json`). Resolve it the
  way the asset does: current checkout first, then the **main checkout** via
  `git rev-parse --git-common-dir`. Absent in **both** → **blocking**, remedy
  `/vwf-setup` (the only command that builds one, behind consent). A worktree
  that resolves to the main checkout's graph is **not** a finding — that is the
  normal path, and reporting it would halt every `execute` run, since worktrees
  never carry a graph of their own.

  In a **`multi-repo`** product, run this check once per **locally-present**
  repo — the base and each cloned member — since a graph is per checkout and
  every consumer asks its question of the repo holding the code. An **absent**
  member is **not** a finding: it is the blind spot the membership contract
  already recorded (`%%AI_PLUGINS_ROOT%%/assets/membership.md`), and blocking on a
  repo the user declined to clone would halt a run they consented to narrow.
- **The post-commit refresh hook** (`graphify hook install`), in each
  locally-present repo. Without it the graph freezes at whatever commit last
  rebuilt it and silently decays into wrong answers — worse than no graph,
  because nothing signals staleness.
- **Staleness.** Compare `graph.json`'s mtime to the last commit date of the
  checkout that holds it. Behind → report how far, with `graphify update` as the
  remedy for the user to run.

**Never build or refresh a graph.** `/graphify`, `graphify extract` and
`graphify update` are long, LLM-driven builds; the asset reserves them for
`/vwf-setup` behind explicit consent. Doctor reports and stops — offering to run
one here would turn a read-only check into a multi-minute job nobody asked for.
