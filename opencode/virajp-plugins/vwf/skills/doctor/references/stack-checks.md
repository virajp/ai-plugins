# Stack Checks (§§3–5)

Read this before running §3. It covers the three per-project stack checks:
languages (LSP + toolchain), frameworks and dependencies against each manifest,
and the repo/axis tooling. §5 is the only section here that can produce a
**blocking** finding — a missing `mise`, or an `iac` project inside another
repo.

## 3. Languages — LSP and toolchain

For each project, for each token in `stack.languages`, resolve its row in the
stack vocabulary:

- **LSP** — the row names a plugin. Check it is active
  (`claude plugin list --scope project`, falling back to user scope). Missing →
  finding, with `/plugin` as the remedy. Row says `none` → report *no LSP
  available in this marketplace* and move on. Token not in the table → report
  **unknown language**, check nothing else for it.
- **Toolchain** — the row names a mise tool. Check it appears in the repo's mise
  config (`.config/mise*.toml`, per the mise skill's three-file split) or
  resolves on `PATH`. Missing → finding, with the `mise use` line as the remedy.
  A `—` in the column means the toolchain is not mise-managed; skip silently.

Report per language, not per project — one missing Dart LSP is one finding even
when three projects declare `dart`.

## 4. Frameworks and dependencies — manifests

For each project, read the manifest its languages imply (the vocabulary's
Manifest column, resolved against the project's `path` from the registry). Check
each `stack.frameworks` and `stack.dependencies` token appears there.

Match on the **token as a substring of a dependency name**, case-insensitively —
`effect` matches `effect` and `@effect/platform`; `tailwindcss` matches
`tailwindcss` and `@tailwindcss/vite`. This is deliberately loose: the goal is
catching a stack that has genuinely moved on, not policing package naming.

Two findings live here, and the second is the one that matters:

- **Declared but absent** — the config names something the manifest doesn't
  have. Usually a stale config entry.
- **Dominant but undeclared** — a framework or package manager doing obvious
  structural work that `stack` never mentions. Judge this from the manifest's
  scripts and its heaviest dependencies, not from a fixed list. This is the
  check that catches a runtime swap the config never recorded.

Report both as *drift to reconcile*, never as an error — the manifest is always
the truth and the config is what needs updating.

## 5. Repo tooling

**The four stack axes.** Since format 19 a stack is composed from four
independent templates (`assets/stack-vocabulary.md`), and since format 13 three
of the four are **per project**. Check each pin resolves to a template an
installed stack plugin actually offers: `projects.<name>.stack.template`
(project axis), each entry of `projects.<name>.stack.backing_template`,
`projects.<name>.stack.deploy_template`, and `repo.stack.template`. A pin naming
a template that isn't there is **drift** — usually a template renamed under the
user's feet, or a stack plugin that was never installed. A `custom` pin is
checked for its axes only, never for a file. A `frontend` project's
`deploy_template: n/a` is correct, not missing — unless its platform is `cli`,
which ships to a package registry and should pin `deploy/npm-package`; an `iac`
project's `n/a` is likewise correct, since it *is* the deploy path.

**A project missing a required axis is a finding.** Every registry project needs
a `template` and a `deploy_template` (`n/a` counts — it is an answer);
`backing_template` may be `[]` but must be present, since an absent key and an
empty list mean different things (nobody decided, versus decided: none). A **UI**
project (`role` `site`, `fullstack` or `frontend`) additionally needs `design`,
without which the design adapter halts at import time; every project needs
`cicd`, without which `/cicd-workflow` has to ask on every run. Report each as
drift naming the project and the axis, and nudge `architecture` — never
guess a value, and never copy one project's answer onto another, which is
exactly the product-wide assumption format 13 removed. A config still carrying a
product-wide `backing:`, `deploy:` or `design.tool` key is `12` drift: report it
and nudge `/vwf-setup`.

**An `iac` project must be its own repo.** For each registry project with
`role: iac`, resolve its `path` and check which repo's working tree it falls in
(`git -C <path> rev-parse --show-toplevel`). If that resolves to another
project's repo — the monorepo it sits inside, or the polyrepo parent itself
rather than a submodule — it is a **blocking** finding: `setup` and `execute`
both halt on it. The rule and its rationale are in
`%%AI_PLUGINS_ROOT%%/assets/topologies/`. The remedy is
`/vwf-setup`, which offers the consent-gated restructure; doctor reports and
stops there, as with every other structural change. An `iac` project that is
already an independent repo or a submodule passes silently.

**mise is mandatory** — it is both vwf's task runner (every worktree init,
pre-commit and merge goes through it) and the toolchain manager the §3 checks
resolve against. Missing from `PATH` → **blocking**, remedy
`curl https://mise.run | sh`. A repo with no `.config/mise*.toml` at all is the
same finding one level up: report it and nudge `/vwf-setup`, which delegates to
`devtools:scaffold`.

Then check `repo.stack`: the `package_manager` resolves (lockfile present, tool
on `PATH` or in mise config) and each entry in `tools` has its expected marker —
a config file, a mise tool, or a manifest dependency. Absent `repo.stack` block
→ `10` drift; report and nudge `/vwf-setup`.
