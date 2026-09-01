# mise — the repo's toolchain manager

**One manager, one command surface.** mise does three jobs for this repo: it
**pins** the tool versions the repo runs on, **holds** the environment values
those tools and tasks read, and **runs** the repo's tasks. A repo with two task
runners has two vocabularies for the same commands, and only one of them is the
one anything else invokes.

**All of it lives under `.config/`.** mise resolves `MISE_ENV` variants there,
so the config never clutters the repo root.

**Three files, selected by `MISE_ENV`.** `mise.toml` always; `mise.dev.toml`
under `MISE_ENV=dev`; `mise.ci.toml` under `MISE_ENV=ci`, which covers both the
pipeline and the deployed runtime. mise loads the base first and deep-merges the
active variant on top, so a variant holds **deltas only**.

**Nothing is duplicated across layers.** A tool pinned twice is a version that
can disagree with itself, and the disagreement surfaces on someone else's
machine. Each tool, setting and env value goes in the lowest layer that needs
it: the base holds the runtime, dev holds the tooling a human needs and a
pipeline does not, ci holds the pipeline's overrides.

**Environment names are shared; values are split.** Development and production
override the *same* keys rather than each inventing their own — the difference
between the two layers is a value, never a vocabulary. Names here, values never
committed as secrets.

**Tasks are files, not inline strings.** Executable files under
`.config/mise/tasks/`, where the directory path *is* the task name:
`.config/mise/tasks/code/format` → `mise run code:format`. Inline `[tasks.*]`
TOML is reserved for trivial run-strings and `depends` aggregations.

**The task names are a contract, not a convention.** `code:all` is the
one-command gate; `setup:all` is the one-command bootstrap; `worktree:init` is
the lighter sibling that a fresh worktree runs. Renaming one breaks every caller
that never read this file — including vwf, which probes for these names.

**Some tasks ship as slots, and a slot is visible.** A task whose name is part
of the contract but whose mechanism belongs to a stack nobody has pinned yet
carries a `#PLACEHOLDER` marker, announces itself, lists every other unfilled
slot in the repo, and **exits 0** — so an unconfigured repo can still run
`code:all` and `setup:all` end to end. A slot stops being one by being
**overwritten**, never by being edited in place.

**The pipeline runs the identical task names.** CI installs mise, sets
`MISE_ENV=ci`, and calls `mise run code:all` — the same command a developer
runs. That is the whole point of the manager: a gate that passes locally and
fails in CI is a gate that ran a different command.

**This component gates nothing and defines no build.** What each gate *checks*
belongs to the gate components; the CI system's workflow syntax belongs to the
CI system; a language's build commands belong to that language — the tasks wrap
them rather than define them.
