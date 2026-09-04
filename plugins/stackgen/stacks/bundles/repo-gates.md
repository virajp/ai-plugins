---
name: Repo gates
axis: repo
kind: repo-gate
unconditional: true
components:
- toolchain-gate/dprint@0.1.0
- toolchain-gate/gitleaks@0.1.0
- toolchain-gate/grype@0.1.0
- toolchain-gate/pre-commit@0.1.0
---

# Repo — the four gates

The gates that run over the whole repository rather than over one toolchain
inside it. **dprint** is the single formatter, **gitleaks** the secret
scanner, **grype** the dependency vulnerability scanner, and **pre-commit**
the local gate that runs them — which is what makes these four a bundle
rather than four unrelated tools.

**This is not a menu pick.** There is exactly one pack per slot, and a
one-entry menu is theatre. The frontmatter carries `unconditional: true`, so
`stackgen-stack-menu` leaves this bundle out of the payload it returns and
`/vwf:setup` fetches it by its **fixed slug** — `repo-gates` — instead.
Fixed, never constructed: a name assembled from configuration is one that
can silently resolve to nothing, which is the rule the `ux-gate` and
design-adapter seams already follow.

The reason it is unconditional is **availability**. A pack only reaches a
repo when someone picks a bundle, and a repo that has picked no stack still
needs a formatter, a secret scanner and a vulnerability scanner. Left to the
menu, "no stack chosen yet" and "this repo has no gates" would be the same
state, and nothing would tell them apart. Nothing here needs a project axis
or any stack knowledge, so it materializes onto a blank repo.

Nothing is recorded in `.config/vwf.yaml` for it either — nothing was
chosen, so there is no choice to record. The landing goes in `lock.yaml`,
like any other materialization.

**Nothing here is language-specific**, and that seam is the whole reason the
kind exists. A formatter or linter whose config is meaningful for exactly
one toolchain — ESLint, a `tsconfig` lint table, a Rust clippy table — is
topic 10 of *that language's* bundle and never appears here. Getting it
backwards is how a polyglot repo ends up with three secret scanners, one per
language bundle, each with its own allowlist.

**pre-commit carries the wiring topic**, not only the hook-running one:
every gate reachable as one task name, the same names run in CI, cheap gates
before expensive ones, and the exclusion set stated once rather than
drifting per gate. What the task library *is* and what those names are
belongs to [mise](mise.md). The two halves are written in both places on
purpose — they drift the moment only one of them knows about the other.

Gates satisfy no vwf harness capability. What they contribute is the
`repo`-axis fact of one task name per gate.
