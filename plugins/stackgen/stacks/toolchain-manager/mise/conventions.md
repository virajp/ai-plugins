# mise — the repo's toolchain manager

**One manager, one command surface.** mise does three jobs for this repo: it
**pins** the tool versions the repo runs on, **holds** the environment values
those tools and tasks read, and **runs** the repo's tasks. A repo with two task
runners has two vocabularies for the same commands, and only one of them is the
one anything else invokes.

**All of it lives under `.config/`.** mise resolves `MISE_ENV` variants there,
so the config never clutters the repo root.

**Five files, selected by `MISE_ENV`.** `mise.toml` always; `mise.dev.toml`
under `MISE_ENV=dev`; `mise.ci.toml` under `MISE_ENV=ci`, which covers both the
pipeline and the deployed runtime; `mise.test.toml` as a delta on dev under
`MISE_ENV=dev,test`; and `mise.local.toml`, which is never committed and never
shipped. mise loads the base first and deep-merges the active variants on top,
so a variant holds **deltas only**.

**A fresh checkout trusts nothing.** mise refuses to read a config file it has
not been told to trust, and the trust record is per machine, kept outside the
repo and never committed. So `mise trust --all`, run from the repo root, is the
first command a clone runs — before `setup:all`, and before `mise tasks` will
list the library at all. `--all` and not bare `mise trust`, which trusts one
file and leaves the rest of the split for the next command to fail on.

**Nothing is duplicated across layers.** A tool pinned twice is a version that
can disagree with itself, and the disagreement surfaces on someone else's
machine. Each tool, setting and env value goes in the lowest layer that needs
it: the base holds the runtime and anything the pipeline runs, dev holds the
tooling only a human needs, ci holds the pipeline's overrides.

**A tool CI runs belongs in the base.** `MISE_ENV=ci` never loads the dev file,
so a gate pinned there is a gate the pipeline cannot run. The dev file's job is
what a laptop needs and a runner does not.

**Latest, but never brand new; and CI resolves nothing.** Fuzzy pins defer any
release younger than `minimum_release_age`, and `lockfile = true` records what
they resolved to. The pipeline sets `locked = true` and installs from that
record. So moving a version forward is a deliberate act with a diff, and a
release nobody has run never reaches a build.

**Environment names are shared; values are split.** Development and production
override the *same* keys rather than each inventing their own — the difference
between the two layers is a value, never a vocabulary. Names here, values never
committed as secrets.

**Tasks are files, not inline strings.** Executable files under
`.config/mise/tasks/`, where the directory path *is* the task name:
`.config/mise/tasks/code/format` → `mise run code:format`. Inline `[tasks.*]`
TOML is reserved for trivial run-strings and `depends` aggregations. Every one
is bash, and every one passes the shell gates — the library has to run on a
runner that has no other shell.

**Three groups, and the first two are a contract.** `setup:*` is bootstrap and
re-sync, `code:*` is the gates and the git operations, `p:<project-id>:*` is one
project's own commands. `setup:all` is the one-command bootstrap; `code:all` is
the one-command gate; `setup:worktree` is the lighter sibling a fresh worktree
runs. Renaming one breaks every caller that never read this file — including
vwf, which probes for these names. `p:*` is the opposite: every name in it is
this repo's own, and nothing outside the repo may depend on one.

**Some tasks ship as slots, and a slot is visible.** A task whose name is part
of the contract but whose mechanism belongs to a stack nobody has pinned yet
carries a `#PLACEHOLDER` marker, announces itself, lists every other unfilled
slot in the repo, and **exits 0** — so an unconfigured repo can still run
`code:all` and `setup:all` end to end. A slot stops being one by being
**overwritten**, never by being edited in place.

**Hooks run before staging, not after.** `code:precommit` runs the hooks over
the working tree's changed files, so the rewrites they make fold into the commit
you were about to write. The merge tasks re-run them over everything as a safety
net and **fail** if anything changed — a fixup belongs on the branch that caused
it, never on a merge commit.

**The pipeline runs the identical task names.** CI installs mise, sets
`MISE_ENV=ci`, and calls `mise run code:all` — the same command a developer
runs. That is the whole point of the manager: a gate that passes locally and
fails in CI is a gate that ran a different command.

**This component gates nothing and defines no build.** What each gate *checks*
belongs to the gate components; the CI system's workflow syntax belongs to the
CI system; a language's build commands belong to that language — the tasks wrap
them rather than define them. A capability provider adds its tool and its env
defaults through `.config/mise/conf.d/<provider>.toml`, so this component's own
files never learn a provider's name.
