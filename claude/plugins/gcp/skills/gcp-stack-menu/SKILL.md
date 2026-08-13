---
name: gcp-stack-menu
description: Return the Google Cloud stack templates this plugin offers, as a
  vwf
  menu payload. Invoked by /vwf:architecture and /vwf:setup when `gcp` is listed
  in the config's `stacks:` — not a general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: low
---

# gcp-stack-menu

Return the templates the `gcp` plugin offers on vwf's `backing` and `deploy`
axes, per the stack-adapter contract. **Return the payload and nothing else** —
no prose, no recommendation, no comparison. Choosing is the user's job and
presenting the choice is vwf's.

> **`disable-model-invocation` must stay `false`.** A `true` value blocks
> programmatic invocation *silently* — vwf cannot see this skill, and the menu
> comes back empty rather than erroring.

## The payload

```yaml
plugin: gcp
templates:
  - slug: firebase
    axis: backing
    name: Firebase
    summary: Firestore, Firebase Auth, Cloud Storage and FCM — the fastest
      path
      to a working product, with a local emulator for every one of them.
  - slug: cloud-sql
    axis: backing
    name: Cloud SQL · Cloud Storage · Identity Platform
    summary: Relational Postgres with a connection-pooled serverless path —
      pick when the data model is relational or the product must stay portable.
  - slug: cloud-run
    axis: deploy
    name: Cloud Run
    summary: Serverless containers, scale-to-zero, no cluster to run — the
      default for a service or fullstack project.
  - slug: gke
    axis: deploy
    name: GKE Autopilot
    summary: A managed Kubernetes cluster — for products that have outgrown
      per-service autoscaling or need workloads Cloud Run cannot host.
```

## Rules

- **This list is exhaustive.** If a composition is not here, the `gcp` plugin
  does not offer it. There is no `custom` fallback — vwf retired it in
  `config_format` 14 and halts instead, naming the two ways forward (install a
  plugin that has it, or write one). Never invent an entry to spare the user
  that halt.
- **The project axis is not ours.** GCP hosts code; it does not decide the
  language or framework a project is written in. A `gcp` menu entry never
  carries `platforms:` — that key is project-axis only.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
