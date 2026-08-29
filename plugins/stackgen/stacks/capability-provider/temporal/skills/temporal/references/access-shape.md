# Temporal — integration & access shape

## Where the boundary sits

**Callers start and signal workflows through the shared services layer — never
a direct SDK import.** A handler that imports the client has welded a transport
concern into the request path and made itself untestable without a server.

The client behind that seam has three required properties, and each exists for a
specific failure:

**It connects lazily.** A client that dials on construction makes the engine a
startup dependency of every service that might one day start a workflow — so the
engine being briefly down means services will not boot, which is a much larger
outage than the one you had.

**It is idempotent on already-started.** Starting the same business process
twice is a **normal race**, not an error: two clicks, a retried request, a
duplicated event. The right behaviour is to treat an already-started workflow as
success and return the existing handle. Treating it as an error pushes
deduplication into every caller.

**It records rather than connects under test**, so the unit suite needs no
server. This is what keeps the fast test loop fast, and it is the property that
decays first if the seam is not enforced.

## Payloads are persisted — this is a security boundary

**Workflow inputs and results are persisted in history.** So are activity inputs
and results. That history is durable, replicated, backed up, and readable by
anyone who can query the engine.

Anything sensitive is therefore **either not passed, or encrypted before it
is**. Pass an identifier and let the activity fetch the sensitive value from the
datastore, where the product's existing access rules apply. The convenient
shortcut — passing the whole record because it is right there — writes it into a
second store with a different retention and a different audience.

This is also a retention question: a deletion obligation over user data is not
satisfied by deleting the datastore row if the same data sits in workflow
history.

## Credentials

**Env-injected, names-not-values, catalogued in
`docs/blueprint/environment.md`.** Nothing read from a committed file.

The server address is configuration, not a secret. Where the deployment uses
mTLS or a token, that credential is rotatable without a redeploy — read at
connection time rather than baked into an image.

## Worker placement

Workers poll the engine; the engine never calls in. That means workers need
outbound reachability and no inbound exposure, which is a simpler network
posture than most backing services — worth stating explicitly, because teams
routinely provision ingress for it that is not needed.
