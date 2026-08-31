# Firestore — conventions

The document datastore in the Firebase half of this provider. Pick it when the
data model is document-shaped and the product benefits from client-direct
access; pick the managed relational service instead when the model is
relational, when reporting queries matter, or when the product must stay
portable off this provider.

**Reads are the bill.** Firestore charges per document read, and that line
dominates every other. A screen that fetches a hundred documents to display ten
fields bills a hundred reads. **Denormalize what a screen displays into the
document that screen loads**, and treat an unbounded collection query in a hot
path as a defect rather than a slow spot.

**Concurrency is a `version` field plus a transaction.** Every mutation reads the
document, checks the expected version, and writes `version + 1` in a
transaction; a stale version fails with the coded conflict response. Timestamps
are server timestamps only, never client clocks.

**Server code reaches this through the product's own services layer** — no
project imports the vendor SDK directly. That is what keeps the store
swappable: projects depend on an interface, not on Firestore.

**Client-direct access is the deliberate exception**, and it is governed by
**security rules**, not IAM. The admin SDK bypasses rules entirely, so **every
server endpoint re-authorizes on its own**. This is the most common source of
both security holes and phantom debugging on this provider — see the `gcp`
skill's identity reference.

**Indexes are the fidelity gap.** The emulator answers queries no production
composite index supports, so a query works all through development and fails on
first deploy. Commit the index definitions and deploy them **ahead of** the code
that needs them.

**The local stack is the Firebase Emulator Suite**, started by one task with its
own ready signal. It satisfies vwf's `local_stack` capability without Docker; do
not wrap it in a compose file to look conventional
(`assets/contracts/local-stack.md`).

Full judgment: the `gcp-firestore` skill's references. The provider-wide half —
cost doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's.
