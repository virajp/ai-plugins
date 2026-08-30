# fnox — the constraint that bites: permanent ciphertext

Every provider forces one property on the product it backs. For fnox in
encrypt-into-git mode it is this: **a committed secret is committed forever,
and the only operation that ends someone's access to it is rotating the value
at its source.**

Git history is append-only in practice. Re-encrypting changes what the *next*
commit holds; every earlier commit still decrypts with the key it was written
for, and a clone taken at any point is a permanent, offline copy. There is no
edit to `fnox.toml` that reaches backwards.

## What follows for the product

**Every secret must be independently rotatable.** This is the design
constraint, and it is a constraint on the product rather than on fnox. A
credential that cannot be reissued without a coordinated deploy is a
credential whose offboarding procedure does not terminate.

Concretely:

- **No secret is baked into a build artifact.** A value compiled into an
  image or a client bundle is rotatable only by rebuilding and redeploying
  every consumer, which turns a personnel change into a release.
- **Every credential has a written rotation procedure**, and it belongs
  beside the secret's entry in `environment.md` — where it is issued, what
  reissuing it breaks, and who can do it. A procedure discovered during an
  offboarding is a procedure invented under pressure.
- **Prefer having nothing to encrypt.** Identity-based auth — a workload
  identity, an OIDC federation, a short-lived token minted per run — removes
  the value from the file entirely, and a value that was never committed
  needs no rotation. This is the best available answer to permanence, and it
  is worth reaching for before reaching for a stronger cipher.
- **Short-lived beats long-lived.** Where a credential must exist, one with a
  natural expiry bounds the damage a historical clone can do to a window
  rather than to forever.

## Encryption is a bet on time

age is strong today. The commit is readable by everyone who ever cloned the
repository, for as long as the repository exists, and neither of those facts
has an expiry date. That asymmetry is why this pack's ruling on mode is:

**A value whose compromise you could not survive belongs in
remote-reference mode**, where `fnox.toml` holds a pointer and the value
never enters the repository at all. Encrypt-into-git is at its best for
development and staging, where the blast radius is a rebuildable environment
and the convenience is real.

That is a per-secret decision, not a per-repo one, and mixing the two modes
in one config is the shape this pack expects.

## Do not try to rewrite your way out

Rewriting history to remove the ciphertext is not a fix, for the same two
reasons the secret scanner's doctrine gives for a plaintext hit: it does not
un-compromise a value that was already readable, and it breaks every existing
clone — including the ones held by the person you are offboarding, which are
the ones that mattered.

Rotate the value. Then, if you like, rewrite. The order is what makes the
second step optional.

## The bill this constraint sends

Offboarding cost is linear in secrets, and it is paid by a person. That is
the number to watch when weighing this manager against a hosted one — see
[cost shape](cost-shape.md), and [pick & trade](pick-and-trade.md) for the
churn threshold where it stops being the right trade.
