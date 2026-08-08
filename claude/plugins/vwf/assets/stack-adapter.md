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
| The **four axes** (`project` / `backing` / `deploy` per project, `repo` per repo) | Which templates exist on each axis             |
| The **template frontmatter contract** (`stack-vocabulary.md`)       | The templates themselves                                    |
| The **role** vocabulary a project template declares                 | Which roles it offers a template for                        |
| Harness **capability names** (`dev`, `e2e_local`, `screenshots`, …) | What *satisfies* each one — the tool, the task, the command |
| The **UX gate's contract** (render changed screens, judge, report)  | How rendering and a11y assertion are actually done          |
| `.config/vwf.yaml`'s `stack` block shape                            | The values that land in it                                  |

The rule that decides every case: **vwf states the requirement, the plugin
states the mechanism.** vwf says a UI slice must have its screens rendered and
scanned; it must never say "Playwright" or "golden tests". If a vwf file names a
tool, that naming is a bug in this contract.

## Configuration

Two different things are configured, at two different scopes, and conflating
them is the mistake this section exists to prevent.

**Which plugins to ask** is product-wide — the roster vwf unions the menus of:

```yaml
# .config/vwf.yaml
stacks: [ typescript, gcp, cloudflare, datastore ] # ADAPTER PLUGIN NAMES, verbatim
```

An ordered list of plugin names. Every name must be an installed plugin —
`stacks: [ gcp ]` means the `gcp` plugin must be installed. Order is the menu
order; it carries no precedence, because the axes do not overlap. A **dependent**
plugin does not need its dependency listed: a plugin declaring another in its own
`plugin.yaml` is installed with it. List what the product chose, not the closure.

**What each project picked** is per project, and lives in the project's own
`stack` block (`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`):

```yaml
projects:
  website:
    stack:
      template: project/site/<slug>
      backing_template: [ <slug>, <slug> ]
      deploy_template: <slug>
  api:
    stack:
      template: project/service/<slug>
      backing_template: [ <slug> ]
      deploy_template: <slug>
```

Since **config_format 13** the `backing` and `deploy` axes are per project, not
product-wide. That is what lets one product run its site on one cloud and its
API on another while both draw from the same installed plugins: the roster is
shared, the selections are not. A product-wide `backing:` or `deploy:` block is
`12` drift.

The `repo` axis stays per repo (`repo.stack.template`) — it describes the
checkout, not a project.

## The delegation protocol

vwf invokes skills on each configured plugin, at **exactly** these names:

| Skill                                      | Kind   | Returns                     |
| ------------------------------------------ | ------ | --------------------------- |
| `/<plugin>:<plugin>-stack-menu`            | data   | a **menu payload**          |
| `/<plugin>:<plugin>-stack-template <slug>` | data   | a **template payload**      |
| `/<plugin>:<plugin>-ux-gate <slice>`       | action | **UX findings** (UI stacks) |

So `stacks: [ gcp ]` resolves to `/gcp:gcp-stack-menu`. vwf constructs every
name from the configured value — nothing is looked up or guessed.

**Why the name repeats the plugin.** OpenCode installs skills into one flat
namespace, so two plugins declaring `stack-menu` would overwrite each other;
`plugins:check` enforces cross-plugin skill-name uniqueness for exactly that
reason. Claude Code namespaces by plugin and would have been fine, but the
contract has to hold on both surfaces.

### Every adapter skill MUST be `disable-model-invocation: false`

The single most important rule here, and getting it wrong fails **silently**.
`disable-model-invocation: true` *"removes the skill from Claude's context
entirely"* and *"blocks programmatic invocation"* — so a delegated call does not
error. vwf simply cannot see the skill, and the menu comes back empty. A stack
plugin whose skills are user-only is indistinguishable, at runtime, from one
with no templates.

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
    axis: project | backing | deploy | repo
    role: <registry role> # project axis only
    name: <display name> # what the menu shows
    summary: <one line> # why you would pick it
```

vwf renders the union of every configured plugin's menu, grouped by axis and
(for the project axis) filtered to the role being decided. It never reads a
template file.

## The template payload

Returned by `-stack-template <slug>` once the user picks. Carries what
`.config/vwf.yaml` records plus what `plan` and `execute` need to work:

```yaml
slug: <kebab>
axis: project | backing | deploy | repo
languages: [ <token> ] # stack-vocabulary.md's closed vocabulary
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

## The UX gate

`execute-ux-reviewer` no longer knows how to render anything. For a UI slice it
delegates to `-ux-gate` on the plugin owning that project's stack, passing the
slice, the changed screens, the design-system path and the flow's Screens
contract. The plugin renders however its ecosystem does — a browser driver, a
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

**A stack plugin with no UI stack ships no `-ux-gate` skill**, and vwf never
calls it — a `gcp` or `temporal` project has no screens.

## Writing a stack plugin

1. `plugins/<name>/.claude-plugin/plugin.json` — `name`, plus `dependencies` for
   any plugin whose language it builds on (`effect` → `typescript`).
2. `skills/<name>-stack-menu/SKILL.md` and
   `skills/<name>-stack-template/SKILL.md`, both
   `disable-model-invocation: false`.
3. `skills/<name>-ux-gate/SKILL.md` only if the plugin owns a UI stack.
4. `stacks/<axis>/<slug>.md` — the templates themselves, in the plugin's own
   tree. Their shape is the plugin's business; only the payload is contracted.
5. Register in `.claude-plugin/marketplace.json` and in the installer's
   `PLUGINS`, per the repo's CLAUDE.md.

Nothing is added to vwf. A new stack — a language, a cloud, a framework — never
touches this plugin again, which is the whole point.
