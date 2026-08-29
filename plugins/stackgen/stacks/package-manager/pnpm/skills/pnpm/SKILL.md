---
name: pnpm
version: 0.1.0
category: development
description: pnpm as the repo's only package manager — manifest discipline,
  lockfile and supply-chain posture, and the workspace layout for a monorepo.
  Auto-applies when editing package.json, pnpm-workspace.yaml or .npmrc.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/package.json"
  - "**/pnpm-workspace.yaml"
  - "**/.npmrc"
---

# pnpm

Dependencies, locking and workspace layout. Read the reference matching your
task.

| Doing | Read |
| --- | --- |
| Editing a package.json — scripts, exports, deps | [Manifest discipline](references/manifest-discipline.md) |
| Workspace layout, catalogs, linking, supply chain | [Workspace & supply chain](references/workspace.md) |

**The rule that does not wait for a reference:** one package manager, one
lockfile, committed, and CI installs frozen.
