---
name: gcp
version: 0.1.0
category: development
description: Google Cloud as this product's provider — how the meter actually
  runs and the guardrails that go in first, least-privilege identity without a
  key file, which services can run locally and which cannot, and what a private
  plane looks like here. The provider-wide judgment every Google Cloud service
  in this repo inherits.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Google Cloud

The provider half of this repo's cloud stack: what spans the services, written
once. Each service's own skill cites this rather than restating it, and carries
only what is that service's alone.

This skill is judgment — which decision to take and what it costs. The API
surface, the role catalogue and every current price belong to Context7 and the
console at use time, not here.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing between services, reviewing a design for cost, explaining a bill | [Cost doctrine](references/cost-doctrine.md) |
| Wiring service auth, granting access, reviewing for privilege | [Identity & IAM](references/identity-and-iam.md) |
| Setting up local development or E2E tests | [Local development map](references/local-development-map.md) |
| Keeping a surface off the public internet | [Networking & private plane](references/networking-and-private-plane.md) |

**The three rules that do not wait for a reference:**

1. **One service account per workload, never the default.** The defaults carry
   Editor on the project.
2. **No service-account JSON keys.** Every context has a keyless mechanism, and
   the code is identical across all of them.
3. **Observability leaves through OTLP.** The provider's trace, metrics and
   logging services are sinks the collector exports to — never an SDK product
   code imports. `assets/contracts/observability.md` is why.
