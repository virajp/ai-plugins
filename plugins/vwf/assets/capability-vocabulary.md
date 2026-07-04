# Capability Vocabulary

Shared by `/vwf:architecture` (the registry elicitation offers these tokens as
MCQ options) and the `architecture-writer` agent (which records them). Keep this
list the single source of truth; both surfaces read it rather than carrying
their own copy.

Capabilities are stack-agnostic feature flags — the gates that decide which
deep, stack-specific questions `blueprint` asks. Pick all that apply per
project; add Other for anything not listed. Extensible — add new capabilities as
the system grows.

- **Data & storage:** `document-datastore`, `relational-datastore`,
  `object-file-storage`, `cache-layer`, `search-index`
- **Async & messaging:** `durable-workflows`, `message-queue`, `pub-sub`,
  `scheduled-jobs`
- **Realtime & comms:** `realtime-sync`, `realtime-location`,
  `push-notifications`, `email`, `sms`, `voice-audio`
- **Auth & identity:** `third-party-auth`, `custom-claims-rbac`, `operator-rbac`
- **Commerce:** `payments-subscriptions`
- **Geo:** `maps-navigation`
- **Web rendering:** `ssr`, `ssg`, `cms-content`, `seo`
- **Mobile:** `offline-first`, `deep-linking`, `device-permissions`
- **Observability & governance:** `distributed-tracing`, `audit-log`,
  `rate-limiting`, `runtime-settings`
