---
name: container-image
version: 0.1.0
category: development
description: An OCI image as this product's deploy artifact, on any container
  host — when a provider-neutral target is the right trade, promoting one digest
  rather than rebuilding per environment, how configuration and secrets reach
  the running image, and the readiness and reachability the host depends on.
license: MIT
allowed-tools: Read Grep Glob Edit Write Bash
---

# Container image · any container host

The deploy target that belongs to no cloud. This skill carries the judgment;
a runtime's command surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this target | [Pick & trade](references/pick-and-trade.md) |
| Releasing, promoting, or wiring the registry | [Promotion & release](references/promotion.md) |
| Passing configuration or secrets to the image | [Config & secrets](references/config-and-secrets.md) |
| Probes, readiness, or keeping a project private | [Health & reachability](references/health-and-reach.md) |

Writing the build file or its ignore file is the sibling
`container-build-file` skill, which applies automatically while you edit
them.

**The rule that does not wait for a reference:** the same digest is promoted
between environments, never rebuilt for one. A rebuild passes every test and
still ships something the tests never saw.

**The local stack is not this skill's subject**, even though it uses the same
runtime. That is a separate concern with its own doctrine — a repo needs a
local stack or a deploy image or both, and the two decisions are unrelated.
