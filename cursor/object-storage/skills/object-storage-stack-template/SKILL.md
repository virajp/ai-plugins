---
name: object-storage-stack-template
description: Return one object-storage stack template as a vwf template payload
  — this plugin ships none, so every slug is an error naming the cloud plugins
  that do. Invoked by /architecture and /setup after the user picks from
  the object-storage menu — not a general-purpose skill.
---

# object-storage-stack-template

Per the stack-adapter contract, this skill returns the template payload for the
slug the caller names. **This plugin ships no templates**, so there is no valid
slug and every call is an error.

> **`invocation` must stay `both`** — see `object-storage-stack-menu`. The
> failure this plugin exists to avoid is silence, and a `user` skill is silent.

## How to answer — always this

Return the error below, filling in the slug the caller named. Say what this
plugin is, where the real answer lives, and stop.

```text
ERROR: object-storage ships no stack template, so "<slug>" is not one of its
slugs — it has none.

object-storage is a contract-only capability plugin: it owns the neutral
requirements every object store must satisfy, and no provider of its own,
because every object store worth using belongs to a cloud.

The flavour comes from the project's cloud plugin:
  - gcp         — Cloud Storage
  - cloudflare  — R2, once that plugin is unparked past Zero Trust Access

Ask that plugin's own -stack-template skill. The requirements the chosen store
must satisfy are in this plugin's contract.
```

**This is an error, not an empty result.** Returning nothing, or an empty
payload, is indistinguishable from an adapter that failed to load — the exact
silent failure the stack-adapter contract exists to prevent.

## Never do these

- **Never synthesize a template** for a slug from general storage knowledge, or
  from a wire protocol. A template records decisions — lifecycle policy,
  consistency, egress cost, retention mechanism — and a protocol supplies none
  of them. Prose true of nothing in particular reads as a decision that was
  made, which is worse than the error above.
- **Never answer on another plugin's behalf.** Naming which plugins have a
  template is the help; returning their payload is not this skill's to give.
- **Never downgrade to a warning and continue.** vwf's caller needs a halt it
  can act on, not an advisory it can miss.

## If a caller asks what the capability requires

Read `%%AI_PLUGINS_ROOT%%/assets/contract.md` and answer from it — the rule against
proxying bytes, signed-URL expiry, lifecycle as a bucket policy, prefix-scoped
access, egress cost. That is a legitimate question with a real answer, and it is
the whole reason this plugin exists.
