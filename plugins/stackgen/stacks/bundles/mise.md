---
name: mise
axis: repo
kind: toolchain-manager
unconditional: true
components:
- toolchain-manager/mise@1.0.0
---

# Repo — mise

The toolchain manager the repo runs on, doing three jobs at once: it **pins**
the tool versions everything else is executed under, it **holds** the
environment values those tools and tasks read, and it **runs** the repo's
tasks from a file-based library whose directory layout is a task's name.

**The config is a five-file split and the tasks are three groups.** The
layers are the base every environment loads, the development one, the CI
one, the test one — deltas layered on development rather than a fourth full
set — and a fifth, gitignored, for the values that are one machine's alone.
Nothing is pinned in two layers, because a tool pinned twice is a version
that can disagree with itself on somebody else's machine. The task library
is grouped `setup:*` (bring a checkout or a worktree to a working state),
`code:*` (the gates and the git procedures that run over the whole repo) and
`p:<project>:*` (one group per member of the repo, so a task's name says
which thing it acts on). The groups are the contract: every caller outside
this pack — the gates beneath it, the pipeline above it, vwf's own harness —
invokes a name from them.

**This is not a menu pick.** There is exactly one pack in this slot, and a
one-entry menu is theatre. The frontmatter carries `unconditional: true`, so
`stackgen-stack-menu` leaves this bundle out of the payload it returns and
`/vwf:init` fetches it by its **fixed slug** — `mise` — instead. Fixed,
never constructed: a name assembled from configuration is one that can
silently resolve to nothing, which is the rule the `ux-gate` and
design-adapter seams already follow.

The reason it is unconditional is that **the task names are the vocabulary
everything else invokes** — the gates beneath it, the CI pipeline above it,
and vwf's own harness capabilities. A repo that has picked no stack still
has to be able to run its gates by name, and a pack only reaches a repo when
someone picks a bundle. Nothing here needs a project axis or any stack
knowledge, so it materializes onto a blank repo.

Nothing is recorded in `.config/vwf.yaml` for it — nothing was chosen, so
there is no choice to record. The landing goes in `lock.yaml`, like any
other materialization. `repo.stack.template` is a different thing and stays
what it is: the elicited workspace and package-manager pin.

**Exactly one, and a polyglot repo materializes it once.** A repo with two
task runners has two vocabularies for the same commands, and only one of
them is the one anything else calls. The manager is what makes several
toolchains a single command surface.

**The seam with [Repo gates](repo-gates.md).** That bundle asserts each gate
*is* reachable at one task name and that CI runs the same names; this one
ships those tasks and the contract every task in the library follows. A gate
says "I am reachable at the security task name"; the manager is what makes
that true. Written in both places on purpose.

**The seam with [Repo hygiene](repo-hygiene.md).** This pack's own local
override file is not committed, and the line that keeps it out belongs to
the ignore set rather than here. Each writes one half: hygiene ignores the
patterns, this pack documents which of its files are meant to be ignored and
why.

**Every other pack overlays this one.** The library ships marked slots a
stack fills in — a lint task, a dependency install, a secrets step — and a
language, gate or provider pack lands its own version of that file over the
slot. This pack is therefore **first** in composition order, and a slot left
unfilled prints what it is waiting for and exits clean, so an empty slot is
visible rather than a task that silently does nothing.

A toolchain manager satisfies no vwf harness capability — it is what the
harness tasks are run *by*. What it contributes is the `repo`-axis fact that
the task names exist at all.
