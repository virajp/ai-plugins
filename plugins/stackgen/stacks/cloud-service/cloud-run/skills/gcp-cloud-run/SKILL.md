---
name: gcp-cloud-run
version: 0.1.0
category: development
description: Cloud Run as this product's deploy target — when serverless
  containers are the right trade and when they stop being it, the three settings
  that decide cost and behaviour, the image contract and digest promotion, the
  release pipeline behind mise tasks, service identity, and readiness. Use when
  deploying, sizing, or debugging a Cloud Run service.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloud Run · Artifact Registry

Serverless containers on Google Cloud. This skill carries what is Cloud Run's
alone; the provider-wide judgment it sits on — cost doctrine, IAM, the emulator
map, the private plane — is the `gcp` skill's, cited and never restated. The
command surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this target | [Pick & trade](references/pick-and-trade.md) |
| Configuring a service, sizing it, debugging its behaviour | [Service doctrine](references/service-doctrine.md) |
| Explaining or reducing the bill | [Cost shape](references/cost-shape.md) |
| Granting a service what it needs, wiring service-to-service calls | [Identity shape](references/identity-shape.md) |
| Running it locally or in tests | [Local dev](references/local-dev.md) |
| Writing or changing the build file, pushing to the registry | [Artifact](references/artifact.md) |
| Wiring the release, or changing what triggers it | [Pipeline](references/pipeline.md) |
| Wiring readiness, liveness, or the health endpoint | [Health](references/health.md) |

**The one rule that does not wait for a reference:** every service gets a
maximum-instance ceiling. Without one a runaway loop or a traffic spike becomes
an invoice, and in front of a connection-limited datastore it becomes a total
outage rather than a bounded one.
