---
name: plugin-authoring
description: Authoring discipline for Claude Code plugins — directory-convention
  discovery, the invocation frontmatter and the silent failure the wrong state
  causes, manifest fields and the marketplace traps, and hooks. Auto-applies
  when editing anything under plugins/. Read the reference matching what you
  are changing.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/**"
  - "**/.claude-plugin/plugin.json"
---

# Plugin Authoring

A Claude Code plugin is a **directory of markdown and one manifest**. There is
no build step and no intermediate format: what you author is exactly what a
user installs. That is the property most of the discipline below protects.

## What is authored where

| Path                         | Is                                                       |
| ---------------------------- | -------------------------------------------------------- |
| `.claude-plugin/plugin.json` | the manifest — name, version, description, servers, deps |
| `skills/<name>/SKILL.md`     | a skill; auto-discovered, never listed in the manifest   |
| `skills/<name>/references/`  | on-demand prose the SKILL.md points at                   |
| `agents/<name>.md`           | a subagent; auto-discovered                              |
| `hooks/hooks.json`           | hooks, plus the scripts beside them                      |
| `assets/`                    | shared doctrine and data the skills read                 |
| `stacks/<axis>/…`            | stack templates, on a plugin that is a vwf stack adapter |
| `vendor/`                    | provenance for vendored third-party skills               |

**Discovery is by path, and that cuts both ways.** Adding any of these is one
edit — create the file, register nothing. But a file in the wrong place is not
an error either: it is simply never discovered, and nothing says so.

## The three traps

Each is silent. Nothing errors, and the mistake surfaces somewhere else — or
nowhere.

1. **Frontmatter must be strict-YAML valid.** Claude's own parser is lenient; a
   stricter one rejects, and a rejected skill is dropped with **no error**. A
   validator over the authored tree is what catches this class; nothing at
   runtime will.
2. **`${CLAUDE_PLUGIN_ROOT}` is *this* plugin's root, and nothing spells
   another's.** A reference to an asset a different plugin owns resolves to
   nothing at runtime. Reach across plugins by **contracted skill name**
   instead, and rely on the caller having it — which makes that name a contract
   the other plugin must keep. This class shipped undetected for months in a
   real marketplace before a checker found it.
3. **The invocation state is not cosmetic.** A user-only skill is removed from
   the model's context entirely, so it **cannot be invoked by another skill**,
   and the caller gets no error — it gets nothing. See
   [invocation.md](references/invocation.md); this is the one worth reading
   before you write the frontmatter rather than after.

## Versions

A plugin's `version` is what an install pins to and what `claude plugin update`
compares — **bump it to ship a change**, or the marketplace keeps advertising
the old one and nobody's update does anything. Plugin and skill version numbers
are independent by design; a plugin may hold skills versioned on their own
cadence, so nothing cross-checks them.

## References

Read the one matching the change; do not read all three.

| Reference                                 | Covers                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| [invocation.md](references/invocation.md) | the two frontmatter keys, the three states, and which one a skill needs |
| [manifests.md](references/manifests.md)   | `plugin.json` fields, the marketplace entry, and the two silent traps   |
| [hooks.md](references/hooks.md)           | the hook events, `hooks.json`, verdict shapes, and script portability   |

> A repo that publishes a marketplace usually adds gates of its own — a
> validator over the authored tree, a freshness check on the generated
> marketplace manifest, a formatter exclusion for authored prose. Those are the
> repo's, not this skill's; look for a project-level authoring skill beside
> them.
