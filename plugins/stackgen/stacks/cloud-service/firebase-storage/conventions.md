# Cloud Storage for Firebase — conventions

The provider's object store, with a security-rules layer in front. **The bucket
is an ordinary one** — a server reaches it through the same object-storage API
it would use anywhere on this provider — and what this component adds is a
governed **client-direct** path, so a client can upload and download without a
service in the middle.

**Lifecycle rules are set at bucket creation**, not retrofitted. Retention is a
bucket policy, not application code — an object nothing deletes is a cost that
only rises, and a compliance obligation nobody can demonstrate.

**Nothing is public by default, and nothing becomes public casually.** Where a
client needs an object it does not own the path to, the answer is a **signed,
expiring URL** issued by a service that authorized the request — never a bucket
opened to the internet, which is irreversible in the sense that matters: you
cannot know what was copied while it was open.

**Size and content type are enforced where the upload happens.** On the
client-direct path that means in the rules, because there is no service to check
them. An unbounded upload path is an unbounded bill.

**Uploads are resumable and the object is not the record.** The product's own
datastore holds the entity; the object is referenced from it. A completed upload
that no record points at is an orphan, and an orphan nothing cleans up is
permanent.

**Rules govern the client path; IAM governs the server path**, and the admin SDK
bypasses rules entirely — so every server endpoint re-authorizes on its own. See
the `gcp` skill's identity reference.

**The emulator does not simulate lifecycle rules or storage classes**, so the
two decisions with the longest-lived cost consequences are the two nothing local
exercises (`assets/contracts/local-stack.md`).

Full judgment: the `gcp-firebase-storage` skill's references, and the neutral
contract they cite is `assets/contracts/object-storage.md`. The provider-wide
half — cost doctrine, IAM, the emulator map, the private plane — is the `gcp`
skill's.
