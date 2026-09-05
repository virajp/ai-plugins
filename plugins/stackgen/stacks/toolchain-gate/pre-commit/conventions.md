# pre-commit — the local gate, and gate wiring

## The gate

**Hooks call the repo's task library; they never inline a command.** This is the
parity guarantee, and it is the reason this component owns the wiring topic. A
hook that inlines its command is a second definition of that gate, and the two
drift the first time one is edited — after which local and CI disagree and the
gate is worse than absent, because it is trusted.

**`files:` scopes every hook** so it fires only for what it validates. An
unscoped hook runs the formatter over a commit that touched one YAML file, and a
gate people wait on is a gate people bypass.

**Revs are pinned and updated deliberately.** An unpinned rev means the gate's
behaviour changes without a commit, and the change lands on whoever pulls next.

**Never bypass a red gate.** The gate found something or it is broken; both need
answering, and neither is answered by skipping it.

## Gate wiring & CI parity

**Every gate is reachable as exactly one task name, and CI runs those same task
names.** Nothing else keeps the two in step: a gate invoked one way locally and
another way in CI is two gates that happen to share a name.

**Cheap gates run before expensive ones.** Formatting and secret scanning fail
in under a second; a vulnerability scan does not. Ordering by cost means the
common failure is reported immediately rather than after the slow gate.

**The exclusion set is stated once**, not restated per gate. Generated trees,
vendored code and lockfiles are excluded for the same reason everywhere, and
per-gate copies drift until one gate is scanning what the others skip.

**A repo with no hook runner records this topic `n/a`** and loses the parity
guarantee with it. That is a real loss, not a formality — without it, nothing
makes local and CI run the same command.

## What this pack writes

Two files, both under `.config/`. `pre-commit-config.yaml` is the base hook set
and the merge point every pack fragment lands in.
`git-conventional-commits.yaml` is the commit convention the `commit-msg` hook
enforces.

The convention file lives in **this** pack rather than beside the release task
that also reads it, because the hook is what enforces it: a convention nothing
checks is a style note, and the file and its gate should not be able to land
separately.

The fence in `output-tree.md` was opened for gate config files on 2026-09-05;
`package.json` and CI workflows remain outside it.

## The base config is a base, and fragments extend it

A language or package-manager pack does not rewrite this file. It ships one
`.config/pre-commit.d/<pack>.yaml` fragment — a document with a top-level
`repos:` list and nothing else — and the merge concatenates every fragment
present into the base between a `# >>> pre-commit.d/<name>.yaml` marker and a
matching `# <<< pre-commit.d/<name>.yaml`. A re-run replaces what sits between
one pair and leaves the rest alone, which is what makes the merge safe to run
again after a new pack lands.

The rule that follows from it: **a repo's own hooks go above the marker block,
never inside one.** Anything between a pair is regenerated, and the loss is
silent.

## Two hooks that cannot be commit-stage gates

`check-hooks-apply` and `check-useless-excludes` are shipped at
`stages: [manual]`, and this is deliberate rather than timid. Both fail on a
**correct** config in a young repo: the first reports every hook that matches
zero files, which is the normal state of a symlink or workflow hook until the
repo grows one of each; the second reports an exclusion for a generated tree
that has not been generated yet. Wired at the commit stage they would fail the
first commit of every new repository, and the fix people reach for is deleting
the hook that complained.

Run them deliberately instead, when a hook is added or a scope is changed —
they are an audit of the config, not a gate on the code.
