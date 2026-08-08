# Design Adapter Contract

vwf is **decoupled from any particular design tool**. It does not call
claude.ai/design, Lovable, Stitch, or anything else — it exchanges two
**normalized payloads** with the design adapter.

The split is deliberate and asymmetric:

| Direction  | How it works                                                           | Needs an adapter? |
| ---------- | ---------------------------------------------------------------------- | ----------------- |
| **Export** | `/vwf:screens prompt` writes design briefs to `docs/prompts/screens/…` | **No**            |
| **Import** | vwf delegates to the adapter and consumes what it returns              | **Yes**           |

**Export needs no adapter at all.** The briefs are files — the deliverable is
the markdown, and the user takes it to whatever tool they like. That half has
always been tool-agnostic; nothing about it changes.

Only **import** needs a plugin, because reading designed work back requires
speaking that tool's API.

## One adapter, many tools

vwf calls **two fixed skill names**, always:

| Skill                                                       | Returns                     |
| ------------------------------------------------------------- | --------------------------- |
| `/design-tools:design-tools-import-screens <flow> <platform>` | a **screens payload**       |
| `/design-tools:design-tools-import-design-system`             | a **design-system payload** |

**vwf never constructs a skill name from configuration.** It knows these two
names and nothing else. *Which* design tool answers is resolved **inside** the
adapter, from the project's configuration — because that is a fact about the
project, not about vwf's delegation.

## Configuration — the tool is per project

```yaml
# .config/vwf.yaml
projects:
  website: { design: lovable }
  mobile: { design: claude-design }
```

One design tool **per registry project**, not per product: a product may design
its website in one tool and its mobile app in another, and forcing both through
one tool would be a vwf-imposed constraint on a decision vwf has no stake in.

The value is a **tool token** the adapter recognises — `claude-design`,
`lovable`, `stitch` — not a plugin name. Teaching vwf a new tool means adding a
reference file to the `design-tools` plugin; it never means a config value that
has to resolve to an installed plugin.

> **Legacy fallback.** A product-wide `design.tool: <token>` (the pre-per-project
> shape) is still honored for every project, with a nudge to run
> `/vwf:setup` for the config migration.

### Both adapter skills MUST be `invocation: both`

This is the single most important rule in this contract, and getting it wrong
fails **silently**. On every target, an invocation of `user` removes the skill
from the model's context entirely and blocks programmatic invocation — so a
delegated call to such a skill does not error. vwf simply cannot see it, and the
import quietly does nothing.

An adapter whose skills are user-only is indistinguishable, at runtime, from an
adapter that returned an empty payload. `plugins:check` enforces this statically
for any plugin tagged `vwf-design-adapter`, because static checking is the only
place it is catchable.

### The preflight, because the failure mode is silence

Before delegating, `/vwf:design-system` and `/vwf:screens import` **check the
project's configured tool** rather than calling and inferring from the result —
that inference is impossible.

Three distinct halts, because they need three different fixes:

| Condition                              | Message                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| No design tool configured for the project | "No design tool for `<project>`. Set `projects.<project>.design` in `.config/vwf.yaml`." |
| Configured tool is not a supported token  | "`<project>` sets `design: <token>`, which no adapter reference supports."           |
| Adapter returned nothing / garbage        | "The design adapter returned no usable payload." (with the parse error)              |

Never collapse these into one message. "Design import failed" sends the user
looking in the wrong place two times out of three. The adapter halts on the
first two itself, with the same distinction — an unsupported tool must **halt**,
never quietly return an empty result.

## Payload 1 — screens

Returned by `/design-tools:design-tools-import-screens <flow> <platform>`. Shapes
match the flow platform template, so `/vwf:screens import` can diff it
directly against the Screens contract.

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
  tool: <tool token>
  reference: <url or id the adapter can resolve back to>
```

**`code` is the join key.** A tool whose designs cannot recover the pinned
screen codes cannot produce a diffable payload — the adapter should return the
screens it has with `code: null` and say so in `notes`, rather than inventing
codes.

## Payload 2 — design system

Returned by `/design-tools:design-tools-import-design-system`. Shapes match the
design-system template's sections, so `/vwf:design-system` can write the doc
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
  tool: <tool token>
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
- Routing every accepted delta through `/vwf:blueprint` — an adapter never edits
  a flow doc.
- Writing `design-system.md` from a design-system payload, gated by the
  `design-system-reviewer`.
- The naming contract in the briefs (pages `<flow>--<platform>`, frames by
  screen code, `index--<platform>`). Since export is prompt-only, this is now
  **instruction text inside the brief** addressed to whatever tool receives it —
  not something vwf enforces through an API.

## Adding a tool

A new design tool is a **reference file inside the `design-tools` plugin**, not
a new plugin and not a new vwf code path:

1. Add `skills/design-tools-import-screens/references/<tool>.md` and
   `skills/design-tools-import-design-system/references/<tool>.md`, each stating
   how to read that tool and how to fill the payload.
2. List the token in both skills' dispatch tables, so an unrecognised value
   still halts and a recognised one routes.
3. Each returns **only** the payload (YAML or JSON), nothing before or after —
   the same discipline as vwf's subagent return contracts.
4. Unrecoverable fields are `null` with a line in `notes`. Never invent a screen
   code, a token value, or a component the tool did not actually report.
5. Document the tool's auth in the plugin's docs: tools differ (OAuth, an API
   key, an MCP connection), and vwf deliberately knows nothing about it.
