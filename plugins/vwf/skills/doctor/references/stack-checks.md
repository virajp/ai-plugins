# Stack Checks (§§3–5)

Read this before running §3. It covers the three per-project stack checks:
languages (LSP + toolchain), frameworks and dependencies against each manifest,
and the repo/axis tooling. **Blocking** findings live in §3 (a language no
installed plugin claims) and §5 (a `custom` template pin, a missing `mise`, an
`iac` project inside another repo the user has not declined to extract).

## 3. Languages — LSP and toolchain

For each project, for each token in `stack.languages`, resolve its row in the
stack vocabulary:

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
  token and no materialized facts cover it** → report **unknown language** as a **blocking** finding: nothing
  else can be checked for it, and a stack vwf has no template for is one it
  cannot plan or build against. The remedy is two lines — install the stack
  plugin that declares the language, or write one
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

**The four stack axes.** Since format 19 a stack is composed from four
independent templates (`assets/stack-vocabulary.md`), and since format 13 three
of the four are **per project**. Check each pin resolves to a template an
installed stack plugin actually offers: `projects.<name>.stack.template`
(project axis), each entry of `projects.<name>.stack.backing_template`,
`projects.<name>.stack.deploy_template`, and `repo.stack.template`. A pin naming
a template that isn't there is **drift** — usually a template renamed under the
user's feet, or a stack plugin that was never installed. A **`custom` pin is
`13` drift and blocking**: the value was retired in `config_format` 14, and it
names a stack with no `conventions` for `plan` and `execute` to read and no
`harness` block to check against — remedy `/vwf:setup`, which
walks the axis back through the menu. A project whose
platforms ship through a store rather than to a deploy target (`mobile`,
`tablet`, `desktop`, `auto`) is correct with `deploy_template: n/a`, not
missing — unless its platform is `cli`,
which ships to a package registry and should pin `deploy/npm-package`; an `iac`
platform's `n/a` is likewise correct, since it *is* the deploy path.

**A project missing a required axis is a finding.** Every registry project needs
a `template` and a `deploy_template` (`n/a` counts — it is an answer);
`backing_template` may be `[]` but must be present, since an absent key and an
empty list mean different things (nobody decided, versus decided: none). A
project declaring a **screen platform** additionally needs `design`,
without which the design adapter halts at import time; every project needs
`cicd`, without which `/cicd:workflow` has to ask on every run. Report each as
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
a **finding**: name the project, the token, and the pins that were checked.

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
conventions written for something else. The common case is a project that was
`fullstack` before the migration and is now `[service, webapp]` — check the pin
rather than assuming the migration got it right.

**mise is mandatory** — it is both vwf's task runner (every worktree init,
pre-commit and merge goes through it) and the toolchain manager the §3 checks
resolve against. Missing from `PATH` → **blocking**, remedy
`curl https://mise.run | sh`. A repo with no `.config/mise*.toml` at all is the
same finding one level up: report it and nudge `/vwf:setup`, which delegates to
`devtools:scaffold`.

Then check `repo.stack`: the `package_manager` resolves (lockfile present, tool
on `PATH` or in mise config) and each entry in `tools` has its expected marker —
a config file, a mise tool, or a manifest dependency. Absent `repo.stack` block
→ `10` drift; report and nudge `/vwf:setup`.
