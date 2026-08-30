# fnox — integration & access shape

## Where the boundary sits

**Entirely outside the process.** fnox resolves secrets, sets them as
environment variables, and executes the task; the application never links a
client, never opens a config file, and never learns which provider backed a
given value. That is the secrets contract's outranking rule
(`assets/contracts/secrets.md`) and it is the whole integration.

The seam is one line in the task runner:

```sh
fnox exec -- mise run dev
fnox exec --profile production -- mise run deploy
```

Everything the product does downstream reads `process.env` — including its
tests, which therefore need no secrets manager at all. A test that shells out
to fnox has moved the boundary into the product.

## The identity, and where it must not be

The age identity is the one thing that must never be in the repository. Its
resolution order, highest first:

1. `FNOX_AGE_KEY` — the key content inline. This is the CI path.
2. An `identity` resolved from another provider in the config.
3. A provider `key_file` path.
4. `~/.config/fnox/age.txt` — the default, outside any working tree.

**Leave it at 1 or 4.** A `key_file` pointing inside the working tree is the
mistake that voids the scheme: what makes committed ciphertext safe is that
the key is not committed beside it. The `.gitignore` block in
[contract satisfaction](contract-satisfaction.md) is the backstop, and the
scanner allowlist deliberately does not cover any of those paths — a hit on
an identity is always real.

## CI credentials

One `FNOX_AGE_KEY` per environment, set as that pipeline's own secret
variable, matching the recipient set declared for that profile. Sharing one
key across environments is what makes the staging pipeline able to decrypt
production, and nothing in the config announces it.

In remote-reference mode the pipeline authenticates to the referenced manager
instead — an IAM role, a workload identity, an OIDC federation — and fnox
carries no credential of its own. That is the better shape where it is
available, because there is then no key to rotate on offboarding.

## What `environment.md` records

Names and issuers, never values — the contract is explicit that this stays
true whichever tool is picked, and `fnox list` makes it cheap
([contract satisfaction](contract-satisfaction.md), clause 4).

The **issuer** is the one place a real product name belongs, because it is a
fact about the world rather than a stack decision. So an entry reads
`fnox (age, committed)` or `fnox → AWS Secrets Manager`, and the distinction
matters: it tells a reader which secrets are permanent in the history and
which are not, which is exactly the split
[permanent ciphertext](permanent-ciphertext.md) turns on.

Blueprint prose still says **the secrets manager** and names nothing.

## Local and throwaway credentials

Development-profile values are throwaways pointing at the local stack, and
they are **still encrypted** — the guard cannot tell a throwaway from a real
credential, so the file admits no plaintext at all. Non-secret configuration
that merely varies by environment (a base URL, a log level, a port) is not a
secret and does not belong in `fnox.toml`; it goes in the mise env, where it
is readable without a key.

That split is worth holding: a secrets file containing things that are not
secrets is a file people stop treating carefully.
