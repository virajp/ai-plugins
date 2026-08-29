---
name: github-actions
version: 0.1.0
category: development
description: Generate and maintain this repo's delivery pipeline on GitHub
  Actions — workflow layout for monorepo and multi-repo, toolchain installation
  through mise, the gate sequence, vwf's tag-triggered release contract,
  credentials, and pinning. Use when adding or changing CI workflows.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# GitHub Actions

The repo's one delivery pipeline. This skill carries the judgment; Actions'
own YAML reference belongs to Context7 at use time.

**A repo has one pipeline.** Generating for a second CI system produces
workflows nobody runs and nobody updates — a green check that means nothing.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Placing workflows, choosing a monorepo strategy | [Resolution & layout](references/layout.md) |
| Setting up tools in a job | [Toolchain installation](references/toolchain.md) |
| Deciding what runs on push and PR | [The gate sequence](references/gates.md) |
| Wiring a release | [Release triggering](references/release.md) |
| Handling secrets, tokens, permissions | [Credentials in CI](references/credentials.md) |
| Pinning actions, adding a cache | [Pinning & caching](references/pinning-caching.md) |

**The rule that does not wait for a reference:** the pipeline installs mise and
nothing else. Every other tool comes from the repo's mise config.
