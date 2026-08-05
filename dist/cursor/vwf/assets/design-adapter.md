# Design Adapter Contract

vwf is **decoupled from any particular design tool**. It does not call
claude.ai/design, Lovable, Stitch, or anything else — it exchanges two
**normalized payloads** with whichever adapter plugin the product configured.

The split is deliberate and asymmetric:

| Direction  | How it works                                                           | Needs an adapter? |
| ---------- | ---------------------------------------------------------------------- | ----------------- |
| **Export** | `/screens prompt` writes design briefs to `docs/prompts/screens/…` | **No**            |
| **Import** | vwf delegates to the configured adapter and consumes what it returns   | **Yes**           |

**Export needs no adapter at all.** The briefs are files — the deliverable is
the markdown, and the user takes it to whatever tool they like. That half has
always been tool-agnostic; nothing about it changes.

Only **import** needs a plugin, because reading designed work back requires
speaking that tool's API.

## Configuration

```yaml
# .config/vwf.yaml
design:
  tool: claude-design # the ADAPTER PLUGIN NAME, verbatim
```

One tool per product. The value is a plugin name, so `design.tool: lovable`
means the `lovable` plugin must be installed.

## The delegation protocol

vwf invokes two skills on the configured plugin, at **exactly** these names:

| Skill                                                 | Returns                     |
| ----------------------------------------------------- | --------------------------- |
| `/<plugin>:<plugin>-import-screens <flow> <platform>` | a **screens payload**       |
| `/<plugin>:<plugin>-import-design-system`             | a **design-system payload** |

So `design.tool: lovable` resolves to `/lovable-import-screens`. vwf
constructs both names from the configured value — nothing is looked up or
guessed.

**Why the name repeats the plugin.** OpenCode installs skills into **one flat
namespace**, so two plugins declaring `import-screens` would overwrite each
other; `plugins:check` enforces cross-plugin skill-name uniqueness for exactly
that reason. Claude Code namespaces by plugin and would have been fine, but the
contract has to hold on both surfaces. The redundancy is the price of a
deterministic name that is also globally unique — and determinism is what makes
delegation possible at all.

### Both adapter skills MUST be `disable-model-invocation: false`

This is the single most important rule in this contract, and getting it wrong
fails **silently**. Per Claude Code's skill docs,
`disable-model-invocation:
true` *"removes the skill from Claude's context
entirely"* and *"blocks programmatic invocation"* — so a delegated call to such
a skill does not error. vwf simply cannot see it, and the import quietly does
nothing.

An adapter whose skills are user-only is indistinguishable, at runtime, from an
adapter that returned an empty payload.

### vwf preflights, because the failure mode is silence

Before delegating, `/design-system` and `/screens import` **verify the
configured plugin is installed** (`claude plugin list`). They do not attempt the
call and infer from the result — that inference is impossible.

Three distinct halts, because they need three different fixes:

| Condition                          | Message                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| No `design.tool` in config         | "No design tool configured. Set `design.tool` and install its plugin." |
| Configured plugin not installed    | "`design.tool: <name>` but the `<name>` plugin isn't installed."       |
| Adapter returned nothing / garbage | "`<name>` returned no usable payload." (with the parse error)          |

Never collapse these into one message. "Design import failed" sends the user
looking in the wrong place two times out of three.

## Payload 1 — screens

Returned by `/<plugin>:<plugin>-import-screens <flow> <platform>`. Shapes match
the flow platform template, so `/screens import` can diff it directly
against the Screens contract.

```yaml
flow: <NNN>-<flow-slug>
project: <registry-project>
platform: mobile | tablet | desktop | web | auto
screens:
  - code: <NNN><letter> # the pinned screen code — the join key
    name: <screen name>
    purpose: <one line>
    components: # what the screen is built from
      - name: <component>
        role: <what it does here>
        states: [ default, empty, loading, error, … ]
    states: # screen-level states the design actually shows
      - name: <state>
        description: <what the user sees>
    notes: [] # anything the tool recorded that has no contract slot
source: # provenance, so a diff can cite where a delta came from
  tool: <plugin-name>
  reference: <url or id the adapter can resolve back to>
```

**`code` is the join key.** An adapter that cannot recover the pinned screen
codes cannot produce a diffable payload — it should return the screens it has
with `code: null` and say so in `notes`, rather than inventing codes.

## Payload 2 — design system

Returned by `/<plugin>:<plugin>-import-design-system`. Shapes match the
design-system template's sections, so `/design-system` can write the doc
from it.

```yaml
name: <design system name>
tokens:
  color: # SEMANTIC roles, never raw swatches
    - {
        role: <primary|surface|danger|…>,
        value: <token or hex>,
        usage: <one line>,
      }
  typography:
    - {
        role: <display|heading|body|caption>,
        size: <>,
        weight: <>,
        line_height: <>,
      }
  spacing: { scale: [ … ], base: <> }
  radius: { … }
  motion:
    - { role: <enter|exit|emphasis>, duration: <>, easing: <> }
components:
  - name: <component>
    variants: [ … ]
    behaviors: [ <one line each> ]
    anti_patterns: [ <one line each> ]
accessibility:
  standard: <WCAG 2.2 AA | …>
  rules: [ <contrast, focus order, target size, …> ]
source:
  tool: <plugin-name>
  reference: <url or id>
  derived: true | false # true when the adapter INFERRED tokens from generated
# code rather than reading a stored design system. vwf records this in the
# doc, because a derived system can drift silently on the next generation.
```

**`derived: true` is not a defect** — some tools genuinely have no stored design
system and reconstruct it from what they generated. It must be recorded, because
the freshness guarantee differs: a stored system is authoritative until changed,
a derived one is a snapshot of one moment.

## What stays vwf's job

The adapter returns data. **Everything downstream is vwf's**, and no adapter
gets to do it:

- Diffing a screens payload against the Screens contract.
- Routing every accepted delta through `/blueprint` — an adapter never edits
  a flow doc.
- Writing `design-system.md` from a design-system payload, gated by the
  `design-system-reviewer`.
- The naming contract in the briefs (pages `<flow>--<platform>`, frames by
  screen code, `index--<platform>`). Since export is prompt-only, this is now
  **instruction text inside the brief** addressed to whatever tool receives it —
  not something vwf enforces through an API.

## Writing an adapter

1. A plugin with two skills named `<plugin>-import-screens` and
   `<plugin>-import-design-system`, both `disable-model-invocation: false`.
2. Each returns **only** the payload (YAML or JSON), nothing before or after —
   the same discipline as vwf's subagent return contracts.
3. Unrecoverable fields are `null` with a line in `notes`. Never invent a screen
   code, a token value, or a component that the tool did not actually report.
4. Document the tool's auth in the plugin's README: adapters differ (OAuth, an
   API key, an MCP connection), and vwf deliberately knows nothing about it.
