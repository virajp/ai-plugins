# Runtime Settings

Runtime-changeable configuration — including feature flags — lives in **one
cached, schema-typed settings document**, not a third-party flag service and not
env vars. Cross-cutting token: `runtime_settings: cached-settings-doc`.

## Default contract

- **One settings document** (e.g. `settings/global` in the primary datastore)
  holds every value an operator may change at runtime: feature toggles, limits
  and caps, mode switches (e.g. a review-mode toggle), rollout knobs.
- **Schema-typed with defaults**: the document decodes against a schema owned
  like any other shared schema; every key has a default, so a missing key is
  never an error and the document can start empty.
- **Read through a TTL cache**: consumers read via a cached accessor (minutes,
  not seconds) — a settings read never adds a datastore round-trip per request;
  a change propagates within the TTL, which is the stated freshness contract.
- **Operator-editable, audited**: the console exposes the settings surface;
  every change is an audit event (settings changes are privileged mutations).
- **The boundary with env config**: env vars/secrets (`environment.md`) are
  *deployment* configuration — connection strings, keys, endpoints — changed by
  a deploy. Runtime settings are *product behavior* an operator changes without
  a deploy. A value that never changes at runtime is code or env, not a setting.
- **Flags are settings**: a feature flag is a boolean (or enum) key in the same
  document with the same schema/cache/audit path — no separate flag
  infrastructure until a product genuinely needs percentage rollouts or per-user
  targeting (that need is elicited, not assumed).

## Elicit per product

- The initial key set (each key: name, type, default, who flips it, blast
  radius) — grown by blueprint passes as entities add knobs.
- The cache TTL (the freshness contract) and whether any key needs
  faster-than-TTL propagation (that key may not belong here).

## Blueprint expansion

- A small **settings entity** (`docs/blueprint/settings/`) owns the document
  schema and the console edit surface; `conventions.md#config` states the
  boundary (env vs runtime settings) and links both. Entity docs reference the
  keys they read.
