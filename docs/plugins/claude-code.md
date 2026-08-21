# claude-code plugin

The `claude-code` plugin is **doctrine for writing Claude Code plugins**. It
carries what the host actually does — how it discovers your files, what the
invocation frontmatter really controls, which manifest fields matter, and how
hooks answer — with the emphasis on the parts that fail **silently**, because
those are the ones a reading of the docs does not save you from.

It also owns the `claude-code-plugin` **project** stack template, which is what
makes vwf's `plugin` platform buildable: a plugin project pinned to it gets a
language token vwf recognises, a harness that says `n/a` honestly, and
conventions `/vwf:plan` and `/vwf:execute` can size work against.

This plugin was promoted out of this repo's own
`.claude/skills/plugin-authoring/`. The doctrine had been correct and useful for
months and travelled nowhere — it lived in one checkout. What stayed behind is
only what is **this marketplace's**: the two mise tasks, the ten checker rules,
the language-plugin contract.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

Then:

```sh
claude plugin install claude-code@virajp-plugins
```

It has no dependencies and depends on nothing being installed alongside it.

## What you get

### `plugin-authoring` — auto-applying doctrine

Scoped to `plugins/**` and `**/.claude-plugin/plugin.json`, so it reads itself
in when you are editing a plugin and stays out of the way otherwise. It is
`user-invocable: false`: there is no `/claude-code:plugin-authoring` to run,
which is correct for doctrine — it governs files being edited, not a moment in
time.

The SKILL.md is deliberately short: the authored-tree table, the three silent
traps, and the version rule. Depth is in three references, read on demand.

| Reference       | Covers                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| `invocation.md` | the two frontmatter keys, the three states, constructed names and why they need a preflight |
| `manifests.md`  | `plugin.json` field by field, the marketplace entry, and the two traps that are silent      |
| `hooks.md`      | the events, the per-event verdict shapes, portable shell, and cross-invocation state        |

### The three traps, in brief

Each is worth stating here because each one produces **no error**:

1. **Frontmatter must be strict-YAML valid.** Claude's parser is lenient; a
   stricter one rejects, and a rejected skill is dropped with no message. Only a
   validator over your authored tree catches this — nothing at runtime will.
2. **`${CLAUDE_PLUGIN_ROOT}` names only its own plugin.** A path into another
   plugin's assets resolves to nothing. Cross-plugin reach is by contracted
   skill name, which makes that name a contract the other plugin must keep.
3. **A user-only skill cannot be invoked by another skill.** It is removed from
   the model's context entirely, so the caller does not get an error — it gets
   nothing, which is indistinguishable from a skill that ran and returned empty.

The third has a sharper form worth knowing if you write adapters: when a caller
**constructs** a skill name rather than reading one, three different faults —
the skill being user-only, the plugin not being installed, and an honestly empty
answer — all produce the same result. Only the last is valid, so a caller in
that shape needs a preflight that tells them apart and halts on the first two.

### `claude-code-stack-menu` / `claude-code-stack-template`

The two contracted skills of vwf's **stack-adapter contract**, both
model-invocable (a user-only adapter returns an empty menu rather than an error,
which is the trap above in its most expensive form). vwf invokes them by name
when a project's stack resolution reaches this plugin; you do not run them
yourself.

The menu offers exactly one template, `claude-code-plugin`, on the **project**
axis for platform `plugin`.

### The `claude-code-plugin` template

```yaml
axis: project
platforms: [ plugin ]
languages: [ markdown ]
optional_languages: [ bash ]
```

`languages: [ markdown ]` is load-bearing rather than descriptive. vwf's
language menu is **closed** to the union of what installed stack plugins
declare, and a token no plugin claims is `unknown` — which is a **blocking**
doctor finding that halts `/vwf:setup` and `/vwf:execute`. This plugin declaring
`markdown` is what makes a plugin project pinnable at all.

Its three language facts are thin, and each absence is an answer rather than a
gap:

| Fact       | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| LSP plugin | none — reported as *unavailable in this marketplace*, not missing |
| manifest   | `.claude-plugin/plugin.json`                                      |
| toolchain  | — not mise-managed                                                |

`bash` is **optional** because a plugin with no hooks has no shell scripts, and
reporting a missing shell toolchain for a directory of markdown would be noise.

**Most harness capabilities are `n/a`, honestly rather than sparsely.** A plugin
is loaded by its host: there is nothing to boot, nothing to stand up and nothing
to probe, so `dev`, `local_stack`, `e2e_staging`, `health`, `screenshots` and
`goldens` all read `n/a`. What remains real is validation of the authored tree,
which is the `e2e_local` equivalent.

A plugin project also takes **`deploy_template: n/a`** — it is installed from a
marketplace, not deployed.

## Why the host is part of the template, not a parameter

A VS Code extension, a Neovim plugin and a browser extension are all platform
`plugin` too. None of them is a variant of this template, and this plugin will
not answer for them: each belongs to a plugin of its own. Answering from general
knowledge would pin a project to conventions nobody wrote, which is the failure
vwf's closed menu exists to prevent.

## Relationship to vwf

`claude-code` is **not** a vwf dependency, and vwf is not one of its. The
coupling is the contract, not an install edge — vwf calls two fixed skill names
and this plugin answers them. Install it when a repo you work in ships Claude
Code plugins; install it alongside vwf when you want vwf to blueprint one.

Blueprint format **23** is what made that second case work: `plugin` is the one
`system` platform vwf covers rather than exempts, and a plugin project's flows
are its **extension points** — one per skill, command or hook. The completeness
bar those flows are held to is vwf's
(`skills/blueprint-authoring/references/plugin-contract.md`), and it is
deliberately host-agnostic; everything Claude-Code-specific is here instead.
