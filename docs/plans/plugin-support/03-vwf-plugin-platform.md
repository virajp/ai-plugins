# WS3: Make `plugin` a first-class blueprint platform

vwf already knows what a `plugin` project *is* — `topology-detection.md`'s
"Platforms by evidence" table defines it as "an extension manifest naming a host
application and the extension points it registers against; it has no runtime of
its own." What it has no answer for is what such a project's **contract** looks
like: every `system` platform is exempt from blueprint coverage, with the
exemption's own comment conceding "a doc shape for them is a later effort."

This is that effort, scoped to `plugin` alone.

Three parts: the vwf contract change (3a), the new `claude-code` plugin that
houses the stack template (3b), and a plain-`parseArgs` CLI template so the
installer has an honest pin (3c).

---

## 3a. vwf — lift the exemption for `plugin` only

Blueprint format **22 → 23**. Additive: no spelling is retired, so
`skills/setup/references/format-lineage.md` needs no new row. `config_format`
stays 15.

| File                                                             | Change                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `assets/templates/registry.yaml`                                 | The obligations comment block reads "every `data` and `system` platform — exempt from blueprint coverage." Carve `plugin` out and state what it obliges, in the same register the `service` and `iac` entries use.                                                                               |
| `skills/setup/references/topology-detection.md`                  | The matching bullet under "What each platform obliges". The `plugin` row in "Platforms by evidence" already exists and stays as-is.                                                                                                                                                              |
| `assets/standard-flows.md`                                       | `plugin` joins the screenless list explicitly and gets the sentence `cli` has: **a plugin project's flows are its extension points** — one flow per skill or command, named for what it does, `index.md` alone, no standard-flow mandates, never reaching the canvas, mockups or the scratchpad. |
| `skills/blueprint-authoring/references/plugin-contract.md` (new) | The completeness bar — see below.                                                                                                                                                                                                                                                                |
| `agents/blueprint-surveyor.md`                                   | Coverage conditions stop treating `plugin` as exempt; an unrepresented `plugin` project is a hole again.                                                                                                                                                                                         |
| `agents/blueprint-reviewer.md`                                   | A `plugin` variant of the flow mode, gated on the new bar.                                                                                                                                                                                                                                       |
| `assets/blueprint-format`                                        | `22` → `23`.                                                                                                                                                                                                                                                                                     |
| `.claude-plugin/plugin.json`                                     | vwf `18.4.0` → `19.0.0`.                                                                                                                                                                                                                                                                         |

### The `plugin-contract.md` bar

Sibling to `flow-contract.md`. What a plugin flow must pin down, all of it
code-independent:

- **The host and the extension point** — which application, and which of its
  extension mechanisms this flow registers against.
- **The invocation surface** — who triggers it and how; for Claude Code, which
  of the three invocation states applies (user-and-model, model-only
  auto-applying, user-only) and why.
- **What the host supplies** — the inputs the extension point hands over, which
  is the plugin equivalent of a request body.
- **Gates and halts** — the conditions under which the flow refuses to proceed,
  and what it tells the user. For a workflow plugin this is most of the
  contract.
- **Artifacts written** — what lands on disk and where, which is what makes a
  plugin flow's effects observable.
- **Acceptance** — the same bar every flow carries.

This is deliberately host-agnostic. Everything Claude-Code-specific lives in the
stack template (3b), which is the line vwf's technology-free guard already
draws.

### One extra vwf fix — WS4 is blocked without it

`/vwf:design-system` §1 offers to proceed when no project declares a screen
platform. But §3 then preflights the design adapter and **halts** on "no
`design` on any screen-platform project" — vacuously true for a repo that has
none. Meanwhile a `cli` project still requires the doc's **Terminal UX**
section, and §1 itself says that section is "always elicited in text; the canvas
neither designs nor imports it."

So a cli-and-plugin-only repo cannot get a design system at all today.

**Fix:** add a text-only path — when the registry declares no screen platform,
skip §3 entirely and elicit Terminal UX directly, per
`design-system-authoring`'s terminal-ux reference. The adapter is only ever
needed for screens.

---

## 3b. New plugin — `claude-code` (the 15th)

vwf's rule is that stack templates live in a stack plugin, never in vwf. A
`plugin`-platform template therefore needs a home, and this is it.

```text
plugins/claude-code/
  .claude-plugin/plugin.json          name, version 0.1.0, description
  skills/claude-code-stack-menu/      model-invocable — a user-only adapter
  skills/claude-code-stack-template/  returns an empty menu, silently
  skills/plugin-authoring/            promoted from .claude/skills/plugin-authoring/
  stacks/project/claude-code-plugin.md
```

### The template frontmatter

```yaml
---
axis: project
platforms: [ plugin ]
name: Claude Code plugin
languages: [ markdown ]
optional_languages: [ bash ]
frameworks: []
dependencies: []
---
```

`languages: [ markdown ]` is what keeps the token out of `unknown = blocking`.
Per `assets/stack-vocabulary.md`, the union of what installed stack plugins
declare *is* the vocabulary — so this plugin claiming `markdown` is what makes
it known. Its facts:

| Fact       | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| LSP plugin | none — reported as *unavailable in this marketplace*, not as a finding |
| manifest   | `.claude-plugin/plugin.json`                                           |
| toolchain  | — (not mise-managed)                                                   |

`bash` is optional because a plugin with no hooks has none.

### The template body, and the promotion

The body covers what a Claude Code plugin's contract surface is —
directory-convention discovery (`skills/`, `agents/`, `hooks/`), the invocation
policy's three states and why the wrong one fails *silently*, the
`${CLAUDE_PLUGIN_ROOT}`-names-only-its-own-plugin trap, and hooks with their
per-event verdict shapes.

That is exactly the doctrine `.claude/skills/plugin-authoring/references/`
already holds. **Promote it rather than re-author it**, and delete the
`.claude/` copy so there is one source. This repo then consumes its own plugin,
which is the point of the exercise.

### Also needed

- `docs/plugins/claude-code.md`.
- `mise run plugins:marketplace` to regenerate
  `.claude-plugin/marketplace.json`.
- The Plugins table in `CLAUDE.md` and `readme.md`, and **the plugin count moves
  14 → 15 everywhere it is stated in prose** — `plugins:marketplace --check`
  validates the manifest, not the sentences about it.

---

## 3c. `typescript` — a plain-`parseArgs` CLI template

`typescript-effect-cli` is the only `cli` template and it prescribes
`@effect/cli` on `@effect/platform-node`. This repo's CLI is `node:util`'s
`parseArgs`, three runtime dependencies and tsup. Pinning it to the Effect
template would make `doctor`'s framework-vs-manifest check report drift on every
run — correctly, which is the problem.

Add `plugins/typescript/stacks/project/typescript-parseargs-cli.md`:

```yaml
---
axis: project
platforms: [ cli ]
name: TypeScript · parseArgs CLI
languages: [ typescript ]
optional_languages: []
frameworks: []
dependencies: [ tsup, vitest ]
---
```

Its conventions are already written down in this repo and should be lifted from
the working code rather than invented:

- `node:util`'s `parseArgs` with `strict: true`, so a retired flag errors
  *naming itself* instead of being a silent no-op.
- One table driving both parsing and help, so a flag cannot be parsed but
  undocumented (`cli/src/args.ts`).
- `multiple: true` for repeatable flags — the array kind whose absence in citty
  silently dropped `--user vwf --user devtools` down to one name.
- Bundling to a single `.mjs`, so `engines.node` holds below Node 22.18's
  type-stripping floor.
- Testing the **built** artifact, not the source: a packaging mistake only shows
  up in the bundle.

Add the menu entry in `plugins/typescript/skills/typescript-stack-menu/SKILL.md`
and bump the typescript plugin's minor version.

> **Pre-existing drift, flagged rather than silently fixed:** that SKILL.md's
> Rules section still says "Every project entry carries a `role`, and no two
> share one." Format 22 replaced `role` with `platforms` in the payload — which
> the payload above it already reflects — and two `cli` templates now coexist
> deliberately. Correcting it belongs in the same edit if you want it.

---

## Verification

- `mise run plugins:marketplace --check` and `mise run plugins:check` — the new
  plugin passes all nine rules, including the model-invocability contract on the
  two adapter skills and root-relative reference resolution inside
  `claude-code`.
- `claude plugin marketplace add` +
  `claude plugin install
  claude-code@virajp-plugins` in a scratch checkout —
  the `target-verifier` agent's job.
- Invoke `/claude-code:claude-code-stack-menu` and confirm the `plugin` entry
  comes back non-empty.
- Invoke `/typescript:typescript-stack-menu` and confirm **two** `cli` entries.
- On a scratch repo with a `cli`-only registry, `/vwf:design-system` reaches
  Terminal UX elicitation instead of halting on the adapter preflight.
