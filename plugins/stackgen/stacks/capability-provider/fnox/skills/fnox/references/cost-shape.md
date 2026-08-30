# fnox — cost shape

Never dollar figures: they age badly and are wrong per region anyway. What
follows is where the cost accrues and what turns a small change into a large
one.

## Encrypt-into-git mode has no bill

fnox is a binary and the storage is your repository. There is no per-seat
charge, no per-secret charge and no API to be billed for. For a small team
this is the mode's headline argument, and the comparison against a hosted
platform is a real one: that platform's per-seat line is what you are not
paying.

**The cost is operational, and it is paid per person-event.**

- **A join** is a public key added to `recipients` plus a `fnox reencrypt`
  per profile, then a commit and a review. Bounded, minutes.
- **A leave** is that, plus a **rotation of every value that person could
  decrypt** ([permanent ciphertext](permanent-ciphertext.md)). This is the
  expensive one, and it scales as *secrets × environments*, each rotation
  needing whoever owns the issuing system.

So the number to watch is **team churn multiplied by secret count**. A team
of four with a dozen secrets pays this rarely and cheaply. A team turning
over quarterly with a hundred secrets is paying an engineer-day each time,
and that is the threshold at which a manager that can revoke starts costing
less than one that cannot — see [pick & trade](pick-and-trade.md).

The second operational cost is **key custody**. Every holder has an identity
on their machine, and a lost laptop is an offboarding event with the same
rotation bill. There is no central place to disable it.

## Remote-reference mode inherits a bill

Pointing a secret at AWS Secrets Manager, Vault, 1Password or any other
backend means that backend's pricing applies, typically as a per-secret
standing charge plus a per-request charge. Two traps follow, and both are
about the **request** half:

- **`fnox exec` resolves on every invocation.** A task run in a loop, a test
  suite that spawns a process per case, or a watch mode that restarts on
  every file save turns one secret into thousands of API calls a day. The
  standing charge is predictable; this is the line that surprises people.
- **CI has no daemon.** fnox's per-user daemon caches decryption on a
  developer's machine, which blunts the local case considerably. A CI runner
  is a fresh process on a fresh machine every time, so **CI is where the call
  count lives** — and a matrix build multiplies it by the matrix.

The mitigation is the boundary the contract already mandates: resolve once,
at the outermost task, and let everything downstream read the environment.
`fnox exec -- mise run test` pays once; a test harness that invokes
`fnox exec` per case pays per case for the same values.

## The cost of the mixed shape

Splitting production into remote-reference mode and leaving development and
staging encrypted in git is usually the cheapest correct answer: the standing
charge covers only the secrets that warrant it, and the values whose
permanence you could not survive are the ones that never enter the history.
Nothing about that split costs more than picking one mode for everything —
it is a per-secret field.
