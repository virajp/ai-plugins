---
name: grype
version: 0.1.0
category: development
description: grype as the repo's dependency vulnerability scanner — scan the
  source tree on every commit and the built image before release, fail on a
  severity threshold, and time-box every ignore rule. Auto-applies when editing
  .config/grype.yaml.
license: MIT
invocation: model
tools: Read Grep Glob Edit Write Bash
paths:
  - "**/grype.yaml"
  - "**/.grype.yaml"
  - "**/.config/grype.yaml"
---

# grype — the vulnerability scanner

grype scans dependencies for known vulnerabilities. It runs inside `code:sec`
alongside `gitleaks`, so it gates every commit and runs again in CI.

Config, when the repo needs one, lives at `.config/grype.yaml`. The shipped
`code/sec` task passes `--config` only when that file exists — **a repo with no
config still scans**, with grype's defaults. Add one to set a threshold or to
record an ignore, never to enable scanning.

```sh
mise run code:sec               # grype + gitleaks, the commit gate
grype .                         # the source tree and its lockfiles
grype <image>:<tag>             # the built image, before release
```

## Scan two things, at two moments

They find different problems and neither substitutes for the other:

- **The source tree**, on every commit. This catches what the lockfile
  introduced — a transitive dependency picked up by a routine update.
- **The built image**, before release. This catches the base image's OS
  packages, which no lockfile mentions and which are usually the larger share of
  a real image's findings.

A pipeline that scans only the source ships CVEs in the base layer and reports
green.

## Fail on a threshold, and pick it deliberately

```yaml
# .config/grype.yaml
fail-on-severity: high
```

Set the threshold where the team will actually act. A threshold of `low` on a
typical dependency tree produces a wall of findings, and a gate nobody can clear
gets bypassed rather than fixed — which is strictly worse than a higher
threshold honestly enforced.

## Every ignore gets a reason and an expiry

```yaml
ignore:
  # CVE-0000-0000 — reachable only from a code path this product does not use.
  # Re-check 2026-12-01; upstream fix expected in 3.x.
  - vulnerability: CVE-0000-0000
```

An ignore with no note is indistinguishable from an oversight six months later,
and an ignore with no re-check date outlives the fix it was waiting for. Prefer
upgrading the dependency; ignore only when there is genuinely nothing to upgrade
to, and say so.

Never widen an ignore to a package or an ecosystem to clear one CVE — that
silences every future finding in it.

## Where this stops

Which dependencies a project takes on, and their supply-chain settings
(cooldowns, trust policy, build allowlists), belong to the language plugin's
package-manager doctrine. This skill covers scanning and its gate.
