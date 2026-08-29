---
name: Claude Code plugin
axis: project
kind: language-bundle
components:
- language/markdown@generated
platforms:
- plugin
---

# plugin — Claude Code plugin

An **extension for Claude Code**: a directory of markdown and a manifest, loaded
by the host and registered against its extension points. It has no runtime of
its own, builds no artifact, and is installed from a marketplace rather than
deployed. The project's registry `platforms:` is `[ plugin ]` — screenless, so
its flows are `index.md` alone and it never reaches the canvas, mockups or the
scratchpad; what its flows *do* need is the plugin contract's five extra
surfaces (host and extension point, invocation surface, what the host supplies,
gates and halts, artifacts written).

`plugin` sits under the `system` role, and is the one `system` platform vwf
covers in the blueprint. The reason is that a plugin's behavior is entirely
contract — what it refuses, what it writes, what the host hands it — with no
implementation to hide it in.

## Stack

- **Markdown is the language.** A skill, an agent and a reference are all
  markdown with frontmatter; the manifest is the one JSON file. There is no
  compiler, no bundler and no dependency graph, which is why the harness below
  is mostly `n/a` rather than sparsely filled in.
- **Discovery is by directory convention.** `skills/<name>/SKILL.md`,
  `agents/<name>.md` and `hooks/hooks.json` are found by their paths. None of
  them is listed in the manifest, so adding one is a single file — and the
  corollary matters more: a file in the wrong place is not an error, it is
  simply never discovered.
- **Shell is optional.** Hook scripts sit beside `hooks/hooks.json` and are the
  only executable code a plugin holds. A plugin with no hooks has none, which
  is why `bash` is an optional language rather than a required one.
- **Tooling** is the repo axis's: whatever validates the authored tree, formats
  what it is allowed to format, and regenerates the marketplace manifest.

## Contract surfaces

- **The invocation state is the flow's most consequential decision**, and the
  wrong one fails **silently**. A skill marked user-only is removed from the
  model's context entirely, so a skill that delegates to it does not get an
  error — it gets nothing, indistinguishable from a skill that ran and returned
  empty. Pin the state and the reason in the flow's Invocation surface section.
- **Gates and halts are most of a workflow plugin's contract.** What a skill
  refuses to do, and what it says when it refuses, is the observable behavior
  worth testing. Each one earns an acceptance criterion.
- **Artifacts written are the other observable.** A plugin's effects are files:
  what lands, where, and whether it is committed or ignored.
- **`${CLAUDE_PLUGIN_ROOT}` names only its own plugin.** A path into another
  plugin's assets resolves to nothing at runtime, with no error. Cross-plugin
  reach is by **contracted skill name**, never by path — which makes the name a
  contract the other plugin must keep.
- **Frontmatter must be strict-YAML valid.** The host's parser is lenient; a
  stricter one rejects, and a rejected skill is dropped without a message.

## Harness

Most vwf capabilities are `n/a` here, and that is the honest answer rather than
a sparse one: a plugin is loaded by its host, so there is nothing to boot,
nothing to stand up, and nothing to probe. `dev`, `local_stack`, `e2e_staging`,
`health`, `screenshots` and `goldens` all read `n/a`.

What remains real is **validation of the authored tree** — that every manifest
parses, every frontmatter block is strict-YAML valid, every declared dependency
resolves, and every hook script named exists and is executable. That is the
`e2e_local` equivalent for a plugin, and the repo supplies the task.

## Distribution

Installed from a **marketplace**, not deployed: pair this with
`deploy_template: n/a`. The manifest's `version` is what an install pins to and
what an update compares, so shipping a change means bumping it — a plugin
edited without a version bump keeps advertising the old one.

Where the marketplace manifest is generated from the plugin manifests, it is
generated **and** committed, which is a staleness class of its own: a manifest
edited without a regenerate is invisible to every other check. A freshness gate
on that one file is what closes it.
