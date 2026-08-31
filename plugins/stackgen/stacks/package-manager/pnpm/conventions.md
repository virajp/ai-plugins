# pnpm — conventions

pnpm is the only package manager. A repo with two lockfiles has two dependency
graphs and resolves differently depending on who ran what.

**The lockfile is committed and authoritative.** CI installs frozen and fails on
drift rather than resolving something new — an install that can resolve
differently in CI than locally is not a gate.

**A publish cooldown guards the supply chain**, so neither a routine install nor
an automated update adopts a release published minutes ago.

**In a workspace, internal dependencies are linked, not versioned**, and shared
versions live in a catalog so one bump moves every package.

**An agent's `npm`/`npx` command is rewritten before it runs.** This pack
ships `hooks/npm-normalize.sh`, which lands at `.claude/hooks/npm-normalize.sh`
and — once its `hooks.yaml` entry is accepted into `.claude/settings.json` —
resolves the repo's manager from its lockfile and rewrites the command to it.
Declining the settings entry leaves the script landed and inert.

Full judgment: the `pnpm` skill's references.
