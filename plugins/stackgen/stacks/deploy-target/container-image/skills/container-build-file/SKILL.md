---
name: container-build-file
version: 0.1.0
category: development
description: Writing the repo's container build file and its ignore file — one
  shared multi-stage build per repo rather than one per project, and the ignore
  file as a correctness file that keeps host build state and credentials out of
  published layers. Auto-applies when editing a build file or ignore file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/Dockerfile"
  - "**/Dockerfile.*"
  - "**/*.dockerfile"
  - "**/Containerfile"
  - "**/.dockerignore"
  - "**/.containerignore"
---

# The container build file

Two subjects, and the second is the one most often treated as optional when
it is not.

| Doing | Read |
| --- | --- |
| Structuring the build, or adding a deployable | [The artifact](references/artifact.md) |
| Writing or reviewing the ignore file | [Hygiene](references/hygiene.md) |

**The rule that does not wait for a reference:** one build file per repo,
parameterized by the target project — not one per deployable. Forked copies
diverge accidentally, and the divergence surfaces as one environment
breaking long after the change that caused it.

Choosing this deploy target at all, promotion, configuration and health are
the sibling `container-image` skill.

**A compose file is not this skill's subject.** The local stack is a
separate concern that happens to share a runtime; nothing here applies to
it.
