---
name: doppler
version: 0.1.0
category: development
description: Doppler as this product's secrets manager — when a hosted platform
  holding the secrets is the right answer, how it satisfies the secrets contract
  and where it deliberately stops, the two-injector split that makes the variable
  name the contract, wiring and credentials, cost shape, and why there is no
  local stack to compose. Auto-applies when editing Doppler configuration.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/doppler.yaml"
  - "**/doppler.yml"
  - "**/.doppler.yaml"
  - "**/.config/doppler.yaml"
---

# Doppler

A hosted platform holds the secrets; the CLI injects them into a process at the
boundary. This skill carries the judgment; the CLI's current flags belong to
Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this provider | [Pick & trade](references/pick-and-trade.md) |
| Checking it against the secrets contract | [Contract satisfaction](references/contract-satisfaction.md) |
| Designing around dev and deployed having different suppliers | [Two injectors, one set of names](references/two-injectors.md) |
| Wiring the injector, the toolchain, credentials | [Integration & access shape](references/access-shape.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Running tasks locally or in CI | [Local stack](references/local-stack.md) |

**Two rules that do not wait for a reference:** wrap the repo's own task and
never the application (`doppler run -- <task>`), and never run a command whose
normal output is a secret **value** — a scrollback and a CI log are both more
widely readable than the repo.
