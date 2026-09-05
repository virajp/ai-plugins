# Decision — `/vwf:init` is thin; the packs own every file

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` (worktree
`.worktrees/2026-09-05-vwf-init`) · **Plan**
[`docs/plans/2026-09-05-vwf-init/`](../../plans/2026-09-05-vwf-init/index.md)

Mirrors the mempalace drawer (wing `claude-plugins`, room `decisions`).

This is the umbrella entry for the `/vwf:init` change. It records where the
doctrine was placed and why, and the rollout that follows. The five standing
decisions this plan **reversed** each have their own entry, linked at the
bottom.

## What was decided

A new `/vwf:init` bootstraps a brand-new repo, or reshapes an existing one, to
the standard layout — the sectioned ignore set, a lowercase `readme.md`, every
tool config under `.config/`, the toolchain manager's file split and its task
library, the repo gates, the hygiene files, a secrets provider, a licence.

**`init` names no technology.** Every file it lays down comes from a stackgen
pack; `init` decides *when* the packs land, *what* the user is asked, and how an
existing tree is reconciled against what they ship. It fetches three
**unconditional** bundles by fixed slug — `mise`, `repo-gates` and the new
`repo-hygiene` — plus whichever secrets provider the user picks.

`init` sets up the **base repo**; `/vwf:setup` sets up **vwf** in it. Setup's
Tooling step moved wholesale into `init`; setup now checks the shape (all three
slugs in the adapter's lockfile) and *offers* `/vwf:init` when it is missing,
which is why `init` is user- **and** model-invocable.

## Why here and not in vwf

The request was for a vwf skill carrying this doctrine. That is not where it
could go:

- The **2026-09-01 devtools dissolution** already placed the toolchain manager
  and the four gates in stackgen's unconditional bundles. Putting the payloads
  back in vwf reverses that decision, not just the fence.
- `/vwf:setup` already had a hard rule never to write those files by hand.
- Checker **rule 10** bans a vwf skill from prescribing a tool by name. A
  vwf-resident doctrine would need a rule-10 exemption — the guard turned off
  for exactly the file most likely to break it.

A `/stackgen:init` was the other candidate and was rejected because it leaves no
`/vwf:init`: the workflow's own entry point would live in the plugin a user may
not have pinned. So the orchestrator is vwf's, the payloads are stackgen's, and
the seam between them is the adapter contract that already existed.

## What it costs, stated plainly

`init` cannot verify that the pack it fetched fills the slot it was fetched for.
The secrets question filters the adapter's menu to the backing axis's capability
providers and asks which one **holds this repo's secrets**; an entry that turns
out to fill no secrets slot leaves the slot unfilled and announces itself,
exactly as a *none* answer would. That is the price of an orchestrator that
names no tool, and it is deliberate.

The three slugs are also a hard coupling: a repo whose adapter ships none of
them gets an empty plan that reads exactly like an already-shaped repo, which is
why `init` **halts** when no stack-adapter plugin is installed rather than
reporting nothing to do.

## Rollout (parked, in this order)

1. Release `stackgen` and `vwf`, then `claude plugin marketplace update` and
   `claude plugin update` on the maintainer's machine — or run the working tree
   earlier through `.dev-marketplace/`.
2. **Greenfield test:** the user runs `/vwf:init` on a new, empty repo for their
   website.
3. **Brownfield test:** a second plan runs `/vwf:init` on `claude-plugins`
   itself, written only after (2) has produced results. That plan also closes
   the dissolution plan's deferred item — this repo's own `.config/mise/tasks/`
   — and retires `i:*`, `site:*` and `plugins:*` into `p:*`.

Reshaping this repo is deliberately **not** in the plan that introduced `init`:
the tool proves itself on a repo with nothing to lose first.

## The five reversals

- [The charter fence opens for gate config files](./2026-09-05-charter-fence-opens-for-gate-configs.md)
- [`/vwf:readme` creates `readme.md`](./2026-09-05-readme-is-lowercase.md)
- [`merge:*` becomes `code:merge:*`](./2026-09-05-merge-tasks-move-under-code.md)
- [`worktree:init` becomes `setup:worktree`](./2026-09-05-worktree-init-becomes-setup-worktree.md)
- [The three-file mise split becomes five](./2026-09-05-mise-split-becomes-five-files.md)
