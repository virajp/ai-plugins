# Decisions — onboarding this repo as a vwf product (WS4)

**Date** 2026-08-23 · **Branch** `main` (worked in place, deliberately — see
below) · **Plan** `docs/plans/plugin-support/04-onboard-this-repo.md`

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

## The marketplace was pointing at the retired render tree

Found at Step 0 and worth recording because it invalidated the session that
would otherwise have run: `~/.claude/settings.json` registered `virajp-plugins`
as a **directory** source at `~/.local/share/virajp/ai-plugins/claude` — the
renderer output directory this repo deleted when it moved to one authored tree.
It was 8 days stale: 13 plugins instead of 15 (no `claude-code`, no `stackgen`),
vwf at blueprint-format **22** against the repo's **23**, and neither
`claude-code-plugin` nor `typescript-parseargs-cli` present.

Onboarding against it would have exempted the two `plugin` projects from the
coverage condition format 23 exists to impose — the exact thing WS3 landed for.
Re-pointed at the repo itself (`claude plugin marketplace add <repo path>`), so
the working tree is now what the plugins run from. That is the right long-term
wiring for this repo specifically: it dogfoods edits without a publish step.

**The orphaned render tree at `~/.local/share/virajp/ai-plugins/` was left in
place.** Nothing references it; removing it is a separate, consented step.

## Two projects, not WS4's three

| Project     | Role / platforms        | Path       | Project pin                |
| ----------- | ----------------------- | ---------- | -------------------------- |
| `plugins`   | `system` / `[ plugin ]` | `plugins/` | `claude-code-plugin`       |
| `installer` | `frontend` / `[ cli ]`  | `cli/`     | `typescript-parseargs-cli` |

WS4 specified **three**, splitting `vwf` out from `plugins` on the grounds that
it is roughly the size of the other fourteen together and that folding it in
makes every `plugins` flow ambiguous about which plugin it describes. Overridden
in favour of two. **WS4's plan doc still says three and needs reconciling.**

Both roles are forced rather than chosen: `plugin` appears only under `system`
in the role/platform table, `cli` only under `frontend`.

`scripts/` gets no project entry — repo tooling belongs to the repo axis, per
WS4 and the `cli` template's own rule. It remains a pnpm workspace member.

## The repo axis had no honest pin, so a template was written

The closed repo-axis menu offered `pnpm-turbo` and `bun` only. This repo is
pnpm, so `bun` was out; but `pnpm-turbo` declares `tools: [turborepo, …]` and
describes a workspace globbing `projects/*` and `packages/*` with Turborepo
orchestrating builds — and this repo has no `turbo.json`, globs `cli` and
`scripts` flat, and orchestrates through mise tasks.

Rather than pin a template that overstates the repo, a third was authored:
**`pnpm-workspace`** (`feat(typescript)`, `b24a947`) — a pnpm workspace whose
task runner is the only orchestration. The hole is general, not local: it bites
any pnpm repo that skipped Turborepo.

This is the dogfooding working as intended, and it happened before the blueprint
sweep rather than during it.

## Other pins

`installer` deploy → `npm-package`. `plugins` takes **no** deploy pin (`n/a`) —
a plugin is served from the marketplace on `main`, never deployed. Neither
project has a backing axis (`[]`): no datastore, no identity, no queue.

`languages`: `plugins` → `[ markdown, bash ]` (bash is the template's
`optional_languages`, and the hook scripts are real); `installer` →
`[ typescript ]`.

## No screen platform anywhere

`plugin` has no screens and `cli` is a terminal surface, so `ui: false`.
`/vwf:design-system` will take its **text-only Terminal UX** path — no canvas,
no mockups, no `docs/scratchpad/` render tree — and `/vwf:screens` and
`/vwf:mockups` do not apply to this product at all. Recorded in the CLAUDE.md
vwf section so it is not re-litigated.

## Harness recorded as absent, deliberately

Every capability is `false`. `e2e_local` is genuinely runnable — four commands —
but has **no single task name**, and pointing the config at a task that does not
exist would fail doctor's own task-name check. Recording it absent is the honest
state, and `/vwf:plan` injects the bootstrap when a cycle first needs one. A
`mise run e2e:local` wrapper is the obvious fix and is left as a recommendation
rather than built, because setup builds nothing.

`local_stack` is legitimately none: no backing services, so no Docker. The
harness contract explicitly allows this.

## Worked in the main checkout, not a worktree

A departure from `/vwf:git-workflow`'s core rule, taken knowingly. The
marketplace is a **directory source pointing at this checkout**, so a template
authored in a worktree is invisible to the running plugin — `/vwf:architecture`
would query the typescript menu and not see `pnpm-workspace`. Dogfooding via a
directory source and worktree isolation are in genuine tension; for this repo,
while it is the source of its own plugins, the directory source wins.
