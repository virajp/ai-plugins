# dprint — format authority

**One formatter for the whole repository, configured once at the root.** A
second formatter is not a preference, it is a fight: two tools with different
opinions rewrite each other's output on alternate commits.

**Formatting only.** The linter carries zero formatting rules, and this
separation is the point — a rule that can be satisfied by a formatter should
never be able to fail a lint run. Correctness is the linter's; layout is here.

**Plugins are pinned by explicit version.** A floating plugin reference means
the repo formats differently on a machine that resolved it later, and the diff
lands on whoever commits next rather than on whoever upgraded.

**`excludes` covers every generated tree.** A generated file that gets
reformatted produces a diff nobody authored and a check nobody can make pass
without regenerating. Templated markdown is the exclusion that surprises people:
formatting a template rewrites the placeholders it exists to carry.

**`exec` is the escape hatch** for languages dprint has no plugin for — it
shells out to that language's own formatter, keeping one entry point even where
dprint itself cannot format.

**Wired as one task name**, and CI runs that same task. See the hook-runner
component for the parity rule this depends on.

**The repo formatter runs first in `code:format`**, ahead of any language- or
package-manager-specific formatting step that component wires into the same
task.

## What this pack writes

Two files. `.config/dprint.json` is the format authority — the includes, the
exclusion set and the pinned plugin list. `.config/taplo.toml` decides TOML
layout, and is reached only through dprint's `exec` escape hatch, so the two
land together or the TOML half formats with taplo's defaults.

The fence in `output-tree.md` was opened for gate config files on 2026-09-05;
`package.json` and CI workflows remain outside it.

## `--config` on every invocation, and the editor cost of that

dprint discovers `dprint.json` and `dprint.jsonc` by walking up from the file
being formatted. It does **not** look inside `.config/`. Putting the config
there with the rest of the repo's tooling is therefore a trade, made
deliberately, and the price is stated rather than discovered:

- **Every command-line call carries `--config .config/dprint.json`** — the
  format task, the pre-commit hook, and the CI step alike. A call without it
  formats with dprint's built-in defaults and reports success, which is the
  worst of the available failures.
- **The editor extension has no setting that answers this.** The VS Code
  extension contributes exactly `dprint.path`, `dprint.verbose` and
  `dprint.experimentalLsp`; none of them names a config file. Format-on-save is
  therefore inert in a repo whose only config is under `.config/`, and no
  warning says so — the extension simply finds nothing and does nothing.

So the trade is asymmetric, and worth naming plainly. The CLI, the pre-commit
hook and the CI step all pass `--config` and are unaffected — the gate that
decides whether a commit lands sees the real config every time. Format-on-save
does not follow `--config`, and there is no setting that makes it: the pointer
this pack could have written does not exist. Editing without it is not
unformatted work, it is work the gate formats a moment later.

This pack ships no remedy for that, and none is implied. Format-on-save is a
repo-level choice about the editor, not a gate concern, and the root allowlist
in the hygiene doctrine does not carry a file for it. A repo that decides it
wants one is deciding for itself, with the drift between two configs as the
thing it takes on.

## Submodules carry a copy, not a symlink

A submodule is a repository. Its checkout does not reliably contain the parent's
`.config/`, its own tooling runs from its own root, and a relative symlink
pointing out of it resolves to nothing wherever it is cloned alone. So each
submodule gets its **own** `.config/dprint.json`, kept identical on purpose.

The cost is that two files can drift; the cost of the symlink is that the gate
silently formats with defaults in the one context nobody tests. Prefer the
drift, which a diff shows.
