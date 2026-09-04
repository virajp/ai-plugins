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

## The task library this pack owns

This pack ships a `config/.config/mise/tasks/` tree — `code/format`,
`code/lint`, and `setup/deps/{install,outdated,audit,cleanup}` — landing at the
repo's own `.config/mise/tasks/` behind the materializer's config consent line.

**It owns `code/format` and `code/lint` whole, not a fragment of each.**
`code:format` runs **dprint first**, then `pnpm dlx sort-package-json`: one task
file co-authored by the repo formatter and the package manager. The seam is
ownership-plus-contract — this component writes the file, and the contract it
honours is that the repo formatter goes first. It is written whole rather than
assembled from contributed fragments because stackgen's dispatch is
copy-verbatim or generate, with nothing in between; a fragment layer would be a
templating mechanism this plugin deliberately does not have.

**Composition order, since more than one component writes this tree:**
`toolchain-manager`, then `package-manager` / `language`, then `app-framework` —
a later component's file wins, recorded per file in the lockfile. So this pack's
`code/format` replaces the `toolchain-manager` baseline's, and an
`app-framework` component's would replace this one's.

**The `setup/deps/*` verbs are `install`, `outdated`, `audit` and `cleanup` —
and deliberately not `upgrade`.** `install` is `pnpm install --recursive`,
because a workspace install that stops at the root leaves the repo half
resolved. `cleanup` deletes `dist`, `node_modules`, the lockfile and
`*.tsbuildinfo`, then prunes the store — a store left behind makes the next
install look clean when it is replaying. The optional verbs are **probed by
name**, so a missing file is itself the answer: no `upgrade` here means this
manager has no such verb, not that the choice is still pending.

Full judgment: the `pnpm` skill's references.
