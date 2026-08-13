---
name: project-setup
description: Onboarding and migration discipline for bringing a repo into vwf's
  format and keeping it current — topology detection, consent-gated dry-run
  migration, the blueprint format version + drift map, and the CLAUDE.md vwf
  section. Used by /setup; trigger when onboarding a repo to vwf or migrating
  an existing one to the latest blueprint format.
---

# Project Init

Bring a repo into vwf's `docs/blueprint/` format and keep it current as the
format evolves. Onboarding is **safe by default**: detect, propose a dry-run
plan, get consent, operate in a worktree, never delete.

| Topic                                                                                                 | When to read                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [Topology detection](references/topology-detection.md)     | Inferring topology + linkage, resolving the base repo, roles/platforms, and stacks from repo signals                    |
| [Structure](references/workspace-structure.md)             | The topology menu (repo / monorepo / multi-repo), the linkage question, the stack-template axes, and the common-package rules |
| [Migration & consent](references/migration-and-consent.md) | The dry-run + per-batch-consent + worktree discipline; what may move                                  |
| [Format versioning](references/format-versioning.md)       | The blueprint format version, the stamp, and the drift → migration map                                |
| [CLAUDE.md section](references/claude-md.md)               | What the vwf section merged into a project's CLAUDE.md must contain                                   |

Use with `/setup`, which detects topology, migrates with consent,
orchestrates the foundations (mise, architecture, design-system), and stamps the
format version.
