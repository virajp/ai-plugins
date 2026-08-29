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

Around it the marketplace ships **fourteen more plugins** — languages, clouds,
capabilities, tooling, design and generation. That is the point of the split:
vwf owns the workflow and names no technology at all, so every concrete choice
lives in a plugin you install only if your product uses it. They install through
Claude Code's own plugin commands, straight from this repo — or through one
small CLI,
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
  and `rtk`. **Nothing checks this at install time**, and `/vwf:doctor` does not
  cover all five: it blocks on a missing `mise` or `graphify` (and `/vwf:setup`
  and `/vwf:execute` halt on either), reports a missing language server as an
  ordinary finding, and says nothing about `pnpm` or `rtk` — `rtk`'s hook is
  guarded so its absence only degrades, and `uv` matters as graphify's runtime
  rather than on its own. Run `/vwf:doctor` first regardless, but install all
  five rather than relying on it to tell you.
- **It is opinionated on purpose.** One workflow, one set of conventions, sized
  for a solo developer or a small team — not a configurable framework for a
  large org.

The full discussion — how model and effort are tiered per surface, what
delegating read-heavy work buys, and the rest of the fit questions — is in
[docs/plugins/vwf.md](./docs/plugins/vwf.md#caveats).

## Install

One command, which registers the marketplace and installs the workflow —
`devtools`, its one dependency, comes with it:

```sh
pnpx @askviraj/ai-plugins --all
```

That is a thin wrapper over Claude Code's own two commands, which work just as
well directly — the marketplace is this repo's `main` either way:

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
your user profile. Everything beyond `vwf` is installed by name, because which
language, cloud and capability plugins you want is a question about your product
rather than about the toolkit:

```sh
pnpx @askviraj/ai-plugins --user typescript --user gcp
# or
claude plugin install typescript@virajp-plugins gcp@virajp-plugins
```

Upgrading is `claude plugin marketplace update` followed by
`claude plugin update <name>` — the marketplace is served from this repo's
`main`, which every push validates in CI.

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
- **Per-plugin dependencies are yours to follow.** `vwf` depends on `devtools`;
  nothing outside Claude Code will resolve that for you.

## The plugins

Fourteen plugins, each with its own guide. Install the workflow, then whichever
ones match the product you are building. The name in code at the end of each
entry is what you pass to `claude plugin install`.

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

### Languages

**[typescript](./docs/plugins/typescript.md)** — the TypeScript language plugin,
covering TypeScript and JavaScript. A `typescript` router skill plus an `effect`
one for Effect-TS, and opinionated standards for `package.json`, pnpm, tsconfig
and the lint/format gate. It bundles the TypeScript language server, the
npm→pnpm/bun normalizing hook, and every TypeScript stack template vwf can offer
— service, service+webapp, site, worker, CLI, IaC and shared packages, plus the
npm-package and repo-level choices. `typescript@virajp-plugins`

**[flutter](./docs/plugins/flutter.md)** — Flutter and Dart done to one
standard: `dart` and `swift` router skills plus `kotlin`, `pubspec`,
`analysis-options` and internationalization, with Dart, Kotlin and SourceKit
(Swift) language servers bundled. It owns the `dart-flutter` stack template for
a `frontend` project. `--project flutter` from the app's own repo, or
`flutter@virajp-plugins` if you build them often enough for it to be a habit.

### Clouds

**[gcp](./docs/plugins/gcp.md)** — Google Cloud, as the judgment an SDK
reference cannot give you: which service to pick, when it stops being the
answer, how each one bills, which have local emulators, and what least-privilege
IAM looks like. It supplies Firebase and Cloud SQL as backing choices and Cloud
Run and GKE as deploy targets. `gcp@virajp-plugins`

**[cloudflare](./docs/plugins/cloudflare.md)** — **deliberately parked at Zero
Trust Access**: a private plane in front of a project that must not be publicly
reachable, whichever cloud hosts it. Workers, Pages, R2, D1, KV and the rest are
not offered here and arrive under their own plan; the menu says so out loud
rather than coming back quietly short. `cloudflare@virajp-plugins`

### Capabilities

A capability plugin holds the **neutral contract** — what your product must
guarantee, regardless of who provides it — and, where one exists, the provider
that belongs to no cloud. Managed flavours come from your cloud plugin. The
capability states the requirement; the provider states the mechanism.

**[datastore](./docs/plugins/datastore.md)** — the datastore contract: write
versioning, atomic multi-record writes, server-authoritative time, the
services-layer access rule, and a deterministic local stack. Ships **Postgres**.
`datastore@virajp-plugins`

**[identity](./docs/plugins/identity.md)** — the identity contract: verification
per route, the *claims carry status, never roles* rule, revocation, and the
operator plane. Ships any **OIDC** issuer. `identity@virajp-plugins`

**[observability](./docs/plugins/observability.md)** — the telemetry contract:
**your product emits OTLP and never a vendor SDK**, signals correlate,
cardinality is a design decision, retention is chosen. Ships the self-hosted
**OpenTelemetry → Grafana OTel-LGTM** sink; a managed backend is a destination,
not an import. `observability@virajp-plugins`

**[orchestration](./docs/plugins/orchestration.md)** — the contract for work
that happens later: at-least-once delivery and the idempotency it forces,
bounded retry, the poison path, work-in-flight visibility, and when a queue
beats a bus beats a scheduler beats a workflow engine. Ships **Temporal**.
`orchestration@virajp-plugins`

**[object-storage](./docs/plugins/object-storage.md)** — **contract-only by
design**: buckets, lifecycle as a bucket policy, signed access, prefix-scoped
credentials, the never-proxy-bytes rule, egress cost. Every object store is some
cloud's, so the flavour comes from `gcp` or `cloudflare` — and this plugin says
that explicitly rather than returning an empty menu, which would be
indistinguishable from a broken adapter. `object-storage@virajp-plugins`

### Tooling, design and delivery

**[devtools](./docs/plugins/devtools.md)** — the developer-machine toolchain in
one plugin: mise (the three-file `MISE_ENV` split, tool placement, the
file-based task library) with a `/devtools:scaffold` skill, Doppler for
**development** secrets, and the repo gates — dprint, ESLint, gitleaks, grype,
pre-commit. Its stack adapter retired in Wave C and its Docker/OCI doctrine in
Wave D, both to `stackgen`. A `vwf` dependency, because `/vwf:setup`
orchestrates its scaffold skill. `devtools@virajp-plugins`

**[design-tools](./docs/plugins/design-tools.md)** — **draining.** Its three
import skills are now vwf's own; what remains carries the Claude Design MCP
server until stackgen can generate that wiring. Formerly: the design adapter vwf
imports screens, design systems and design review conversations through. Three
skills resolve the design tool **per project** — `claude-design`, `lovable` or
`stitch` — so a product can design its website in one and its app in another.
Only some tools have a review conversation at all; the ones that do not say so
plainly rather than returning empty. Ships the Claude Design MCP server.
Deliberately not a vwf dependency: an adapter is chosen, not inherited.
`design-tools@virajp-plugins`

**[cicd](./docs/plugins/cicd.md)** — one `/cicd:workflow` skill that resolves
the repo's CI system from config and generates its delivery pipeline: every tool
installed through mise, both multi-repo and monorepo layouts, conforming to
vwf's tag-triggered, branch-validated, tested-before-release contract. GitHub
Actions is the one implementation today; adding a CI system is a single
reference file. Independent — vwf states the contract, this implements it.
`cicd@virajp-plugins`

**[stackgen](./docs/plugins/stackgen.md)** — the principles-driven stack
materializer. A stack is a composition of **components** — the language, its
package manager, each framework, the toolchain gates — and each one resolves on
its own: a component a shipped **pack** covers is copied verbatim; an uncovered
one is **generated** — researched via Context7 topic by topic, instantiated
against vwf's principles catalog, gated by a reviewer agent and your explicit
consent, so a covered language never regenerates because its framework is new.
Both paths land directly in the repo's committed `.claude/` tree — skills,
agents, hooks and rules only, shaped by a closed kind vocabulary whose per-kind
**topic bar** fixes what the output must cover and how deep, recorded in a
lockfile per component — so the result is plain files your collaborators get
with a `git pull` and no plugin install. Re-syncing against newer packs is an
explicit, diffed decision — never a silent overwrite, and never a
`settings.json` edit without separate consent. Waves A–C landed 21 packs and 19
bundles across seven kinds, and Wave D adds the eighth — `deploy-target`, whose
`container-image` pack is the curated answer the provider-neutral container
bundle used to generate. For what no pack covers, the curated plugins above
remain the covered-stack path, and stackgen's value is the uncovered tail.
`stackgen@virajp-plugins`

**[claude-code](./docs/plugins/claude-code.md)** — doctrine for writing plugins
against Claude Code itself, which until now lived in this repo's own `.claude/`
and travelled nowhere. Discovery is by directory convention, so adding a skill
is one file — and the corollary is the trap: a file in the wrong place is never
discovered, and nothing says so. Same shape for the invocation frontmatter,
where marking a skill user-only removes it from the model's context entirely, so
a skill that delegates to it gets no error, just nothing back. Plus the manifest
fields, the two marketplace traps that are silent when wrong, and hooks with
their per-event verdict shapes. It also owns the `claude-code-plugin` project
template, which is what makes vwf's `plugin` platform buildable.
`claude-code@virajp-plugins`

Every plugin above is authored here. Nothing in this marketplace is re-listed
from another repo any more: the last one that was — the Karpathy coding
guidelines — is now a
[skill vendored inside `vwf`](./docs/plugins/karpathy-guidelines.md) and
installs with it.

```sh
claude plugin install vwf@virajp-plugins typescript@virajp-plugins
claude plugin install --scope project flutter@virajp-plugins
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
# Install the default set (vwf, plus devtools as its dependency), and wire graphify
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
  hook and the Context7 server rely on.
- **[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)**,
  the **[Dart SDK](https://dart.dev/)**,
  **[kotlin-lsp](https://github.com/Kotlin/kotlin-lsp)**, and
  **[SourceKit-LSP](https://github.com/swiftlang/sourcekit-lsp)** — the engines
  behind the language-server plugins.
- **[rtk](https://github.com/rtk-ai/rtk) (Rust Token Killer)** — the
  token-saving proxy `vwf`'s Bash hook shells out to (installed via
  `brew install --formulae rtk`).
- **[graphify](https://github.com/safishamsi/graphify)** — the knowledge-graph
  tool `vwf` integrates with.
- **[tsup](https://tsup.egoist.dev/)** — bundles the installer CLI for
  publication. Argument parsing is Node's own `util.parseArgs`; the CLI carries
  no parser dependency.
