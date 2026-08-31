# vwf — Product → Blueprint → Plan → Execute for Claude Code

`virajp-plugins` is a plugin marketplace for AI coding agents, built around
**vwf**: an opinionated workflow that turns a vague idea into a shipped,
reviewed product through four disciplined phases.

1. **Product** — pin the outcome contract: the problem, the users, measurable
   goals, and the order to build in. Everything downstream must trace to it.
2. **Blueprint** — keep an always-current blueprint of the *whole product*,
   organized by **flow** (every flow serving a product goal, entities as the
   data contracts under them), closed by a whole-product coherence review.
3. **Plan** — diff the blueprint against the real code for one slice, planning
   its unbuilt dependencies as their own chained plans first, and write the
   delta to apply.
4. **Execute** — implement the plan autonomously under strict TDD, with code
   review, security review, E2E acceptance, and UX conformance per the rules,
   behind one final merge gate — with post-deploy verification and a
   production-feedback intake closing the loop.

You drive it with slash commands. Claude does the work — asking one question at
a time while authoring, running unattended while executing — and never merges
until you approve. The whole manual, command by command, is
**[docs/plugins/vwf.md](./docs/plugins/vwf.md)**. Journey-shaped guides —
starting fresh, adopting vwf in a codebase that already works, and running a
live product — are in **[docs/how-to](./docs/how-to/index.md)**.

Around it the marketplace ships **two more plugins** — `devtools` for the
developer machine's toolchain, and `stackgen`, which materializes whatever stack
you pin. Both are vwf dependencies, so installing the workflow brings them. That
is the point of the split: vwf owns the workflow and names no technology at all,
and every concrete choice — the language, the framework, the cloud — arrives as
a `stackgen` pack landed in your own repo rather than as a plugin each
collaborator has to install. They install through Claude Code's own plugin
commands, straight from this repo — or through one small CLI,
[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins),
which sequences those same commands and wires up graphify.

These are **Claude Code plugins**, authored natively. Other agents are served by
[a prompt, not a bespoke build](#other-tools) — see that section for what you do
and do not get.

## Caveats

`vwf` is deliberately heavyweight, and some of what it needs is a real adoption
blocker rather than a preference. Know this before you install.

- **It is built for the 1-million-token context window.** The orchestrator holds
  the blueprint, the plan, the registry and each subagent's output at once. On
  the standard window a real cycle will degrade or overflow.
- **It runs `opus` where judgment decides the outcome**, and where nobody is
  watching — `product`, `blueprint`, `plan`, the blueprint review gates, and
  every subagent inside the unattended `execute` run. `sonnet` and `haiku` carry
  the rest. An `execute` cycle runs several `opus` subagents per step with fix
  loop-backs, so **expect a meaningful token cost per slice.** This is not a
  cheap workflow.
- **It expects a testable, registry-described project.** `execute` enforces
  non-negotiable TDD and a coverage gate; `plan` and `execute` map each slice to
  a project in an architecture registry you author first. It will not operate on
  an ad-hoc folder.
- **Five binaries must be on your `PATH`** — `mise`, `graphify`, `uv`, `pnpm`
  and `rtk`. `pnpm` is only the **default** Context7 runner; `CONTEXT7_RUNNER`
  overrides it, so a bun or npm user needs no pnpm — see
  [docs/plugins/vwf.md](./docs/plugins/vwf.md). **Nothing checks this at install
  time**, and `/vwf:doctor` does not cover all five: it blocks on a missing
  `graphify`, and on a missing `mise` once any stack axis is pinned (and
  `/vwf:setup` and `/vwf:execute` halt on either), reports a missing language
  server as an ordinary finding, reports a missing `rtk` as a **degradation** —
  its hook is guarded, so the run is correct and merely costs more — and says
  nothing at all about the Context7 runner, while `uv` matters as graphify's
  runtime rather than on its own. Run `/vwf:doctor` first regardless, but
  install all five rather than relying on it to tell you.
- **It is opinionated on purpose.** One workflow, one set of conventions, sized
  for a solo developer or a small team — not a configurable framework for a
  large org.

The full discussion — how model and effort are tiered per surface, what
delegating read-heavy work buys, and the rest of the fit questions — is in
[docs/plugins/vwf.md](./docs/plugins/vwf.md#caveats).

## Install

One command, which registers the marketplace and installs the workflow —
`devtools` and `stackgen`, its two dependencies, come with it:

```sh
pnpx @askviraj/ai-plugins --all
```

That is a thin wrapper over Claude Code's own two commands, which work just as
well directly — the marketplace manifest is this repo's `main` either way:

```sh
# Register this repo as a plugin marketplace, once
claude plugin marketplace add virajp/ai-plugins

# Install the workflow
claude plugin install vwf@virajp-plugins
```

Restart your agent afterward so the skills, hooks and MCP servers load, then run
`/vwf:doctor`. It is the closest thing to a preflight now that nothing is gated
at install time — though see the [caveat](#caveats) on what it does and does not
check.

Scope is yours to choose: `--user` / `--project` on the wrapper, or
`--scope project` on Claude's commands, keep a plugin to one repo instead of
your user profile. Installing `vwf` is normally all you need, since `devtools`
and `stackgen` follow it as dependencies at the same scope — but either can be
installed on its own by name:

```sh
pnpx @askviraj/ai-plugins --project stackgen
# or
claude plugin install --scope project stackgen@virajp-plugins
```

Upgrading is `claude plugin marketplace update` followed by
`claude plugin update <name>`. Both steps are needed: the first re-reads the
manifest on `main` and picks up its new tag pins, the second fetches them. Skip
it and `plugin update` re-reads the pins you already have and finds nothing.

Each plugin is served from its own `<name>-v<version>` git tag rather than from
`main`, so plugins release independently — an upgrade moves only the ones whose
tag actually changed, and work merged but not yet tagged never reaches you.

**The statusline used to ship here and no longer does** — it has moved to
[`claude-status`](https://claude-status.virajp.dev), which is also where the
caps hook that pauses a long `/vwf:execute` run now comes from. If you installed
the bar from here, `settings.json` still names a script this toolkit no longer
ships — `brew install virajp/tap/claude-status` re-points it.

## Other tools

These are Claude Code plugins. Other agents — Cursor, OpenCode, Codex — have no
common plugin format to render into, so instead of a bespoke build per tool, the
route is to **ask your agent to do the adaptation**, pointing it at this repo.
That works today, and it is how most non-Claude use of this toolkit already
happens.

Paste one of these, adjusting the plugin name:

**One plugin, adapted for whatever you are running:**

> Install the `vwf` plugin from
> `https://github.com/virajp/ai-plugins/tree/main/plugins/vwf` into this
> project, adapted to the conventions of the agent you are running in. Read its
> `.claude-plugin/plugin.json` first — it declares the MCP servers, LSP servers
> and dependencies the plugin expects. Skills live in `skills/<name>/SKILL.md`
> with YAML frontmatter; hooks are declared in `hooks/hooks.json` with their
> scripts beside them. Port each of those to this tool's equivalent mechanism,
> and tell me plainly what has no equivalent rather than dropping it silently.

**The whole marketplace, to pick from:**

> Read
> `https://github.com/virajp/ai-plugins/blob/main/.claude-plugin/marketplace.json`
> and list the plugins with their descriptions, so I can choose which to install
> here. Then install the ones I name, following the per-plugin instructions
> above.

### What this does not promise

- **Nothing verifies the result.** There is no test for what Cursor or Codex
  produces from that prompt. It is your agent's best effort, and the honest
  expectation is that skills port well, hooks and MCP wiring port unevenly, and
  subagents port worst.
- **Hook and MCP wiring vary most.** vwf's hooks include a command *rewrite*
  (`rtk`) — a tool that can only allow or deny a command cannot express it, and
  the usual adaptation is a refuse-with-correction. MCP transport support
  differs per tool; vwf's memory server is HTTP, which is the more portable of
  the two it declares.
- **Model-invocation restrictions may be approximated.** Some skills are marked
  so the model cannot invoke them itself and you own the timing
  (`disable-model-invocation: true`). If your tool has no equivalent, that
  restriction is lost — the skill still works, but it may fire when you did not
  ask.
- **Per-plugin dependencies are yours to follow.** `vwf` depends on `devtools`
  and `stackgen`; nothing outside Claude Code will resolve that for you.

## The plugins

Three plugins, each with its own guide. Installing the workflow brings the other
two, which are its dependencies. The name in code at the end of each entry is
what you pass to `claude plugin install`.

### The workflow

**[vwf](./docs/plugins/vwf.md)** — the flagship. Sixteen `/vwf:` commands
covering the whole arc: onboard a repo, pin the outcome contract, model the
system, sweep a whole-product blueprint to complete coverage, plan one slice as
a reviewable diff, execute it unattended behind one merge gate, verify the
deploy, and route what production teaches you back to the document that fixes
it. It carries [cross-session memory](./docs/plugins/mempalace.md), a
knowledge-graph layer, session handoff and recall, the
[Karpathy coding guidelines](./docs/plugins/karpathy-guidelines.md), and the
Markdown and Context7 docs surfaces it absorbed. It names **no** technology — no
language, no framework, no cloud — which is what lets the rest of this list
exist. `vwf@virajp-plugins`

### Tooling, design and delivery

**[devtools](./docs/plugins/devtools.md)** — the developer-machine toolchain in
one plugin: mise (the three-file `MISE_ENV` split, tool placement, the
file-based task library) with a `/devtools:scaffold` skill, and the repo gates —
dprint, ESLint, gitleaks, grype, pre-commit. Its stack adapter retired in Wave
C, its Docker/OCI doctrine in Wave D and its Doppler doctrine alongside
stackgen's `secrets-manager` packs, all three to `stackgen`, which leaves it
holding no secrets doctrine at all. A `vwf` dependency, because `/vwf:setup`
orchestrates its scaffold skill. `devtools@virajp-plugins`

**[stackgen](./docs/plugins/stackgen.md)** — the principles-driven stack
materializer. A stack is a composition of **components** — the language, its
package manager, each framework, the toolchain gates — and each one resolves on
its own: a component a shipped **pack** covers is copied verbatim; an uncovered
one is **generated** — researched via Context7 topic by topic, instantiated
against vwf's principles catalog, gated by a reviewer agent and your explicit
consent, so a covered language never regenerates because its framework is new.
Both paths land mostly in the repo's committed `.claude/` tree — skills, agents,
hooks and rules only, shaped by a closed kind vocabulary whose per-kind **topic
bar** fixes what the output must cover and how deep, recorded in a lockfile per
component — so most of the result is plain files your collaborators get with a
`git pull` and no plugin install. Two things cannot be repo files, and each
carries its own consent line rather than riding the landing: an MCP server goes
into the project's `.mcp.json`, and a **language server** is a plugin-manifest
feature no project file can express at all, so stackgen writes one small local
plugin on your machine — at the fixed path
`~/.claude/plugins/local/stackgen-lsp/`, holding the union across the repos you
have materialized from — and **prints the two registration commands for you to
run rather than running them itself**. That one is user-scoped and your
collaborators get none of it, which is the same line your editor already draws;
what makes it safe is that every generated server declaration carries an
extension map, so it never starts in a repo with no matching files. Re-syncing
against newer packs is an explicit, diffed decision — never a silent overwrite,
never a `settings.json` edit without separate consent, and removal is by
subtraction, dropping only the keys your repo's lockfile recorded. 33 packs and
31 bundles ship across all nine kinds, the newest closing `cloud-provider` — the
one kind that had been defined but never authored against. stackgen is now the
only stack plugin: its packs are the covered path, its generator the uncovered
tail. A `vwf` dependency, because vwf's stack menu is the union of what the
installed stack plugins offer — with none present it comes back empty, and the
axes carry no free-text escape. You can defer an axis and keep defining the
product, but `/vwf:plan` and `/vwf:execute` halt until it is answered. Having it
installed commits you to nothing; it acts only once an axis is pinned.
`stackgen@virajp-plugins`

Every plugin above is authored here. Nothing in this marketplace is re-listed
from another repo any more: the last one that was — the Karpathy coding
guidelines — is now a
[skill vendored inside `vwf`](./docs/plugins/karpathy-guidelines.md) and
installs with it.

```sh
claude plugin install vwf@virajp-plugins
claude plugin install --scope project stackgen@virajp-plugins
```

## Statusline

**The statusline has moved to its own project.** It is not installed from here
any more — `pnpx @askviraj/ai-plugins --statusline` says so and exits non-zero,
which is all that flag does now. `--platform`, `--upgrade` and `--force` are
retired flags that exit non-zero naming themselves.

```sh
brew install virajp/tap/claude-status
```

**It requires macOS on Apple silicon.** The formula declares both, so Homebrew
refuses an Intel Mac rather than installing a binary that cannot run, and there
is no Linux build — see the caps-hook consequence below.

That is also where the **context & rate-limit caps hook** now comes from — the
`PostToolUse` hook that pauses long `/vwf:execute` runs at budget thresholds
(context over 65%, 5-hour over 90%, 7-day over 80%) by triggering a handoff. Its
sensor *is* the bar: those figures reach a session only on the statusline
payload, never on hook stdin, which is why the two travel together. **vwf cannot
detect its absence**, so install it before a long autonomous run rather than
after — without it the pause never fires. On any platform the formula refuses,
that is not a step you can complete: the pause is simply unavailable, and a long
autonomous run has to be sized accordingly.

**If you installed the bar from here, `--uninstall` no longer tidies up after
it.** `pnpx @askviraj/ai-plugins --uninstall` still reads and reverts the old
receipt like any other, which removes the script files it recorded — but nothing
unwires the `statusLine` and `subagentStatusLine` keys or the context-caps hook
entry, and no receipt is known to have recorded them. So the key is left naming
a script that is gone; installing `claude-status` re-points it. The discontinued
OpenCode TUI bar and Oh-My-Pi configuration are still restored from their
receipts.

## The installer CLI

[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins) is
a small CLI with three jobs: install **plugins** (`--all`, `--user`, `--project`
— a thin wrapper driving Claude's own commands, shown under [Install](#install)
above), wire up **graphify**, and **remove** what this toolkit put on your
machine.

**[docs/cli/](./docs/cli/)** is the full reference —
[usage](./docs/cli/usage.md) for the flag surface,
[targets](./docs/cli/targets.md) for what lands where, and
[internals](./docs/cli/internals.md) for the maintainer's map.

### Using it

**npm is the only distribution channel**, so it needs Node — on every platform,
Windows included. There is no standalone binary and no Homebrew tap.

```sh
# Install the default set (vwf, plus devtools and stackgen as its dependencies), and wire graphify
pnpx @askviraj/ai-plugins --all

# See exactly what a run would do, without writing anything
pnpx @askviraj/ai-plugins --all --dry-run

# Versions: this CLI against npm, and each plugin on main
pnpx @askviraj/ai-plugins --version

# List everything the toolkit installed, and remove what you do not deselect
pnpx @askviraj/ai-plugins --uninstall
```

Two things worth knowing before you run it; everything else is
[docs/cli/usage.md](./docs/cli/usage.md), which is the one place the flag
surface is described.

- **It writes nothing of its own.** Every install goes through the tool that
  owns it — `claude plugin install` for plugins, `graphify` for its wiring — so
  running the CLI and running those commands yourself leave the same machine.
  That is also why it keeps no receipt: what is on disk belongs to a tool that
  already tracks it.
- **`--uninstall` shows you a list and removes what you do not deselect.** Each
  piece goes through whatever owns it, and anything an *older* version installed
  — the discontinued OpenCode and Oh-My-Pi surfaces — is restored from its
  receipt rather than deleted, so what you had before comes back. `--dry-run` is
  the scriptable way to just look.

## Credits & acknowledgements

This project is a thin layer over a lot of excellent work. It would not exist —
or would be far poorer — without these. Thank you to their authors and
maintainers. 🙏

- **[Claude Code](https://claude.ai/code)** by
  [Anthropic](https://anthropic.com) — the host these plugins and hooks plug
  into.
- **[MemPalace](https://github.com/MemPalace/mempalace)** — the AI memory system
  that powers `vwf`'s cross-session recall. Its two skills are vendored into
  `vwf` under MIT; see `plugins/vwf/vendor/mempalace/`.
- **[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)**
  by `forrestchang` — behavioral coding guidelines derived from Andrej
  Karpathy's observations. Its `karpathy-guidelines` skill is vendored into
  `vwf`; see `plugins/vwf/vendor/andrej-karpathy-skills/`.
- **[Context7](https://github.com/upstash/context7)** by
  [Upstash](https://upstash.com) — the MCP docs server `vwf` declares.
- **[mise](https://mise.jdx.dev/)** by Jeff Dickey — resolves the toolchain the
  plugins and hooks depend on.
- **[pnpm](https://pnpm.io/)** — the default package manager the normalizing
  hook rewrites to, and the default runner behind the Context7 server.
- **[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)**,
  the **[Dart SDK](https://dart.dev/)**,
  **[kotlin-lsp](https://github.com/Kotlin/kotlin-lsp)**, and
  **[SourceKit-LSP](https://github.com/swiftlang/sourcekit-lsp)** — the engines
  behind the language servers `stackgen`'s packs declare.
- **[rtk](https://github.com/rtk-ai/rtk) (Rust Token Killer)** — the
  token-saving proxy `vwf`'s Bash hook shells out to (installed via
  `brew install --formulae rtk`).
- **[graphify](https://github.com/safishamsi/graphify)** — the knowledge-graph
  tool `vwf` integrates with.
- **[tsup](https://tsup.egoist.dev/)** — bundles the installer CLI for
  publication. Argument parsing is Node's own `util.parseArgs`; the CLI carries
  no parser dependency.
