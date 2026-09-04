# Stack Checks (§§3–5)

Read this before running §3. It covers the three per-project stack checks:
languages (LSP + toolchain), frameworks and dependencies against each manifest,
and the repo/axis tooling. **Blocking** findings live in §3 (a language no
installed plugin claims) and §5 (a `custom` template pin, a missing `mise`, an
`iac` project inside another repo the user has not declined to extract).

## An unresolved axis is a degradation, and it makes two others conditional

Since `config_format` 16 any stack axis may read `unresolved` — deferred, not
decided (`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`, "The three axis states").
It is a **degradation**, reported every run, never blocking: it records a
decision postponed, not a repo in a bad state. Every check below that depends on
that axis reports **`not checked — no stack resolved`** and moves on — not a
pass, not a finding. Name the project and the axis, and give
`/vwf:architecture` as the remedy; never an install, since the question is
unanswered rather than unanswerable.

`unresolved` is the bare scalar on the list axes too, so `deploy_template:
unresolved` is deferral while `deploy_template: []` is a completed decision.
Treat them as opposites: `[]` is checked as an answer, `unresolved` is not
checked at all.

**Two findings this file otherwise raises as blocking are conditional on it**,
because a product nobody has chosen a stack for yet would otherwise halt `setup`
and `execute` on day one:

| Finding                | Blocking when                                                | Degradation when                                     |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| **unknown language** (§3) | that project's `template` is **pinned**                     | that project's `template` reads `unresolved`         |
| **missing `mise`** (§5)   | any axis in the repo is pinned, or any harness capability is claimed | no axis is pinned anywhere and no capability is claimed |

The severity follows the pin, never the calendar — the moment an axis is
answered, the finding reverts to blocking on the next run.

## 3. Languages — LSP and toolchain

For each project, for each token in `stack.languages`, resolve its row in the
stack vocabulary. A project whose `template` reads `unresolved` records
`languages: []` — the one legal empty — so there is nothing to resolve and the
whole section reports `not checked — no stack resolved` for it:

- **LSP** — the row names a plugin. Check it is active
  (`claude plugin list --scope project`, falling back to user scope). Missing →
  finding, with `/plugin` as the remedy. Row says `none` → report *no LSP
  available in this marketplace* and move on. **No installed plugin declares
  the token, but the project's pin resolves to a materialized template whose
  payload carries `language_facts` for it** (the materialized escape,
  `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`) → the language is
  **known**: verify against those facts instead — the LSP per how the facts say
  it is provided, the mise tool and manifest per the fact values, `n/a`
  accepted silently as an answer. **A token declared only under a template's
  `optional_languages:` counts as declared** — the template admits it, which is
  what this test asks. Say so in the report, though: an optional token carries
  no language facts of its own, so its LSP/toolchain/manifest rows read
  **unverified** rather than passing. Known-but-unverified is an honest third
  answer, and quietly reporting it as a pass would be the drift this check
  exists to catch. **No installed plugin declares the
  token and no materialized facts cover it** → report **unknown language**.
  **Blocking once this project's `template` is pinned**: nothing else can be
  checked for the token, and a stack vwf has no template for is one it cannot
  plan or build against. **A degradation while that `template` reads
  `unresolved`** — a project in that state should carry no tokens at all, and
  one that does cannot be blocked on a plugin that has not been chosen yet
  (`${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`). Either way the remedy is
  two lines — install the stack plugin that declares the language, or write one
  (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`) — never a suggestion to
  drop the token, which would only hide the project.
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

**The six stack axes.** Since format 19 a stack is composed from independent
axes — `project`, `backing`, `deploy`, `repo`, `design` and `cicd`
(`assets/stack-adapter.md` holds the enum) — and every one but `repo` is **per
project** (the three technology axes since format 13). Check each pin resolves
to a template an installed stack plugin actually offers:
`projects.<name>.stack.template` (project axis), each entry of
`projects.<name>.stack.backing_template`, `projects.<name>.stack.deploy_template`,
`repo.stack.template`, and the `projects.<name>.design` and
`projects.<name>.cicd` pins, whose slug is the config value itself. A pin naming
a template that isn't there is **drift** — usually a template renamed under the
user's feet, or a stack plugin that was never installed. An axis reading
`unresolved` is not a pin: report the degradation above and resolve nothing. A
**`custom` pin is
`13` drift and blocking**: the value was retired in `config_format` 14, and it
names a stack with no `conventions` for `plan` and `execute` to read and no
`harness` block to check against — remedy `/vwf:setup`, which
walks the axis back through the menu. A project whose
platforms ship through a store rather than to a deploy target (`mobile`,
`tablet`, `desktop`, `auto`) is correct with `deploy_template: []`, not
missing, as is an `iac` platform, which *is* the deploy path. A project
declaring `cli` **pins a deploy template for its package registry** — **which
one is the stack plugin's answer**, and **vwf names no slug on this axis or any
other**, so what this check asserts is that the axis is **answered**, never what
it was answered with.

**A project missing a required axis is a finding.** Every registry project needs
a `template` and a `deploy_template`. On the two list axes *answered* means a
list of slugs **or** `[]` — an absent key and an empty list mean different
things (nobody decided, versus decided: none). A bare `unresolved` on any axis
is **not** answered, and is the degradation above rather than this finding: the
key is present and names the gap out loud, which is the whole difference. A
project declaring a **screen platform** additionally needs `design`,
without which the design adapter halts at import time; every project needs
`cicd`, without which no CI system is pinned and the pipeline generator has
to ask on every run. Report each as
drift naming the project and the axis, and nudge `/vwf:architecture` — never
guess a value, and never copy one project's answer onto another, which is
exactly the product-wide assumption format 13 removed. A config still carrying a
product-wide `backing:`, `deploy:` or `design.tool` key is `12` drift: report it
and nudge `/vwf:setup`.

**A declared backing capability should have a provider.** For each registry
project, read its `capabilities:` and classify each token by the **kind** marked
in `${CLAUDE_PLUGIN_ROOT}/assets/capability-vocabulary.md`. For every **`B`**
(backing-service) token, check that some entry of that project's
`backing_template` list declares it — resolve each pinned template and read the
`capabilities:` its payload carries. A `B` token no pinned template provides is
a **finding**: name the project, the token, and the pins that were checked. A
project whose `backing_template` reads `unresolved` has no pins to resolve:
report `not checked — no stack resolved` for it rather than every `B` token it
declares as unprovided.

Three rules keep it honest:

- **`F` and `P` tokens are never reported.** A product foundation is the
  product's own code and a project-axis fact belongs to the project template;
  neither has anything to pin, so asking for one is a category error.
- **Consumers follow the publisher.** A capability this project only *consumes*
  is provided by the publishing project's pin, not its own — resolve the
  publisher before reporting (the rule is in the vocabulary asset). A consumer
  with `backing_template: []` is correct, not drift.
- **Never blocking.** Some `B` tokens have no template offering them anywhere in
  the installed plugins, so this would otherwise halt `setup` and `execute` over
  a gap in the template library rather than in the user's repo. Report it and
  nudge `/vwf:architecture`; do not raise it to blocking without deciding that
  separately.

**An `iac` project must be its own repo.** For each registry project declaring
the `iac` platform, resolve its `path` and check which repo's working tree it
falls in (`git -C <path> rev-parse --show-toplevel`). If that resolves to
another project's repo — the monorepo it sits inside, or the multi-repo **base**
itself rather than a member — it is a **blocking** finding: `setup` and
`execute` both halt on it. The rule and its rationale are in
`${CLAUDE_PLUGIN_ROOT}/assets/topologies/`. The remedy is the extraction
`/vwf:setup` writes up as a recommendation; doctor reports and
stops there, as with every other structural change. An `iac` project that is
already its own repo — an independent one, a submodule, or a sibling member —
passes silently.

**Unless the extraction is a recorded decline.** A decline written under
`enforcement:` downgrades this finding to a **degradation**: still reported,
every run, but no longer blocking, so neither `setup` nor `execute` halts on it.
The decline settles the *proposal*, never the *fact* — a product that chose to
keep its `iac` project where it is should keep being told what it costs, and
silencing the finding would leave the most privileged repo in the product
looking clean. Treat it exactly as a declined graph build.

**A project's template must cover its platforms.** Since format 22 a
project-axis template declares the platforms it serves in its own frontmatter,
and a project declares its own in the registry. Every platform the project
declares must appear in its pinned template's list; one that does not is
**blocking**, since `plan` and `execute` would size that surface against
conventions written for something else. A project whose `template` reads
`unresolved` has no list to check against: report `not checked — no stack
resolved` and move on. The common case is a project that was
`fullstack` before the migration and is now `[service, webapp]` — check the pin
rather than assuming the migration got it right.

**mise is mandatory once there is anything to run** — it is both vwf's task
runner (every worktree init, pre-commit and merge goes through it) and the
toolchain manager the §3 checks resolve against. Missing from `PATH` →
**blocking once any axis in the repo is pinned or any harness capability is
claimed**, remedy `curl https://mise.run | sh`. With **no** axis pinned anywhere
and no capability claimed, it is a **degradation**: there is no toolchain to
manage and no harness task to run, so halting `setup` and `execute` over it
would block a product on day one for a stack nobody has chosen yet. A repo with
no `.config/mise*.toml` at all is the same finding one level up, at the same
severity: report it and nudge `/vwf:setup`, which materializes the
unconditional `mise` bundle by its fixed slug through the stack adapter's
`-stack-template` skill.

Then check `repo.stack`: the `package_manager` resolves (lockfile present, tool
on `PATH` or in mise config) and each entry in `tools` has its expected marker —
a config file, a mise tool, or a manifest dependency. Absent `repo.stack` block
→ `10` drift; report and nudge `/vwf:setup`.

**`rtk` is recommended, never required.** vwf ships a `PreToolUse` Bash hook
that pipes each command through `rtk hook claude` to cut token cost, and the
hook entry is guarded (`command -v rtk … || true`), so a machine without it
runs correctly and simply pays full price. Missing from `PATH` → a
**degradation**, never blocking: name what it buys and give the remedy
(`brew install --formulae rtk`, or the releases at
<https://github.com/rtk-ai/rtk>). This is the one place vwf tells a user the
tool exists at all — without it the hook is silent in both directions, which is
why the finding is worth reporting on every run rather than once.
