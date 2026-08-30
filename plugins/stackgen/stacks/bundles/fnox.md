---
name: fnox
axis: backing
kind: capability-provider
components:
- capability-provider/fnox@0.1.0
---

# Backing — fnox

The secrets manager you host yourself: a committed `fnox.toml` where each
secret is either encrypted in place (age, AWS KMS) or a reference into a
remote manager, and the two mix per secret. No vendor account, no per-seat
bill, nothing to reach at install time.

**The composition is the neutral secrets contract plus this one manager.** The
contract (`assets/contracts/secrets.md`) leads with the rule that outranks the
rest — a secret reaches a process as an environment variable, injected by a
wrapper around the repo's own task — which fnox satisfies without an SDK:
`fnox exec -- mise run <task>`, and nothing downstream knows fnox exists.

The axis this is chosen on is **where the secret lives, and what onboarding a
teammate costs**. Here: you hold them, onboarding is an age public key plus a
re-encrypt, and CI gets a decryption key. That is a different answer from a
hosted platform's, not a better one — the argument belongs in the component's
pick-and-trade reference, and neither the contract nor this bundle ranks them.

The constraint the product is built around is **permanent ciphertext**.
Re-keying changes what the next commit holds and nothing about what an
earlier one already published, so offboarding is a **rotation of every value**
rather than a re-encrypt — which means every secret has to be independently
rotatable, and a value whose compromise you could not survive belongs in
remote-reference mode instead.

Committing ciphertext is permitted under the contract's four encrypt-into-git
conditions, and this pack meets all four: the scanner allowlisted by path
only, no allowlist entry over a decryption identity, a pre-commit guard
proving the file holds no plaintext, and the file excluded from mining. Two of
those are repo-wide config edits the pack emits rather than advises, and the
guard it ships refuses a commit when any of them is missing.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/secrets.md`.
