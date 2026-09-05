# The mise task library

Once tasks grow past one-liners, drive everything through **executable task
files** under `.config/mise/tasks/`. mise turns nested directories into
colon-separated names: `.config/mise/tasks/code/format` →
`mise run code:format`. Discover them with `mise tasks`; reserve `[tasks.*]`
toml entries (like `init`) for trivial run-strings and `depends` aggregations.

**Three groups, and every task belongs to exactly one:**

| Group           | Is                                                                   |
| --------------- | -------------------------------------------------------------------- |
| `setup:*`       | bootstrap and re-sync — what a machine runs to be able to work here  |
| `code:*`        | the quality gates and the git operations — what a change runs through |
| `p:<id>:*`      | one project's own commands — what only that project has              |

The `setup:*` and `code:*` sets are a **contract**: the names are identical on
every repo, because the names are what the rest of the toolkit invokes. Only the
commands *inside* them change with the stack. `p:*` is the opposite — every
name in it is this repo's own.

This pack's `config/` payload ships the whole `setup:*` and `code:*` set, wired
to the contract below; the stack-divergent files arrive with the language,
package-manager and gate components, which materialize **after** this one and
overwrite at the same paths. **Author from what landed, not from scratch** — the
snippets here show the shape, the landed files are the source of truth.

## Task-file anatomy

```bash
#!/usr/bin/env bash

#MISE description="Check or format files"   # shown in `mise tasks`
#MISE hide=true                             # hide sub-tasks; aggregators stay visible
#MISE dir="{{ config_root }}"               # run from repo root, not the caller's cwd
#MISE depends=["init"]                      # ordering / fan-out

#USAGE flag "--fix"   help="apply fixes"    # arrives inside as $usage_fix ("true"/"false")
#USAGE arg "<branch>" help="what to merge"  # arrives inside as $usage_branch

set -euo pipefail
# shellcheck source=/dev/null
source "${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers"

print_header "Doing the thing ..."
```

- **Every task sources `helpers`** as its first real line, for uniform output.
- **Every task file is bash** — `#!/usr/bin/env bash`, `set -euo pipefail`, and
  clean under `shellcheck -x` and `shfmt -d -i 2 -ci`. The library is bash-only
  so it runs on CI runners that have no other shell, and the two gates are what
  keep it that way.
- **Every flag and every positional gets a `#USAGE` line.** That is what makes
  `mise run <task> --help` true, and it is where the value's name comes from:
  `--fix` arrives as `$usage_fix`, `<branch>` as `$usage_branch`. A flag read
  without a `#USAGE` line is always unset.
- The flag conventions are `--fix` (mutate rather than check), `--debug`
  (verbose), `--all` (widen the scope), `--frozen` (do not move the lockfile).
- Guard dev-only side effects (containers, emulators) with a `MISE_ENV` test so
  the identical task is a no-op in the pipeline. `MISE_ENV` is a comma list, so
  test for membership: `[[ ",${MISE_ENV:-}," == *",dev,"* ]]`.
- Every task file must land **executable (755)**. mise runs the file directly,
  so one without its exec bit fails as an *unknown task* rather than as a
  permission error. `mise run init` is what restores the bit.

## `_scripts/` — the libraries every task shares

`_scripts/` is underscore-prefixed, so mise treats it as **not a task
directory**. The files inside it are named without a second underscore: the
directory has already said they are libraries, and `_scripts/_helpers` says it
twice.

| File            | Is                                                            |
| --------------- | ------------------------------------------------------------- |
| `helpers`       | the print vocabulary — sourced by every task, always          |
| `helpers.mjs`   | the same vocabulary for Node tasks                            |
| `placeholder`   | what an unfilled slot prints                                  |
| `checks`        | the git predicates the merge tasks ask                        |
| `merge`         | the merge procedure both `code:merge:*` tasks run             |
| `<name>.env`    | a repo-specific value file, sourced rather than executed      |

`helpers`, `helpers.mjs` and `placeholder` ship with this pack; `checks` and
`merge` ship with it too, because the merge tasks are part of the contract. A
repo that grows a library of its own adds a sibling here rather than a directory
— `_scripts/helpers/` would make `helpers` a path and every `source` line in the
repo wrong at once.

### The print vocabulary

Styling constants (`BOLD`, `NORMAL`, and the `GREEN` / `YELLOW` / `RED` / `BLUE`
colours) plus:

| Helper              | Output                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `print_header`      | a full-width `=` rule, then the title — a major section         |
| `print_subheader`   | a full-width `-` rule, then the title — a step inside one       |
| `print_success`     | a green bold line, no rule                                      |
| `print_ok`          | green bold `OK`, for the end of a `print_wait` line             |
| `print_wait`        | yellow bold, no newline — an in-progress step                   |
| `print_warn`        | yellow bold line                                                |
| `print_yellow`      | plain yellow line (not bold)                                    |
| `print_error`       | red bold line, **to stderr**                                    |
| `print_newline`     | a blank line                                                    |
| `line_sep "<char>"` | a full-width rule of `<char>` (terminal width, else 80)         |

**The separators are baked into the two headers, not left to the caller.** Every
task that opened a section used to emit `line_sep "="` first, which made the
rule a convention half the tasks remembered — and a task that forgot it read as
part of the previous step. `line_sep` stays public for the rare case that wants
a rule with no title after it, and calling it before a header now prints two.

**A single-step task calls neither header.** A task that does one thing and
prints one line does not open a section; `print_wait` … `print_ok`, or one
`print_success`, is its whole vocabulary.

### Node tasks

A `.mjs` task imports from `helpers.mjs` instead of sourcing the bash file, and
prints identically. Its headers are the same directives behind `//`:

```js
#!/usr/bin/env node

//MISE description="Generate the API client from the schema"
//MISE hide=true
//USAGE flag "--check" help="fail instead of writing"

import { print_header, print_success, run } from "../_scripts/helpers.mjs";

print_header("Generating the client ...");
run("some-generator", ["--out", "src/generated"]);
print_success("Client generated.");
```

`run(cmd, args)` is the only thing the Node library adds: it inherits stdio and
exits the task with the command's status, which is what `set -e` does for free
on the bash side. **Keep the two libraries in step** — a printer added to one
and not the other is how the vocabularies drift, and the drift is invisible
until someone reads two tasks side by side.

## The mandatory set

| Task                                                  | Does                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `setup:all [--all] [--<id>…]`                         | the bootstrap orchestrator — the order below; `--<id>` per member           |
| `setup:mise`                                          | reshim, doctor, install, upgrade; formatter plugins and the linter if present |
| `setup:secrets`                                       | **slot** — the pinned secret manager's setup                                |
| `setup:external:{start,stop,pull}`                    | **slots** — local services; each a no-op outside a dev shell                |
| `setup:deps:all`                                      | `cleanup → install → upgrade → outdated → audit`                            |
| `setup:deps:{install,cleanup,upgrade,outdated,audit}` | **slots** — the package manager's verbs; `install` honours `--frozen`       |
| `setup:precommit`                                     | autoupdate, unset `core.hooksPath`, install the hooks                       |
| `setup:worktree`                                      | the lighter sibling a fresh worktree runs                                   |
| `code:all [--fix] [--debug]`                          | the one-command gate: `format → lint → sec`                                 |
| `code:format [--fix]`                                 | format or check; ships a real default                                       |
| `code:lint [--fix]`                                   | **slot** — the language's linter                                            |
| `code:sec`                                            | secret scan and vulnerability scan over the tree; ships a real default      |
| `code:precommit [--all]`                              | run the hooks over what you changed, **before** you stage                   |
| `code:git-config [--fix]`                             | reject identity and signing keys in the local git-config                    |
| `code:worktrees`                                      | list worktrees across the repo and its members                              |
| `code:merge:develop <branch>`                         | merge a feature branch into `develop` and push                              |
| `code:merge:main`                                     | merge `develop` into `main` and push                                        |
| `code:ai`                                             | install and reconcile this repo's agent plugins                             |

`code:all` is the one-command gate. `precommit`, `git-config`, `merge:*` and
`ai` are not in it — they are wired into the hooks, into `setup:all`, or run by
hand.

## Slots and their placeholders

A **slot** is a task whose name is part of the contract but whose mechanism
belongs to a stack nobody has pinned yet. It carries a `#PLACEHOLDER` marker,
sources `_scripts/placeholder`, and calls `placeholder_notice`. That prints the
reason, then greps the repo's own task tree for the marker and lists **every**
unconfigured task — a user who hits one slot will hit the rest, and one round of
setup answers all of them.

**A placeholder always exits 0.** An unconfigured repo has to be able to run
`code:all` and `setup:all` end to end: the docs a product is defined in get
formatted and gated from day one, and the unfilled slots announce themselves
rather than halting the aggregator that called them.

A slot stops being one by being **overwritten** — the overlay ships its own file
at the same path, marker and all gone. Nothing edits a placeholder in place, and
nothing fills one by hand: a repo that has picked no stack is *supposed* to see
the placeholder output.

**Formatting and security scanning have defaults; linting does not.** That looks
inconsistent and is deliberate. One formatter binary and two scanners that read
the repo as a *directory* say something true about a repo holding nothing but
markdown. Every linter worth running belongs to a language, and the one this
ecosystem uses for prose would drag a package manager into a docs-only repo.

## `setup/*` — bootstrap & upgrade

### The trust step, which comes before all of it

mise will not read a config file it has not been told to trust, and a fresh
checkout has told it nothing: the trust record is per machine, kept in mise's
own state outside the repo, and never committed. So the first command run in a
clone — or in a repo `/vwf:init` has just laid this payload into — is

```bash
mise trust --all
```

from the repo root. **`--all` is the form that matters.** Bare `mise trust`
trusts a single file, and this pack ships up to five config files plus whatever
`conf.d/*.toml` a capability provider added, so a bare run leaves the rest
untrusted and the next command fails on a different one.

What untrusted costs depends on mise's `paranoid` setting, and neither column
is a working repo:

| Setting                      | `mise run <task>`                 | `mise tasks`          |
| ---------------------------- | --------------------------------- | --------------------- |
| `paranoid = false` (default) | auto-trusts the config and runs   | **fails** — untrusted |
| `paranoid = true`            | **fails** — untrusted             | **fails** — untrusted |

Discovery is broken either way, which is what makes this the **first** failure
a newly initialized repo hits: `mise tasks` is how a human and an agent both
find out the task library exists, and `setup:mise` asks it through `have_task`
before deciding whether to run `setup:lint`.

Two ways to stop needing it per clone, both the machine's call and neither this
pack's to make: `trusted_config_paths` in the **global**
`~/.config/mise/config.toml` blanket-trusts a directory tree — mise ignores the
key in any non-global config, deliberately — and a pipeline can set the same.
**A CI runner checks out fresh and so trusts nothing**, so a workflow that
calls `mise run code:all` needs one of the two, or the CI parity rule buys
nothing. Trust is shared into linked worktrees from the main checkout, so
`setup:worktree` inherits it rather than asking again.

`setup:all` is **the entrypoint** a human runs — on clone, and to re-sync a
machine afterwards. It declares `#MISE depends=["init"]`, and it names no tool
at all, only the tasks it calls in order:

```text
setup:all  (--all recurses into every member)
  ├─ setup:mise            # reshim · doctor · install · upgrade   (common)
  ├─ setup:secrets         # the pinned secret manager             (SLOT)
  ├─ setup:external:start  # local services                        (SLOT)
  ├─ setup:deps:all        # the package manager's five verbs      (SLOTS)
  ├─ setup:precommit       # autoupdate + install the hooks        (common)
  ├─ code:ai               # install and reconcile agent plugins   (common)
  └─ <each member>         # only with --all
```

**Keep it idempotent: re-running `setup:all` must converge, never error.** It is
the re-sync command as much as the bootstrap one, so a step that only works on a
clean machine is a step that breaks the second run.

### Member flags

A repo with members — submodules, or projects the registry names — gets **one
flag per member** on top of `--all`, and the ids come from the same list the
`p:` group uses (see below):

```bash
#USAGE flag "--all" help="Also set up every member project"
#USAGE flag "--backend" help="Set up the backend project"
#USAGE flag "--frontend" help="Set up the frontend project"
```

Each member runs its **own** task library through `mise run --cd <path>
setup:all`, so a polyglot repo gets one library per project rather than one
library that knows every language. The short forms live in `[shell_alias]`, one
`setup-<id>` per member. **A single-project repo has no members and therefore no
flags beyond `--all`**, which is then a no-op — left in place because a caller
passes it without knowing the repo's shape.

### `setup/deps/*` — the package manager, and only that

Two sibling surfaces, kept apart because a repo routinely has one and not the
other in both directions:

- **`setup/deps/*`** — the language's **package manager**.
- **`setup/external/*`** — emulators, containers, local queues.

`deps/` is a folder rather than a file because a package manager has verbs, and
**all five ship as slots and all five run**:

| Task                  | Is                                                            |
| --------------------- | -------------------------------------------------------------- |
| `setup:deps:all`      | the aggregator `setup:all` calls                              |
| `setup:deps:install`  | install from the lockfile; `--frozen` refuses to resolve      |
| `setup:deps:cleanup`  | delete the installed tree and the cache, never the lockfile   |
| `setup:deps:upgrade`  | the one task allowed to move the lockfile forward             |
| `setup:deps:outdated` | report what has moved on, and exit 0 anyway                   |
| `setup:deps:audit`    | the manager's own advisory check over the resolved tree       |

**A package manager with no such verb fills the slot with an overlay that says
so and exits 0.** The absence is stated by the pack that knows, never inferred
from a task that happens not to exist — an inference that would read as "not
configured" for a manager which is configured perfectly well.

**The task path carries no tool name.** The overlay fills `setup:deps:install`
and the contract reads the same on every stack.

### `setup/external/*` — local services

`start`, `stop` and `pull` — `pull` fetches and builds, `start` boots. All three
are **local-only by definition**: the pipeline brings up whatever it needs
through its own service definitions, so each task exits 0 immediately outside a
dev shell rather than failing.

`setup:all` calls `start`, so one bootstrap leaves a developer able to run the
product. A repo with no external services leaves the three slots as shipped.

### `setup:worktree` — the lighter sibling

Members checked out, tools installed, secrets set up, `setup:deps:install
--frozen`. Nothing else: a fresh worktree shares the machine's tools and the
running services, so it needs its own dependencies and no tool upgrade, no hook
installation and no plugin reconciliation. `--frozen` on purpose — a worktree is
a place to work on a branch, not a place to move the lockfile.

**vwf's git-workflow probes for it by name** before falling back to `setup:all`,
so a repo without it silently takes the slower path.

## `code/*` — the gates and the git operations

### The pre-commit ordering, which is the point

`code:precommit` runs the hooks over the **working tree's** changed files —
staged and unstaged, plus untracked, minus deletions — and it is meant to run
**before you stage**:

```text
mise run code:precommit   →   git add …   →   git commit
```

The hooks rewrite files: a formatter reflows, a linter fixes. Run first and
those rewrites fold into the commit you were about to make. Run them from the
git hook after staging and you get a failed commit and a second "fix hooks"
commit that means nothing to anyone reading the history.

`code:precommit --all` is the wide form, and it is what the merge tasks use as a
**safety net**: `pre-commit run --all-files`, then the tree must still be clean.
A hook that has something to say at merge time means a commit went in without
one, and the merge **fails** rather than committing the fixup — the repair
belongs on the branch that caused it, not on a merge commit.

### The merge tasks

`code:merge:develop <branch>` names its source, because it is routinely run from
the worktree the work was done in and the branch you are standing on is not
always the one you mean to land. `code:merge:main` names nothing: only `develop`
reaches `main`.

The shared procedure is `_scripts/merge`; the predicates it asks are
`_scripts/checks`. In order: refuse a merge **from** `main`; refuse into `main`
from anywhere but `develop`; refuse a branch merging into itself; refuse when
you are already standing on the destination; then no untracked files, no
uncommitted changes, no unpushed commits, then the hook safety net. Only after
all of that does it touch git — hop to the main worktree if this is a linked
one, check out the destination, pull with tags, `git merge --no-ff --no-edit`,
`git push --follow-tags`, and return to where it started.

**A conflict leaves the tree mid-merge on purpose.** Aborting would discard the
one piece of information worth having — which files disagree — and resolving it
is a judgement call a task cannot make.

`--no-ff` is also on purpose: a fast-forward would leave the two branches as the
same commit with no record that a merge happened, and the merge commit is what
makes "what shipped" a question git can answer.

## `p:<id>:*` — one project's own commands

Everything that is not bootstrap and not a gate. `dev`, `build`, `test`, `e2e`,
`deploy`, a code generator, a data migration — the commands that exist because
of what this project *is*, and that no contract can name in advance.

**The `<id>` segment**, in order of preference:

1. the project's **registry id**, where `.config/vwf.yaml` names one;
2. otherwise the **sub-project directory name**;
3. for a single-project repo, the **repo's own name** — `p:claude-status:build`,
   not `p:app:build`. A repo that later becomes a member keeps working, and a
   task name never has to be re-learned because the repo grew.

Every id is the same one `setup:all`'s member flags and the `setup-<id>` shell
aliases use. One list, three surfaces.

**Every project gets a `_default` slot.** No pack can know a project's commands,
so `/vwf:init` creates `p/<id>/_default` as a `#PLACEHOLDER` that prints "no
project tasks yet" and exits 0 — the group is visible in `mise tasks` from the
first day, and filling it is authoring rather than discovering that it should
exist.

A worked example, for a project whose registry id is `site`:

```text
.config/mise/tasks/p/site/
  ├─ dev      # `#MISE description="Run the site's dev server"`
  └─ build    # `#MISE description="Build the site for production"`
```

```bash
#!/usr/bin/env bash

#MISE description="Run the site's dev server"
#MISE dir="{{ config_root }}/site"

#USAGE flag "--host" help="bind on the network rather than localhost"

set -euo pipefail
# shellcheck source=/dev/null
source "${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers"

print_header "Starting the dev server ..."
# … the project's own command
```

Real `p:` tasks are authored per repo — by hand, or by the stack generator for a
project whose framework has an obvious set. **A gate or a bootstrap step never
lives under `p:`**: if two projects would both have it, it belongs in `code:*`
or `setup:*` where the contract can name it.

## Legacy names

Names this contract replaced. `/vwf:init` reads this table to rename tasks on an
existing repo, which is why it lives here rather than in vwf — the renaming is a
fact about this task library, and vwf's prose names no tool. Apply the rows top
to bottom: no old name appears on the left twice, but a name a row *produces*
can be a later row's left-hand side — `setup:pnpm:update` becomes
`setup:deps:update`, then `setup:deps:upgrade`.

| Was                                                | Is now                | Why it moved                                                             |
| -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `worktree:init`                                     | → `setup:worktree`    | it is a bootstrap step; `worktree:` was a group of one                   |
| `merge:develop`, `merge:main`                       | → `code:merge:*`      | a merge is something a change runs through, like the gates               |
| `setup:pnpm:*`, `setup:uv:*`, `setup:app:*`         | → `setup:deps:*`      | the task path carried the tool's name, so the contract differed per stack |
| `setup:ai`                                          | → `code:ai`           | it is re-run as the plugin set moves, not once per machine               |
| `setup:doppler`                                     | → `setup:secrets`     | same reason as `setup:deps:*` — the provider is a choice, the slot is not |
| `setup:deps:{start,stop,pull}`                      | → `setup:external:*`  | services a product runs against are not its package manager             |
| `setup:deps:update`                                 | → `setup:deps:upgrade` | "update" read as both install-and-refresh; the verbs are now separate    |
| `_scripts/_helpers`                                 | → `_scripts/helpers`  | `_scripts/` already says library; the second underscore says it twice    |
| `_scripts/_checks`                                  | → `_scripts/checks`   | same reason — and it is a separate library, not part of `helpers`        |

A repo still carrying a left-hand name is not broken, but nothing else in the
toolkit will find it: vwf probes `setup:worktree`, the aggregators call
`setup:deps:*`, and `[shell_alias]` points at `code:*`.
