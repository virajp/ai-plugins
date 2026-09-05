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
formatting a template rewrites the placeholders it exists to carry. The agent
tooling tree is the other one, and it gets its own section below.

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

## `**/.claude/` is excluded — do not delete that line

The repo's agent tooling tree is **machine-owned end to end**, and the formatter
owns none of it. `skills/`, `agents/`, `hooks/` and `rules/` are materialized
there by stackgen; `.claude/stackgen/` carries the lockfile, the template
payloads and the citation files it regenerates; `.claude/settings.json` is
rewritten by Claude Code itself. Every one of those files has an author that
rewrites it, and none of those authors formats.

Left in scope, this is not a cosmetic complaint — it is the first thing a fresh
repo hits. A pack's `skills/` mirror `.claude/skills/`, so the shipped formatter
reflows the shipped doctrine, and `pre-commit run --all-files` fails on the very
first run over files the repo's author never wrote. Worse, the reflow is not
always harmless: in the pre-commit component's own skill it dedents the fenced
`# >>> pre-commit.d/<name>.yaml` example from `  - repo: local` to
`- repo: local`, which is the wrong indentation for a merged fragment. The
formatter turns a correct example into one that would break the file it teaches.
The toolkit that ships these packs excludes `plugins/**/*.md` from its own
formatter for exactly this reason.

**The whole tree, not just its markdown.** Ownership is not visible in the path:
a hand-written `.claude/skills/<name>/SKILL.md` and a materialized one are the
same filename in the same directory, so no glob can format one and spare the
other. And the non-markdown files there — `lock.yaml`, the citation YAML,
`settings.json` — are regenerated on the same terms. The price is that a repo's
own hand-written file under `.claude/` goes unformatted; that is the cheaper
side of the trade, because the alternative is a gate that fails on content the
repo did not author.

**The reason lives here rather than in the config**, and not by preference:
`.config/dprint.json` is strict JSON, so the hygiene gate's `check-json` hook
rejects a `//` comment in it, and dprint rejects an unknown property with a
config diagnostic. Both routes are closed, so the note is in this file — read it
before "tidying" the exclusion away.

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
