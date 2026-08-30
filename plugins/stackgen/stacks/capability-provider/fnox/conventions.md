# fnox — conventions

The secrets manager you host yourself. Configuration is a **committed
`fnox.toml`**; each secret is either encrypted in place (age, AWS KMS) or a
reference into a remote manager, and the two mix freely per secret. There is
no vendor account, no monthly bill and no third party in the loop — the trade
is that offboarding is your job rather than a revoke button.

**Secrets reach a process as environment variables, injected by
`fnox exec -- <the repo's own task>`.** This is the secrets contract's rule
that outranks the rest (`assets/contracts/secrets.md`), and fnox satisfies it
without an SDK: nothing downstream of that boundary knows fnox exists.

**Every environment is a named profile, and every secret is declared in every
profile.** `[secrets]` is the `default` profile and the other profiles inherit
from it, so a secret missing from `[profiles.production.secrets]` silently
resolves to the development value. Naming the profiles `development`,
`staging` and `production` — vwf's delivery-pipeline vocabulary — turns a
wrong-environment resolution into a missing name rather than a near-miss.

**Nothing in `fnox.toml` is plaintext.** Every entry carries `provider = "…"`;
a bare `default = "…"` value is not permitted, even for a throwaway, because
the committed-ciphertext gate cannot tell a throwaway from a real credential.
Non-secret configuration — an API URL, a log level — belongs in the mise env,
not in the secrets file.

**The decryption identity never enters the repo.** It lives at
`~/.config/fnox/age.txt` or arrives as `FNOX_AGE_KEY`; a provider `key_file`
pointing inside the working tree voids the entire scheme, since what makes the
ciphertext safe to commit is that the key is not beside it.

**One age recipient set per environment.** A single recipient shared across
profiles means the staging CI key decrypts production — the CI credential is
environment-scoped only if the recipients are.

**Offboarding is rotation, not re-encryption.** `fnox reencrypt` re-keys the
current file; every earlier commit still decrypts with the old key. A departed
member's secrets are rotated.

Committing ciphertext requires the repo-wide gate edits the contract's
encrypt-into-git allowance mandates. Full judgment, and the exact blocks: the
`fnox` skill's references. The contract it cites is
`assets/contracts/secrets.md`.
