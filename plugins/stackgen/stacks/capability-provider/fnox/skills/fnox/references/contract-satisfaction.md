# fnox — contract satisfaction

Clause by clause against the neutral secrets contract
(`assets/contracts/secrets.md`). It cites, and does not restate.

## The rule that outranks every other

The contract's opening rule — a secret reaches a process as an environment
variable, injected at the process boundary, and **the injector wraps the
repo's own task, not the application**.

```sh
fnox exec -- mise run dev
fnox exec --profile staging -- mise run e2e:staging
```

Satisfied by construction: fnox has no application SDK to reach for. There is
no in-process client, so the bootstrap problem the contract names — the
credential that reads the credentials — does not arise, and the product's
read path is `process.env` whichever provider backs a given secret.

`fnox activate <shell>` loads secrets on directory change and is a genuine
convenience at a developer's prompt. **It is not the boundary.** Tasks and CI
still go through `fnox exec --`, so the injection is explicit, reproducible
and identical on both machines; a task that only works because the developer
happened to have an activated shell fails in CI and passes locally, which is
the least useful failure available.

## Clause 1 — a distinct set per environment, no silent fallback

**Satisfied under a discipline, and unsatisfied without it.** This is the
clause fnox makes easiest to get wrong, so it is worth being precise.

fnox's profiles map onto vwf's `development` / `staging` / `production`
vocabulary directly, selected by `--profile` / `-P` or `FNOX_PROFILE`. What
the contract forbids is the fallback, and fnox has one: `[secrets]` is the
`default` profile and named profiles **inherit from it**, so a secret absent
from `[profiles.production.secrets]` resolves to the value in the root block
rather than failing. A production job then runs on a development credential
and reports success.

Two rules close it:

1. **Every secret is declared in every profile.** A profile block that lists
   all of them cannot inherit anything.
2. **The root `[secrets]` block holds nothing a deployed environment could
   inherit.** The cleanest form is three explicit named profiles and an empty
   root; where a root entry is unavoidable it must be a value that is wrong
   everywhere rather than one that is right in development.

Name the profiles exactly `development`, `staging` and `production`. fnox's
own examples use `default` and `prod`; adopting those means a mistyped
`--profile production` silently resolves to `default` instead of failing to
find a name, which is precisely the fallback this clause exists to prevent.

## Clause 2 — CI authenticates non-interactively

**Satisfied**, and one of the clauses fnox answers better than a token
scheme.

- **Non-interactive**: `FNOX_AGE_KEY` carries the identity as a CI variable.
  Nothing logs in. In remote-reference mode the credential is the referenced
  manager's — an IAM role or an OIDC federation — and the clause becomes that
  manager's to satisfy, which the pack states rather than claims.
- **Read-only where the pipeline only reads**: structurally true. Encrypting
  a new value needs only the public recipients, and an age identity decrypts;
  it grants nothing that could write a secret back into the repo, because
  writing a secret means committing a file. There is no scope to
  misconfigure.
- **Environment-scoped**: **only if the recipients are.** A single age
  recipient set shared across all three profiles means the staging pipeline's
  key decrypts production ciphertext, and nothing about the config announces
  that. Declare a provider per environment with its own recipient set, and
  give each pipeline only its own key.
- **Rotatable without a code change**: the config names recipients, never
  keys. Rotating is a new key, a `fnox reencrypt`, and a new CI variable —
  no source file moves.

## Clause 3 — onboard and offboard at a stated cost

**Onboarding**: add the joiner's age public key to the profile's
`recipients`, `fnox reencrypt -p age -P <profile>` for each environment they
need, commit. Cost: one commit per join, and every current holder's public
key must be listed for the re-encrypt to keep them working.

**Offboarding — and this is the clause the contract requires stated
plainly.** Remove the departing member's public key from `recipients` and
re-encrypt, and the *current* `fnox.toml` no longer decrypts with their key.

**Re-keying does not un-compromise what that person already read.** Every
earlier commit still holds ciphertext their key opens, and any clone they
took is a permanent copy of that history. So the honest offboarding
procedure is:

1. Remove the recipient and `fnox reencrypt` each profile.
2. **Rotate every secret value they could decrypt** — issue new credentials
   at the source, encrypt those, commit.
3. Treat step 2 as the actual offboarding. Step 1 without it changes who can
   read the next commit and nothing about who can read the last one.

The secrets a departed member held are **rotated, not merely re-encrypted**.
Where a hosted platform revokes a session and is done, fnox's cost is linear
in the number of secrets, and it is the price of holding them yourself. The
design consequence — every secret must be independently rotatable — is
[permanent ciphertext](permanent-ciphertext.md).

## Clause 4 — enumerate names without printing values

**Satisfied by default**, which is the shape this clause wants: `fnox list`
prints each secret's name and its provider key, and values appear only under
the explicit `-V` flag. Enumeration is the unflagged behaviour and disclosure
is the flagged one, so building `environment.md`'s names-only catalog is the
path of least resistance rather than a discipline someone has to remember.

`-s` adds the source file each secret is defined in, which is what makes a
multi-file or multi-project setup enumerable per project.

## Clause 5 — values stay out of terminals and logs

**Satisfied, with one hazard worth naming.** `fnox exec --` is the read path
a developer needs and it prints nothing. `fnox list` redacts by default.

The hazard is `fnox get NAME`, which prints a value to stdout **by design** —
that is what it is for. It belongs inside a command substitution and never as
a step in a pipeline, because a CI log is more widely readable than the repo
and a scrollback outlives the session. The same reasoning the secret scanner
applies to its own `--redact` flag applies here.

## The encrypt-into-git allowance — the four conditions

Committing ciphertext is permitted only under the contract's four conditions
(`assets/contracts/secrets.md`, "The encrypt-into-git allowance"). **This
pack meets all four**, and conditions 1 and 4 are repo-wide edits it emits
rather than advice — both configs live outside `.claude/`, so they are landed
here with their exact blocks and enforced by the guard below.

### Condition 1 — the scanner is allowlisted by path, never by rule

Into `.config/gitleaks.toml`, covering exactly the file fnox's config names:

```toml
[allowlist]
description = "fnox committed ciphertext — encrypt-into-git, proven plaintext-free by .claude/hooks/fnox-ciphertext-guard.sh"
paths = ['''^fnox\.toml$''']
```

A `paths` entry and nothing else. Never a `regexes` entry matching the
ciphertext's shape, and never a rule-level exemption: disabling a rule turns
off detection for every future real instance of that credential type across
the whole repo, and nothing reports that it happened.

### Condition 2 — no allowlist entry may cover a decryption identity

The block above names one path. The identity is not in it, and must not be
added to it — a scanner hit on an age identity is **always real**. The
identity's default home is `~/.config/fnox/age.txt`, outside any repo; a
provider `key_file` pointing into the working tree voids the entire scheme.

Into the repo's `.gitignore`, as the second half of the same condition:

```gitignore
# fnox decryption identities — never committed, never allowlisted
age.txt
*.age
.fnox/
```

### Condition 3 — a gate proves the committed file holds no plaintext

Encrypt-into-git fails *open*: a value written before it is encrypted is a
real leak at the one path the scanner was just told to ignore. The pack ships
`hooks/fnox-ciphertext-guard.sh`, which lands at
`.claude/hooks/fnox-ciphertext-guard.sh`, and wires it into
`.config/pre-commit-config.yaml`:

```yaml
- repo: local
  hooks:
    - id: fnox-ciphertext
      name: fnox ciphertext guard
      entry: mise x -- .claude/hooks/fnox-ciphertext-guard.sh
      language: system
      pass_filenames: false
      files: ^(fnox\.toml|\.config/gitleaks\.toml|mempalace\.yaml|\.gitignore)$
      stages: [ pre-commit ]
```

**The rule the guard enforces is mechanical: every entry in a secrets table
carries `provider = "…"`.** That bans a bare `default = "…"` outright — fnox
permits one as a plaintext local-development value, and this repo does not,
because the guard cannot distinguish a throwaway from a real credential and a
gate that has to guess is not a gate. Non-secret configuration goes to the
mise env instead, which is where it belonged anyway.

The guard also **asserts conditions 1, 2 and 4 are in place**, so a repo that
lands fnox without them fails its first commit with the missing block named,
rather than shipping an allowlisted path nothing is checking.

### Condition 4 — the committed file is excluded from mining

Into `mempalace.yaml`'s `exclude_patterns`:

```yaml
exclude_patterns:
  - fnox.toml
```

**This must be an explicit entry.** The denylist vwf seeds carries `*secret*`
and `*credentials*` (`plugins/vwf/assets/memory.md`), and neither matches
`fnox.toml` — the existing backstop does not catch this file by accident, so
omitting the line leaves the ciphertext mineable into a surface that outlives
it. Nothing a recall needs is inside a secrets file.
