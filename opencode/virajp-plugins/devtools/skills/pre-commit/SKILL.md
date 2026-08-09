---
name: pre-commit
description: pre-commit as the local gate — config at
  .config/pre-commit-config.yaml, hooks that call mise tasks so the same command
  runs locally and in CI, revs pinned and updated deliberately, and `files:`
  scoping so a hook fires only for what it validates. Auto-applies when editing
  a pre-commit config.
license: MIT
metadata:
  version: 0.1.0
  category: development
---

# pre-commit — the local gate

pre-commit runs the quality gates before a commit is made, so a broken commit is
never created rather than being caught later. The config lives at
**`.config/pre-commit-config.yaml`**, with the rest of the repo's tooling
config, which means every invocation carries `--config`:

```sh
mise run setup:precommit        # autoupdate + install the hooks
mise run code:precommit         # run against changed files
mise run code:precommit --all   # run against everything

pre-commit run --config .config/pre-commit-config.yaml --all-files
```

`setup:precommit` also clears any `core.hooksPath` the repo has set locally —
a leftover hooks path silently wins over pre-commit's installed hook, and the
symptom is a gate that reports nothing rather than one that errors.

## Local hooks call mise tasks

A repo-local hook should invoke the task, not the tool:

```yaml
- repo: local
  hooks:
    - id: code-format
      name: format
      entry: mise x -- mise run code:format
      language: system
      pass_filenames: false
      files: ^(src/|packages/)
      stages: [ pre-commit ]
```

`entry` names the **mise task** so the same command runs locally, in the hook,
and in CI — one definition, three callers. A hook that inlines the tool
invocation is a second copy that drifts from the task, and the drift shows up as
CI failing what pre-commit passed.

`mise x --` is what makes the hook work in a bare shell: pre-commit does not run
under the developer's activated environment, so without it the tool is simply
not on `PATH`.

## Scope with `files:`, and honour hook ordering

- **`files:` is a regex over paths**, and it is what keeps a commit touching one
  doc from running the whole gate. Scope each hook to what it actually
  validates.
- **`pass_filenames: false`** for any hook that operates on the repo as a whole
  (a build, a full-tree check). Otherwise pre-commit appends the changed file
  list to the command, which most task runners then treat as arguments.
- **Order matters when hooks interact.** A hook that regenerates committed
  output must run *before* the hook that asserts the output is current, and the
  generating hook must be the one that stages its result — otherwise the check
  compares against a stale tree and fails as something else entirely.

## Pin revs; update them deliberately

Every third-party `repo:` entry carries a `rev:`. `pre-commit autoupdate` moves
them, and it is run as a deliberate act (`setup:precommit`), not silently on
each commit — an unpinned or auto-moving hook set means a commit can fail on a
change nobody in the repo made.

## Never `--no-verify` to get past a red gate

The gate found something. Bypassing it commits the finding and moves it to CI,
where it costs more to diagnose. The two honest uses of `--no-verify` are a hook
that is itself broken, and a commit made by tooling that legitimately performs
the hook's job out of band — both worth stating in the commit message.
