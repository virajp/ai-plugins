---
name: fnox
version: 0.1.0
category: development
description: fnox as this product's secrets manager — the local-first answer
  where you hold the secrets, encrypted into git or referenced in your own
  cloud. When it is the right pick, how it satisfies the secrets contract,
  permanent ciphertext as the constraint that reshapes design, the injection
  boundary and credentials, cost shape, and the local stack. Auto-applies when
  editing fnox.toml or the gates that guard it.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/fnox.toml"
  - "**/fnox.local.toml"
  - "**/.fnox/**"
  - "**/.config/mise/conf.d/fnox.toml"
  - "**/gitleaks.toml"
  - "**/mempalace.yaml"
---

# fnox

The secrets manager you host yourself. This skill carries the judgment; the
CLI and provider surface belong to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this manager | [Pick & trade](references/pick-and-trade.md) |
| Adding a profile, a secret, or a CI credential | [Contract satisfaction](references/contract-satisfaction.md) |
| Rotating, offboarding, or reasoning about history | [Permanent ciphertext](references/permanent-ciphertext.md) |
| Wiring the injector, identities, `environment.md` | [Integration & access shape](references/access-shape.md) |
| Weighing remote-reference mode, or a surprise bill | [Cost shape](references/cost-shape.md) |
| Running the harness locally or in CI | [Local stack](references/local-stack.md) |

**The rule that does not wait for a reference:** the injector wraps the
repo's own task — `fnox exec -- <task>` — and never the application.
Everything downstream of that boundary knows only that the variables are set.

**The second rule that does not wait:** nothing in `fnox.toml` is plaintext,
and the decryption identity is never in the repo.
