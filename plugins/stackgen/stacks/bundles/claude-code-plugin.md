---
name: Claude Code plugin
axis: project
kind: language-bundle
components:
- language/markdown@0.1.0
- language/bash@0.1.0
platforms:
- plugin
---

# plugin — Claude Code plugin

An **extension for Claude Code**: a directory of markdown and a manifest, loaded
by the host and registered against its extension points. It has no runtime of
its own, builds no artifact, and is installed rather than deployed.

The project's registry `platforms:` is `[ plugin ]` — screenless, so its flows
are `index.md` alone and it never reaches the canvas, mockups or the scratchpad.
What its flows *do* need is the plugin contract's five extra surfaces: host and
extension point, invocation surface, what the host supplies, gates and halts,
and artifacts written.

`plugin` sits under the `system` role, and is the one `system` platform vwf
covers in the blueprint. The reason is that a plugin's behavior is entirely
contract — what it refuses, what it writes, what the host hands it — with no
implementation to hide it in.

## Stack

- **Markdown is the language.** A skill, an agent and a reference are all
  markdown with frontmatter; the manifest is the one JSON file. There is no
  compiler, no bundler and no dependency graph, which is why the harness below
  is mostly `n/a` rather than sparsely filled in.
- **Shell is optional.** Hook scripts are the only executable code a plugin
  holds, and a plugin with no hooks has none — so `bash` is an optional
  language rather than a required one.
- **Tooling** is the repo axis's: whatever validates the authored tree, formats
  what it is allowed to format, and generates whatever the host must be handed.

## Harness

Most vwf capabilities are `n/a` here, and that is the honest answer rather than
a sparse one: a plugin is loaded by its host, so there is nothing to boot,
nothing to stand up, and nothing to probe. `dev`, `local_stack`, `e2e_staging`,
`health`, `screenshots` and `goldens` all read `n/a`.

What remains real is **validation of the authored tree** — that every manifest
parses, every frontmatter block is valid, every declared dependency resolves,
and every hook script named exists and is executable. That is the `e2e_local`
equivalent for a plugin, and the repo supplies the task.

## Distribution

Installed from a **marketplace**, not deployed: pair this with
`deploy_template: n/a`. What a version means, how the marketplace entry is
produced, and the traps that ride on both are **the authoring repo's own
doctrine**, deliberately not carried here — a stack template says what the
stack is, not how to work in it.

## Where the authoring rules are

Two bodies of doctrine sit behind this stack, and neither is in this file:

- **What makes a skill, agent or hook valid** — invocation states and the
  silent failure a wrong one causes, strict-YAML frontmatter, hook verdict
  shapes, MCP and LSP wiring — is `assets/artifact-doctrine.md`, which the
  generator writes against and the reviewer gates on.
- **How a plugin is structured, packaged and registered** is the authoring
  repo's own, and is not distributed.
