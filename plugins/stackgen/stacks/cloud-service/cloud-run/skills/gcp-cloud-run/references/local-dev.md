# Local dev — Cloud Run

**There is no emulator, and none is wanted.** Run the container directly — the
dev task, or the container runtime against the built image — pointed at the
backing bundle's local services. You are testing your process, not the platform.

The provider's full emulator map, and what each service means for vwf's
`local_stack` capability, is the `gcp` skill's local-development reference. The
harness contract itself is `assets/contracts/local-stack.md`.

## What this component contributes to the local stack

**Nothing.** The local stack is the *backing* bundle's — the datastore, the
emulator suite, whatever the E2E suite actually talks to. This component's
contribution is that the process under test is the same process that will be
deployed, which is a property of the image rather than of a local service.

That is the line `assets/contracts/local-stack.md` draws between the two jobs
containers do: the local stack and the deploy artifact are unrelated, and a repo
needs either, both, or neither.

## What does not reproduce locally

Four platform behaviours are production-only, and designing around them is
cheaper than discovering them:

- **Cold starts.** A locally-run process is warm. Anything whose correctness
  depends on initialization completing before the first request — a lazily-built
  cache, a connection established on demand — behaves differently on the first
  request to a scaled-from-zero instance.
- **Concurrency across instances.** Locally there is one process. Races between
  concurrent instances, and anything assuming in-process state is shared, appear
  only once the platform scales out.
- **Request timeouts and CPU throttling between requests.** Background work
  started during a request and expected to finish after the response does not,
  unless the service is configured for always-allocated CPU.
- **IAM.** No local setup enforces it, so every permission error is a
  production-only error.

## Configuration parity

The process reads its configuration from environment variables in both places —
the platform injects them in production, the dev task supplies them locally.
**Never a code branch on environment.** A branch is a production risk; an unset
variable simply fails loudly, which is what you want.
