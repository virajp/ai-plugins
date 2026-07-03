# Common Package — Reference Stack

`packages/common` is the shared kernel of the backend monorepo — the one place
schemas are defined and the one place third-party SDKs are touched. TypeScript

- [Effect](https://effect.website), consumed **only** via subpath exports (no
  single entry point).

## The two placement rules (enforced)

1. **All shared schemas live here** — every domain schema is an Effect `Schema`,
   one directory per entity under a `./schemas/<entity>` export subpath,
   exported as a `Schema<Entity>` namespace. No other project defines a shared
   data schema.
2. **All third-party integrations go via here** — `firebase-admin`, maps
   clients, payment/subscription REST APIs, telemetry SDKs are dependencies of
   this package **only**; every other project consumes the wrappers.
   (Downstream, third-party SDKs appear at most as devDependencies for test
   typing — never imported in `src/`.)

## Shape

- **`./effect`** — the Effect facade the whole codebase imports from: re-exports
  the Effect modules plus house helpers (`withSpan`, the centralized schema
  decoders mapping failures to the shared error type).
- **Integration wrappers as Effect services** — one subpath per integration
  (e.g. `./firebase`: app init, Firestore typed CRUD, Auth, FCM push; a maps
  subpath per API; a REST wrapper per external vendor). Two idioms:
  `Context.Tag` + `Layer.effect`, or `Effect.Service` classes with accessors.
- **`./services`** — the aggregate DI layer: one context tag bundling every
  wrapped integration, with a `make…Live(useEmulator)` constructor. Downstream
  projects provide this single layer and destructure what they need.
- **`./telemetry`** — the OpenTelemetry layer (OTLP traces/metrics/logs).
- **`./utils`** — the shared error type (`MyError`-style coded errors), typed
  logging, ID generation, small HTTP helpers.

## Conventions

- Every public service method is wrapped in `withSpan` (OpenTelemetry).
- Schema decoding goes through the centralized parser (permissive on excess
  properties, all errors collected, failures as the shared coded error).
- Tests: Vitest + `@effect/vitest`, colocated `*.test.ts`, no emulator needed
  (pure schema/logic).
