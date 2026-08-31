# Stack Adapter Contract

vwf is **decoupled from any particular technology**. It ships no stack
templates, names no language, framework, datastore, cloud, or test runner, and
cannot: every concrete technology lives in a **stack plugin**, and vwf exchanges
**normalized payloads** with whichever ones the product configured.

This is the same shape as the design-adapter contract
(`${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`), applied to the stack.

## What vwf keeps, and what it delegates

| vwf owns (abstract)                                                 | A stack plugin owns (concrete)                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| The **six axes** (`project` / `backing` / `deploy` / `design` / `cicd` per project, `repo` per repo) | Which templates exist on each axis             |
| The **template frontmatter contract** (`stack-vocabulary.md`)       | The templates themselves                                    |
| The **platform** vocabulary a project template declares             | Which platforms it offers a template for                    |
| Harness **capability names** (`dev`, `e2e_local`, `screenshots`, …) | What *satisfies* each one — the tool, the task, the command |
| The **UX gate's contract** (render changed screens, judge, report)  | How rendering and a11y assertion are actually done          |
| `.config/vwf.yaml`'s `stack` block shape                            | The values that land in it                                  |

The rule that decides every case: **vwf states the requirement, the plugin
states the mechanism.** vwf says a UI slice must have its screens rendered and
scanned; it must never say "Playwright" or "golden tests". If a vwf file names a
tool, that naming is a bug in this contract.

### The two deliberate exceptions

Both are **recognition, not prescription** — vwf naming a tool in order to read
someone else's repo, never to tell them what to use. Any third case is a bug.

1. **This paragraph.** The rule cannot be stated without an example of what it
   forbids.
2. **The `readme` skill's scan lists.** It documents a repo it did not choose,
   so it has to recognise what is already there. The lists are open-ended and
   carry no preference; a tool absent from them is a gap in recognition, not a
   verdict on the tool.

Everything else that reads a repo — topology detection, harness detection —
resolves through the installed stack plugins instead. A signal no plugin claims
is recorded as `unknown`, which lets a **scan** finish on its other evidence but
is a **blocking** finding the moment vwf is asked to plan or build: the menu is
closed to what the installed plugins define
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`).

## Configuration

Two different things are configured, at two different scopes, and conflating
them is the mistake this section exists to prevent.

**Which plugins to ask** is product-wide — the roster vwf unions the menus of:

```yaml
# .config/vwf.yaml
stacks: [ stackgen ] # ADAPTER PLUGIN NAMES, verbatim
```

An ordered list of plugin names. Every name must be an installed plugin —
`stacks: [ stackgen ]` means the `stackgen` plugin must be installed. Order is the menu
order; it carries no precedence, because the axes do not overlap. A **dependent**
plugin does not need its dependency listed: a plugin declaring another in its own
manifest is installed with it. List what the product chose, not the closure.

**What each project picked** is per project, and lives in the project's own
`stack` block (`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`):

```yaml
projects:
  website:
    stack:
      template: project/site/<slug>
      backing_template: [ <slug>, <slug> ]
      deploy_template: [ <slug> ]
  api:
    stack:
      template: project/service/<slug>
      backing_template: [ <slug> ]
      deploy_template: [ <slug>, <slug> ] # a project may ship through several
  cli:
    stack:
      template: unresolved # deferred — see below
      backing_template: []
      deploy_template: unresolved
```

Since **config_format 13** the `backing` and `deploy` axes are per project, not
product-wide. That is what lets one product run its site on one cloud and its
API on another while both draw from the same installed plugins: the roster is
shared, the selections are not. A product-wide `backing:` or `deploy:` block is
`12` drift.

Since **config_format 16** `deploy_template` is a **list**, matching
`backing_template`: a project ships through as many delivery mechanisms as it has
— a package registry, a container image, a signed archive — and a scalar could
record one. Adapters that emit a deploy payload are unaffected; the cardinality
is the *config's*, and each slug is still fetched on its own.

Since **config_format 16** any axis may also read **`unresolved`** — deferred,
not decided (`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`, "The three axis
states"). It is the bare scalar even on the list axes, and it is never something
an adapter returns: it records that vwf did not ask, or that the user postponed
the answer. **No adapter is invoked for an unresolved axis**, so a stack plugin
never sees the value and needs no handling for it.

The `repo` axis stays per repo (`repo.stack.template`) — it describes the
checkout, not a project.

## The delegation protocol

vwf invokes skills on each configured plugin, at **exactly** these names:

| Skill                                      | Kind   | Returns                     |
| ------------------------------------------ | ------ | --------------------------- |
| `/<plugin>:<plugin>-stack-menu`            | data   | a **menu payload**          |
| `/<plugin>:<plugin>-stack-template <slug>` | data   | a **template payload**      |
| the repo's own `ux-gate` skill             | action | **UX findings** (UI stacks) |

So `stacks: [ gcp ]` resolves to `/gcp:gcp-stack-menu`. vwf constructs every
name from the configured value — nothing is looked up or guessed.

**The catalog handover.** Every `-stack-template` invocation passes the
principles-catalog asset paths
(`${CLAUDE_PLUGIN_ROOT}/assets/principles/index.md` and its entries) alongside
the slug — the design-adapter payload style: vwf hands its own asset paths
into the invocation, and no plugin ever reaches into vwf's files. A curated
plugin ignores them; a **generating** adapter (the materialized-template
variant below) requires them, and halts by contract when they are missing
rather than substituting general knowledge.

**Why the name repeats the plugin.** OpenCode installs skills into one flat
namespace, so two plugins declaring `stack-menu` would overwrite each other;
Claude Code namespaces a skill by its plugin, so a bare name need only be unique
inside its own bundle. The `<plugin>-` prefix on every adapter skill name is
therefore readability rather than a correctness requirement — keep it, because a
menu skill called `stack-menu` tells a reader nothing about whose menu it is.

### Every adapter skill MUST be model-invocable

That is `disable-model-invocation: false` in the skill's frontmatter. The single
most important rule here, and getting it wrong fails **silently**:
`disable-model-invocation: true` removes the skill from the model's context
entirely and blocks programmatic invocation — so a delegated call does not error.
vwf simply cannot see the skill, and the menu comes back empty. A stack plugin
whose skills are user-only is indistinguishable, at runtime, from one with no
templates. `plugins:check` enforces it.

### vwf preflights, because the failure mode is silence

Before delegating, `/vwf:architecture`, `/vwf:setup` and `/vwf:doctor` **verify
every plugin named in `stacks:` is installed** (`claude plugin list`). They do
not attempt the call and infer from the result — that inference is impossible. A
missing plugin is a **halt** with the install command, never an empty menu.

## The menu payload

Returned by `-stack-menu`. One entry per template the plugin offers:

```yaml
plugin: <name>
templates:
  - slug: <kebab> # unique within the plugin
    axis: project | backing | deploy | repo | design | cicd
    platforms: [ <platform> ] # PROJECT AXIS ONLY — which registry platforms this template serves
    name: <display name> # what the menu shows
    summary: <one line> # why you would pick it
```

vwf renders the union of every configured plugin's menu, grouped by axis and
(for the project axis) filtered to the **platforms** being decided. It never
reads a template file.

**`platforms:` is a list, and that is the point.** Since blueprint format 22 a
project declares one `role` and one or more platforms, and a single template
routinely serves several of them: one Flutter template covers `mobile`,
`tablet`, `desktop` and `webapp` from one codebase; one server template covers
`service` and `webapp` — what the retired `fullstack` role meant. The previous
contract keyed a template on a single `role`, stored in three places (the
directory name, the frontmatter and this payload), and could not express either
case.

**The covering rule.** A project pins **one** project-axis template, and that
template's `platforms:` must **cover** every platform the project declares in
the registry. `/vwf:architecture` offers only covering
templates; `/vwf:doctor` reports a pin that stopped covering as
**blocking**, since `plan` and `execute` would otherwise size a surface against
conventions written for something else. Nothing checked this before, because a
single-role pin had nothing to check.

**A template's own directory is not the source.** Templates sit flat under
`stacks/project/` and declare their platforms in frontmatter; a plugin that
still keys them on a `stacks/project/<role>/` directory is on the pre-22
contract.

### The two tool axes — `design` and `cicd`

Added after a stranded pack made the gap visible: a CI-system template existed
that **no menu could offer**, because CI is chosen by a per-project config key
rather than by a stack pin, and the menu is the only door a template can come
through. A template nothing can offer is not an error — it is invisible, which
is why it shipped unnoticed.

These two axes close that door. They differ from the other four in one respect
worth stating, because it is what keeps them cheap:

**The slug *is* the config value.** `projects.<name>.design` and
`projects.<name>.cicd` already hold a tool token — `claude-design`,
`github-actions` — and a menu entry on these axes takes that same token as its
slug. So there is exactly one value, written once, and no second spelling to
drift against. `/vwf:doctor` reports a pin resolving to no menu entry the same
way it reports any other unresolvable pin.

Neither axis takes `platforms:`. `design` is required for a project declaring
any **screen** platform and absent otherwise (the same condition the config key
already states); `cicd` is required for a project the pipeline builds.

**`design` is where the design adapter's per-tool knowledge now comes from.**
vwf still names no tool: the adapter contract
(`${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`) defines the payloads and the
three fixed skill names, and the pinned template materializes the resolved
tool's implementation of them into the repo's own `.claude/`.

## The template payload

Returned by `-stack-template <slug>` once the user picks. Carries what
`.config/vwf.yaml` records plus what `plan` and `execute` need to work:

```yaml
slug: <kebab>
axis: project | backing | deploy | repo | design | cicd
languages: [ <token> ] # open; the plugin owning the language defines its facts
optional_languages: []
frameworks: [] # open, lowercase-kebab
dependencies: [] # open, lowercase-kebab
capabilities: [] # backing axis — capability-vocabulary.md tokens
artifact: <token> # deploy axis
package_manager: <token> # repo axis
harness: # HOW this stack satisfies each capability
  <capability>: { task: <name>, mechanism: <one line> } # or `n/a`
conventions: <prose> # layout, testing, placement — read by plan/execute
```

The `harness` block is what replaces the tool names vwf used to carry. vwf asks
"can this repo run `screenshots`?"; the plugin answers "yes — task `test:e2e`,
via a browser driver". `/vwf:doctor` checks the task exists; it never checks
*which* tool.

### Resolving the conventions

`.config/vwf.yaml` records **which** templates a project picked; it does not
record what they say. The `conventions:` prose — layout, testing, placement — is
the template's, and reaching it means asking the plugin. `/vwf:plan` sizes its
steps against that prose and `/vwf:execute` writes code to it, so both resolve
it the same way:

1. **Collect the pins** for every project in scope — `template`, each
   `backing_template` entry, each `deploy_template` entry (a list since
   `config_format` 16), and the repo's `repo.stack.template`. Skip `n/a` and an
   empty list; both are answers, not pins.

   **An `unresolved` axis halts here, before any fetch.** It is the one state
   that is neither a pin nor an answer, so there is no prose to resolve and no
   honest way to proceed — report the project and the axis, point at
   `/vwf:architecture`, and stop. Distinguish it from the failure below when
   reporting: this one is a question nobody answered, not a plugin that broke.
2. **Dedupe by (plugin, slug) and fetch each once**, calling
   `/<plugin>:<plugin>-stack-template <slug>`. A monorepo whose projects share a
   repo template fetches it once, not once per project.
3. **Resolve once per run, before the work starts**, and pass the result down to
   every subagent that needs it. Re-fetching per element or per step would
   re-pay the call for prose that cannot change mid-run.

**A fetch that fails is a halt, not a degrade.** By this point the stack gate has
already confirmed every pin names a template an installed plugin ships, so a
failure here is the plugin being unreachable or returning garbage — an
infrastructure fault, not a config one. Report it with the slug and stop.
Continuing would produce exactly what the closed menu exists to prevent: a run
sized and written against conventions nobody read, indistinguishable from one
where the conventions happened to say nothing.

**The prose informs code, never the contract.** These conventions reach
`docs/plans/` and the repo's source. They never reach `docs/blueprint/` — that is
the line that keeps a vendor name structurally impossible in a blueprint doc
rather than merely discouraged, and it is why the stack lives in config in the
first place.

## The materialized-template variant

A stack plugin may be a **materializer** rather than a library: instead of
serving templates from its own tree forever, it lands them — skills, agents,
hooks, rules, and the template payload itself — **directly in the repo's
committed `.claude/` tree**, recorded in a lockfile the plugin owns, on an
explicit, consent-gated first pin. The repo owns the copies; the plugin's
own settings edits (hook wiring) take separate explicit consent, and the
repo's CLAUDE.md stays vwf's domain — the materializer ends by recommending
`/vwf:setup`. The `stackgen` plugin is this variant's implementation; vwf's
side of the contract is three rules:

- **The payload may carry `language_facts`** — per language, the facts a
  language plugin would otherwise supply (LSP provision, mise tool, manifest;
  `n/a` where honest). That is the **materialized escape** in
  `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`: a token those facts
  cover is *known* to `/vwf:doctor` without a claiming language plugin.
- **A materialized fetch is a pure read.** Once a slug is materialized, every
  `-stack-template` call returns the committed payload from the repo — so
  `plan`'s and `execute`'s conventions resolution behaves exactly as
  *Resolving the conventions* states, with no research, network, or write on
  their clock. Materialization itself happens once, interactively, when the
  pin is first made; a pin whose materialization was declined is
  **unmaterialized**, and the fetch says so rather than generating silently.
  That is not the `unresolved` axis state above and must not be recorded as one:
  the axis *was* answered, and what is missing is the artifact, not the decision.
- **The menu may carry one open entry.** A materializing adapter's menu may
  offer *generate for an uncovered technology* (pinned as
  `generated/<technology-slug>`) alongside its curated entries. That entry is
  consent-gated, reviewer-gated generation — not the retired free-text
  `custom`: nothing lands unresearched, unreviewed, or unrecorded, and the
  resulting pin resolves to a real materialized template every later check
  verifies. The open entry is not the only door into generation: a
  materializing adapter may also generate *part* of an otherwise curated pin,
  and vwf sees the same thing either way — one payload, one consent-gated
  materialization. The no-fitting-template **halt** still applies when
  nothing on any menu fits *and* no installed adapter offers generation.

## The UX gate

`execute-ux-reviewer` no longer knows how to render anything. For a UI slice it
invokes the repo's **own** `ux-gate` skill — a fixed name in the repo's
`.claude/skills/`, materialized there by whichever pack owns the project's
stack — passing the slice, the changed screens, the design-system path and the
flow's Screens contract.

**The name is fixed, and that is the point.** vwf used to construct
`<plugin>-ux-gate` from the stack pin, which stops working the moment stacks are
packs rather than plugins: there is no plugin name left to build from. A name
assembled from configuration is a name that can silently resolve to nothing, and
a UX gate that resolves to nothing looks exactly like a slice with no findings.
A fixed repo-local name either exists or does not, and its absence is
checkable. The plugin renders however its ecosystem does — a browser driver, a
snapshot test suite, a simulator — runs its accessibility equivalent, and
returns findings in vwf's vocabulary:

```yaml
rendered: ok | n/a
reason: <one line> # required when n/a
findings: [ { severity, screen, what, where } ]
```

vwf's rule is unchanged and stays vwf's: `rendered: n/a` on any UI slice is a
gap that reaches the final human gate, never a silent downgrade to a code-only
review. What counts as "rendered" is the plugin's call.

**A pack with no UI surface materializes no `ux-gate`**, and vwf finds none —
a project with no screens has nothing to render. That absence is the same
`rendered: n/a` path as a gate that declined, and carries the same rule: it
reaches the final human gate rather than downgrading silently.

## Writing a stack plugin

1. `<name>/.claude-plugin/plugin.json` — the manifest: `name`, `version`,
   `description`, plus `dependencies` for any plugin whose language it builds on.
2. `skills/<name>-stack-menu/SKILL.md` and
   `skills/<name>-stack-template/SKILL.md`, both
   **`disable-model-invocation: false`**. A user-only skill cannot be invoked by
   vwf and the failure is silent.
3. A UI-owning pack materializes `skills/ux-gate/SKILL.md` into the repo's
   `.claude/` — an unprefixed, fixed name, because vwf invokes it there rather
   than through the plugin.
4. `stacks/<axis>/<slug>.md` — the templates themselves, in the plugin's own
   tree. Their shape is the plugin's business; only the payload is contracted.

There is no registration step: the marketplace manifest is generated from the
manifests, so adding the plugin is the registration.

Nothing is added to vwf. A new stack — a language, a cloud, a framework — never
touches this plugin again, which is the whole point.
