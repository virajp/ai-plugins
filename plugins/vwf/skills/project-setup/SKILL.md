---
name: project-setup
version: 0.1.0
category: development
description: Onboarding and migration discipline for bringing a repo into vwf's
  format and keeping it current — topology detection, consent-gated dry-run
  migration, the blueprint format version + drift map, and the CLAUDE.md vwf
  section. Used by /vwf:setup; trigger when onboarding a repo to vwf or migrating
  an existing one to the latest blueprint format.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Project Init

Bring a repo into vwf's `docs/blueprint/` format and keep it current as the
format evolves. Onboarding is **safe by default**: detect, propose a dry-run
plan, get consent, operate in a worktree, never delete.

| Topic                                                                                                 | When to read                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Topology detection](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/topology-detection.md)     | Inferring monorepo/polyrepo/workspace, project types, and stacks from repo signals               |
| [Workspace structure](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/workspace-structure.md)   | The enforced workspace shape (parent + backend/frontend submodules), reference stacks, and rules |
| [Migration & consent](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/migration-and-consent.md) | The dry-run + per-batch-consent + worktree discipline; what may move                             |
| [Format versioning](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/format-versioning.md)       | The blueprint format version, the stamp, and the drift → migration map                           |
| [CLAUDE.md section](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/claude-md.md)               | What the vwf section merged into a project's CLAUDE.md must contain                              |

Use with `/vwf:setup`, which detects topology, migrates with consent,
orchestrates the foundations (mise, architecture, design-system), and stamps the
format version.
