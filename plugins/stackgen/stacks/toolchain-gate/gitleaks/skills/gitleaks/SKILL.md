---
name: gitleaks
version: 1.0.0
category: development
description: gitleaks as the repo's secret scanner — scan the working tree on
  every commit and the history once, allowlist by fingerprint rather than by
  rule, and treat a hit as a credential to rotate rather than a line to silence.
  Auto-applies when editing .config/gitleaks.toml.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/gitleaks.toml"
  - "**/.gitleaks.toml"
  - "**/.config/gitleaks.toml"
---

# gitleaks — the secret scanner

gitleaks is the gate that keeps credentials out of the repo, in two places. The
pre-commit hook scans the **staged change** on every commit; `code:sec` scans
the whole **working tree** alongside `grype`, by hand and in CI.

The config lives at **`.config/gitleaks.toml`** and ships with the repo, so
`code:sec` and the pre-commit hook both pass `--config`. The file exists to
allowlist and to add rules, never to enable scanning.

**`--config` REPLACES the built-in ruleset rather than extending it**, which is
why the shipped file opens with:

```toml
[extend]
useDefault = true
```

Delete that and the rules below it become the entire scan — a repo that added
one vendor key pattern would stop detecting the ~170 credential shapes gitleaks
knows, and both gates would keep reporting green. Precedence, highest first:
`--config`, then `GITLEAKS_CONFIG`, then `<target>/.gitleaks.toml`.

```sh
mise run code:sec                    # grype + gitleaks over the working tree
gitleaks dir . --config .config/gitleaks.toml --redact    # working tree
gitleaks git . --log-opts="--all"    # the whole history, once
```

`--redact` truncates the matched value in the output. Keep it on: a scanner that
prints the secret it found has published it a second time, into CI logs that are
usually more widely readable than the repo.

The pre-commit hook is upstream's **`gitleaks-system`**, not `gitleaks`. The
plain id builds gitleaks from source into pre-commit's own environment; the
`-system` variant runs the binary the toolchain manager already pins, so the
commit gate and `code:sec` are the same build. The cost is that it needs
gitleaks on `PATH` — which it announces as an error rather than as a pass.

Its entry is `gitleaks git --pre-commit --redact --staged --verbose`, which
takes at most one positional argument, so the hook declares
**`pass_filenames: false`**. Upstream sets that on the `gitleaks` id and omits
it here, and pre-commit's default is to append the staged filenames: without
the line, every commit touching two or more files fails with
`accepts at most 1 arg(s)` and nothing is scanned.

## A hit is a credential to rotate

This is the part that gets handled backwards. When gitleaks finds a real secret:

1. **Rotate it first.** It is compromised from the moment it was committed —
   pushed or not, a local clone is a copy.
2. **Then** remove it from the code and route it through the injector
   (`assets/contracts/secrets.md`: secrets reach a process as environment
   variables, injected at the process boundary).
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

Which secrets a product has and where they come from is the secrets-manager
contract (`assets/contracts/secrets.md`) and whichever manager the backing axis
names. This skill covers detection only — including the scanner half of that
contract's encrypt-into-git allowance: allowlist the committed ciphertext by
path, never by rule, and never a decryption identity.
