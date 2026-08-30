# fnox — local stack

**There is nothing to compose, and that is the answer rather than a gap.**

The `capability-provider` kind expects one of two shapes here: a real engine
run behind a readiness gate, or — for a hosted-only provider — a seam plus a
fake, with the gap named. fnox is neither. It is a binary that resolves
secrets and execs a command, so it starts no service, listens on no port and
has no state to wait for. Its `pack.yaml` declares `harness: n/a` for exactly
that reason, and a repo pinning fnox composes no extra container.

What fnox contributes to the harness is not a service but a **wrapper**: it
sits outside every harness task, on the same boundary the secrets contract
mandates for the application.

```sh
fnox exec -- mise run stack:up
fnox exec -- mise run e2e:local
fnox exec --profile staging -- mise run e2e:staging
```

The wrapping is one level deep and belongs at the outermost invocation. The
tasks it wraps — including `stack:up` and whatever readiness gate it holds —
are the local-stack contract's business
(`assets/contracts/local-stack.md`), and nothing about them changes because
fnox is present.

## The development profile

Every value the local stack needs is declared in
`[profiles.development.secrets]`, encrypted like any other. They are
throwaways — a database password nobody outside the machine can reach — and
they are **still ciphertext**, because the pre-commit guard admits no
plaintext in the file and cannot tell a throwaway from a real credential.

The corollary is worth stating: **a fresh clone needs an identity before the
local stack will start.** Onboarding order is the age key first, then
`mise run stack:up`. A joiner whose key has not yet been added to
`recipients` cannot run anything, which is a clearer failure than a stack
that starts with half its configuration missing — but it does mean the
re-encrypt commit is a blocking step in someone's first hour, not a
follow-up.

## Tests need no manager

A test reads the environment. The harness sets the variables it needs — a
fixture, a compose file, a `.env` the runner loads — and never shells out to
fnox. This is the property the contract's outranking rule buys, and it is the
one to defend: the moment a test invokes the manager, the suite has a
dependency on a decryption key and stops running for anyone who does not hold
one.

## CI

`FNOX_AGE_KEY` for the environment the job serves, set as that pipeline's own
secret variable, and the same `fnox exec --profile <env> --` wrapper around
the same task the developer runs. One definition, two callers — the CI
workflow does not restate what the task does, per vwf's delivery-pipeline
contract.

There is no daemon on a runner, so every job resolves afresh. That costs
nothing in encrypt-into-git mode and is the request-count line to watch in
remote-reference mode — [cost shape](cost-shape.md).
