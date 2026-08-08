---
name: gitleaks
description: gitleaks as the repo's secret scanner — scan the working tree on
  every commit and the history once, allowlist by fingerprint rather than by
  rule, and treat a hit as a credential to rotate rather than a line to silence.
  Auto-applies when editing .config/gitleaks.toml.
paths:
  - "**/gitleaks.toml"
  - "**/.gitleaks.toml"
  - "**/.config/gitleaks.toml"
---

# gitleaks — the secret scanner

gitleaks is the gate that keeps credentials out of the repo. It runs inside
`code:sec` alongside `grype`, which means it runs on every commit through
pre-commit and again in CI.

Config, when the repo needs one, lives at `.config/gitleaks.toml`. The shipped
`code/sec` task passes `--config` only when that file exists and otherwise uses
gitleaks' own defaults — so **a repo with no config is already protected**. Add
one to allowlist, never to enable.

```sh
mise run code:sec                    # grype + gitleaks, the commit gate
gitleaks dir . --redact 50           # working tree
gitleaks git . --log-opts="--all"    # the whole history, once
```

`--redact` truncates the matched value in the output. Keep it on: a scanner that
prints the secret it found has published it a second time, into CI logs that are
usually more widely readable than the repo.

## A hit is a credential to rotate

This is the part that gets handled backwards. When gitleaks finds a real secret:

1. **Rotate it first.** It is compromised from the moment it was committed —
   pushed or not, a local clone is a copy.
2. **Then** remove it from the code and route it through the injector (see the
   `doppler` skill: secrets reach a process as environment variables).
3. Rewriting history is optional and usually not worth it. It does not
   un-compromise a rotated credential, and it breaks every existing clone.

Deleting the line and committing the deletion is **not** a fix. The value is
still in the history and still valid.

## Allowlist by fingerprint, not by rule

Most findings that are not real are a test fixture, an example value, or a
public key. Allowlist those **narrowly**:

```toml
[allowlist]
paths = ['''^tests/fixtures/''']
regexes = ['''EXAMPLE_[A-Z_]+''']
```

Disabling a whole **rule** to clear one fixture turns off detection for every
future real instance of that credential type — and nothing reports that it
happened. Prefer a path or a fingerprint; reach for a rule-level exemption only
when the rule is genuinely wrong for this repo, and say why in a comment.

## Where this stops

Which secrets a product has and where they come from is the `doppler` skill (dev)
and the cloud plugin's secret manager (production). This skill covers detection
only.
