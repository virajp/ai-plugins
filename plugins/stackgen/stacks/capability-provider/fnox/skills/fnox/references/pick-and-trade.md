# fnox — pick & trade

The axis this category is chosen on is **where the secret lives, and what
onboarding a teammate costs** (`assets/contracts/secrets.md`, "What this
contract does not decide"). fnox's answer: **you hold them** — encrypted in
your own repository, or referenced in your own cloud — and onboarding is a
public key plus a re-encrypt.

That is a different answer from a hosted platform's, not a better one. The
contract declines to rank them, and so does this file: what follows is what
picking fnox buys and what it costs, so the comparison can be made against
clauses rather than against marketing.

## When it is the answer

- **You do not want a third party in the loop.** No vendor account, no
  vendor outage, no vendor breach in your threat model, no per-seat bill.
  For a solo maintainer or a small team this is often the entire argument.
- **The config should be reviewable.** `fnox.toml` is a committed file, so
  which secrets exist, which profile holds them and which provider backs
  each one all arrive through code review like anything else. A hosted
  platform's equivalent is a web UI and an activity log.
- **It must work offline, and in a fresh clone.** Decryption needs the
  identity and nothing else — no network, no login, no bootstrap credential
  fetched from somewhere else.
- **You already have a cloud secrets manager and want one interface.**
  Remote-reference mode puts AWS Secrets Manager, Vault, 1Password and the
  rest behind the same `fnox exec --` boundary, so the product's read path
  stays identical whichever backend a given secret uses.
- **The mixed shape fits.** Development and staging encrypted into git,
  production referenced into the cloud manager, one config. That mix is the
  configuration this pack expects most products to land on, and it is the
  one a single-mode tool cannot express.

## When it stops being the answer

- **When you need to know who read what.** Git history records who *could*
  decrypt and when the ciphertext changed. It records nothing about a read.
  A compliance requirement phrased as an access log is not satisfiable here,
  and no amount of discipline makes it so.
- **When revocation must be provable.** Removing a recipient re-keys the
  current file; it does not revoke anything already read, and the honest
  offboarding procedure is a rotation of every value. Where an auditor wants
  "access terminated at 14:02", a platform that can revoke a token answers
  and fnox does not. This is the clause the pack states rather than hides —
  see [contract satisfaction](contract-satisfaction.md) clause 3.
- **When team churn is high.** Every join is a re-encrypt commit and every
  leave is a rotation of the whole set. That cost is linear in people and in
  secrets, and it is paid by a human each time.
- **When a non-engineer must set a secret.** The workflow is a CLI and a
  commit. There is no web UI to hand to someone who does not have the repo.
- **When you need versioning and rollback of a value.** Git gives you the
  ciphertext history, which is a rollback of the file rather than of a
  secret, and reading an old value needs the old key. Managers that version
  secrets natively do this in one command.

## The two storage modes, and why they mix

**Encrypted into git** (age, AWS KMS) puts the ciphertext in `fnox.toml`.
Nothing to run, nothing to pay for, works in a fresh clone — and the
ciphertext is in the history permanently, which is the constraint the whole
pack is shaped around ([permanent ciphertext](permanent-ciphertext.md)).

**A remote reference** (AWS Secrets Manager or Parameter Store, Azure, GCP,
1Password, Bitwarden, Infisical, Vault) puts only a pointer in `fnox.toml`.
The value never enters the repo, revocation becomes the referenced manager's
IAM, and the cost becomes that manager's bill and its availability.

They are chosen **per secret**, which is what makes the mixed shape above
possible. The rule this pack applies: **a value whose compromise you could
not survive belongs in remote-reference mode.** Encryption is a bet on time,
and a commit is readable by everyone who ever cloned.

## The choice this does not make

Whether the product must have a secrets manager at all is a vwf-side
statement, not this pack's — the contract says so explicitly. This file
answers only "if one, why this one".
