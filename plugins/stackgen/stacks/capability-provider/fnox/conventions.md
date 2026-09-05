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

## What this pack writes

| Lands at                           | Is                                          |
| ---------------------------------- | ------------------------------------------- |
| `fnox.toml`                        | the providers and the declared secret names |
| `.config/mise/conf.d/fnox.toml`    | the CLI pin                                 |
| `.config/mise/tasks/setup/secrets` | the fill for the toolchain manager's slot   |
| `hooks/fnox-ciphertext-guard.sh`   | the gate the encrypt-into-git mode requires |

**`fnox.toml` at the repository root is an accepted exception**, and the only
one this pack takes. fnox searches upward from the working directory; a copy
under `.config/` is reachable only by passing `--config` on every call, and
`--config` also bypasses the directory recursion and the local override — so
moving the file would take `fnox.local.toml` out of the scheme with it. The
pin, which has no such constraint, does live under `.config/`.

**The task overlays a slot and never prints a value.** `setup:secrets` checks
that the CLI and the config are both present and reports the keychain service
and prefix. It never runs a command whose normal output is a secret — `get` is
that command, and a scrollback and a CI log are both more widely readable than
the repo.

## The shipped default is the keychain, not ciphertext

The configuration this pack lands declares **one provider, the OS keychain**,
with `if_missing = "warn"` so a contributor whose keychain is not yet
populated can still run the repo's tasks. Nothing is encrypted into the tree,
so the encrypt-into-git allowance and its four conditions do not apply to a
repo that leaves the default alone — and the shipped ciphertext guard sits
inert until an `age` or KMS provider is added. Adding one is the moment the
four conditions start applying, all at once.

## Naming — one set per repo

| Prefix         | Is                          | Example             |
| -------------- | --------------------------- | ------------------- |
| `<REPO>_<KEY>` | this repository's own value | `SITE_DATABASE_URL` |
| `GLB_<KEY>`    | shared across repositories  | `GLB_GITHUB_TOKEN`  |

Names are `[A-Z0-9_]`, the same set every injector can export. The keychain
provider's `prefix = "global/"` is the shared namespace inside the `fnox`
service; a repository with its own material declares a second provider with
its own prefix rather than widening that one. Machine-local additions go in
`fnox.local.toml`, which is gitignored.

Committing ciphertext requires the repo-wide gate edits the contract's
encrypt-into-git allowance mandates. Full judgment, and the exact blocks: the
`fnox` skill's references. The contract it cites is
`assets/contracts/secrets.md`.
