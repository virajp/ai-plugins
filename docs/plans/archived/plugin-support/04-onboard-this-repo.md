# WS4: Build this repo as a vwf product

Full scope: `setup` → `product` → `architecture` → `design-system` →
`blueprint`, until `blueprint.coverage: complete`, after which `/vwf:plan` and
`/vwf:execute` work against this repo like any other product.

> **Status (2026-08-23): `/vwf:setup` is done** (`f6fb407`); `/vwf:product` is
> next. Two decisions below changed at setup time and are marked in place — the
> registry is **two** projects, not three, and the repo axis pins
> `pnpm-workspace`, not `pnpm-turbo`. Rationale for both:
> `docs/memory/decisions/2026-08-23-onboard-this-repo-as-a-vwf-product.md`.

**Run the workflow; do not hand-author the tree.** Every doc below is the output
of a skill that elicits its own decisions and is gated by its own reviewer
subagent. Hand-writing them produces a tree that passes no gate.

## Prerequisite

WS3 must have landed. Without the `plugin` doc shape, `blueprint` has nothing to
say about the plugin projects; without `claude-code-plugin` and
`typescript-parseargs-cli`, `architecture` hands back an empty stack menu for
both projects and `doctor` blocks on an unknown language.

**This prerequisite bit in practice.** At setup time the `virajp-plugins`
marketplace was still a directory source pointing at the retired render tree —
13 plugins, vwf at blueprint-format 22, and neither template present. Re-pointed
at this repo before the chain ran; see the decisions record.

WS1 and WS2 should also have landed, so the registry describes the repo as it
will be rather than as it was.

## The registry

**Two projects** (changed at setup time from the three this plan first
specified):

| Project     | Role / platforms        | Path                |
| ----------- | ----------------------- | ------------------- |
| `plugins`   | `system` / `[ plugin ]` | `plugins/` (all 15) |
| `installer` | `frontend` / `[ cli ]`  | `cli/`              |

Neither role is a judgment call: the platform vocabulary offers `plugin` only
under `system` and `cli` only under `frontend`.

`scripts/` and `.config/mise/tasks/` get **no project entry** — they are the
repo's own tooling, and the `cli` template's own rule is that a repo's task
runner is tooling, not a project. They belong to the repo axis.

This plan originally split `vwf` out from `plugins`, on the grounds that it is
the flagship and roughly the size of the other fourteen together, and that
folding it in would make every `plugins` flow ambiguous about which plugin it
describes. **Overruled at setup time in favour of two projects.** The ambiguity
argument is real and the blueprint sweep will have to carry it — a `plugins`
flow must name which plugin it describes, since the project no longer does.

## What already conforms

The repo is running vwf's conventions by hand already, and `setup` should
recognize these rather than rewrite them:

- `mempalace.yaml` at the root, with the closed seven-room set.
- `docs/memory/{decisions,handoff,runs}/`.
- `docs/plans/` with the `<date>-<slice>` naming.
- `.graphifyignore` and a built graph.
- The `.config/` mise three-file split.
- A `CLAUDE.md` (which gains the vwf section).

## The chain

1. **`/vwf:setup`** (`onboard` mode) — stamps `.config/vwf.yaml`, writes the
   CLAUDE.md vwf section, bootstraps `environment.md` if the registry declares
   an integration, runs `doctor`, commits.
2. **`/vwf:product`** — `product.md`. The material exists: `readme.md` and
   `CLAUDE.md` already state the problem, the users and the north star. Goals
   get `#goal-<slug>` anchors, and **every goal must be `Serves:`-linked by a
   flow** — the one coverage condition with no `N/A` escape, and the reason WS3
   had to happen first.
3. **`/vwf:architecture`** — derivation mode from `product.md`, corrected by
   MCQ. Writes `registry.yaml` + `architecture.md`; stack pins land in
   `.config/vwf.yaml`:

   | Axis                | Pin                        |
   | ------------------- | -------------------------- |
   | `installer` project | `typescript-parseargs-cli` |
   | `plugins` project   | `claude-code-plugin`       |
   | `installer` deploy  | `npm-package`              |
   | repo                | `pnpm-workspace`           |

   `plugins` takes no deploy pin (`n/a`) — a plugin is served from `main`, not
   deployed.

   **The repo pin changed from `pnpm-turbo`.** That template declares
   `tools: [turborepo, …]` and describes a workspace globbing `projects/*` and
   `packages/*`; this repo has no `turbo.json`, globs `cli` and `scripts` flat,
   and orchestrates through mise tasks. The closed menu had no honest fit, so
   `pnpm-workspace` was authored in the `typescript` plugin (`b24a947`) — a pnpm
   workspace whose task runner is the only orchestration. First real find of the
   dogfooding, and it arrived before the sweep rather than during it.
4. **`/vwf:design-system`** — Terminal UX only, via the text-only path added in
   WS3. Output shape, color semantics, error format and exit codes for the
   installer. The `report.ts` / `progress.ts` behavior is the existing contract
   to write down.
5. **`/vwf:blueprint`** — the sweep. **Flows are extension points**: one per vwf
   workflow skill, one per installer command (`--all`, `--user`, `--project`,
   `--uninstall`, `--version`). **Entities are the artifacts with real
   lifecycles and schemas** — `.config/vwf.yaml`, `registry.yaml`,
   `marketplace.json`, the install receipt, `stackgen/lock.yaml`. Runs until
   coverage and the coherence review both hold, then stamps
   `blueprint.coverage: complete`.
6. **`/vwf:doctor`** — clean, then `/vwf:plan` and `/vwf:execute` are usable.

Expect step 5 to be the long one, and to surface holes in WS3's
`plugin-contract.md` bar — that feedback is the point of dogfooding it here
first.

## The harness

Recorded in `.config/vwf.yaml` per `assets/harness.md`:

| Capability    | Task                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| `e2e_local`   | `plugins:marketplace --check && plugins:check && vitest run && typescript:test` |
| `local_stack` | none — no backing services, so no Docker (explicitly allowed)                   |
| `dev`         | n/a                                                                             |
| `health`      | n/a                                                                             |
| `screenshots` | n/a                                                                             |

**Recorded as `false`, not as that command string.** The `e2e_local` gate is
four commands with no single task name, and the config records a *task name*
that `/vwf:doctor` verifies exists — so pointing it at a composite would fail
the very check the key is there for. It is recorded absent, which is what
`/vwf:plan` expects (it injects the bootstrap when a cycle first needs one).
Adding a `mise run e2e:local` wrapper is the fix and is left to a cycle; setup
builds nothing.

`/vwf:verify` in `production` mode maps to: does
`pnpx @askviraj/ai-plugins@latest --all` work against `main`.

## Retire the local duplicates

| Artifact                            | Disposition                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/plugin-authoring/`  | Deleted in WS3 — promoted into `claude-code`                                                                                                   |
| `.claude/agents/docs-reconciler.md` | Delete. `/vwf:docs-sync` + `docs-sync-surveyor` do the same job with wider scope; delete once one `docs-sync` run over a real change proves it |
| `.claude/agents/target-verifier.md` | **Keep.** It proves the marketplace against the real `claude` CLI hermetically, which vwf's acceptance verifier does not cover                 |
| `.claude/skills/installer-cli/`     | Keep — repo-specific, no vwf equivalent                                                                                                        |
| `.claude/skills/release/`           | Keep — repo-specific, no vwf equivalent                                                                                                        |

## Verification

- `/vwf:doctor` reports no **blocking** findings — in particular no
  `unknown language` for `markdown`, which is the check WS3's template claim
  exists to satisfy.
- `.config/vwf.yaml` reads `blueprint.coverage: complete`.
- `/vwf:plan` on one slice produces a plan doc without halting — the end-to-end
  proof that a `plugin` project is plannable.
- One `/vwf:execute` run over a small plugin change reaches its final human gate
  with the acceptance stage green against the `e2e_local` task above, and
  `RENDERED: n/a` on the UX stage rather than a failure.
