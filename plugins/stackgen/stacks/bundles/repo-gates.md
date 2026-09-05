---
name: Repo gates
axis: repo
kind: repo-gate
unconditional: true
components:
- toolchain-gate/dprint@1.0.0
- toolchain-gate/gitleaks@1.0.0
- toolchain-gate/grype@1.0.0
- toolchain-gate/pre-commit@1.0.0
---

# Repo — the four gates

The gates that run over the whole repository rather than over one toolchain
inside it. **dprint** is the single formatter, **gitleaks** the secret
scanner, **grype** the dependency vulnerability scanner, and **pre-commit**
the local gate that runs them — which is what makes these four a bundle
rather than four unrelated tools.

**Each gate now ships its config file**, not only the doctrine describing
one. `.config/dprint.json`, `.config/gitleaks.toml`, `.config/grype.yaml`,
`.config/pre-commit-config.yaml` and `.config/git-conventional-commits.yaml`
land with the skills, through the `config/` tier
(`assets/output-tree.md`), and each gate also drops the hook fragment that
wires it — `.config/pre-commit.d/<gate>.yaml` — for `/vwf:init` to merge.
The earlier line stopped at naming the file as a prerequisite, which left
every repo hand-writing the config the skill assumes and no two repos
agreeing on it.

**This is not a menu pick.** There is exactly one pack per slot, and a
one-entry menu is theatre. The frontmatter carries `unconditional: true`, so
`stackgen-stack-menu` leaves this bundle out of the payload it returns and
`/vwf:init` fetches it by its **fixed slug** — `repo-gates` — instead.
Fixed, never constructed: a name assembled from configuration is one that
can silently resolve to nothing, which is the rule the `ux-gate` and
design-adapter seams already follow.

It is one of **three** unconditional bundles, with [mise](mise.md) and
[repo hygiene](repo-hygiene.md): the manager that runs the gates, these
gates, and the files they run over.

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

**The seam with [repo hygiene](repo-hygiene.md).** A gate scans; hygiene
declares what is not there to scan. An ignore rule and a scanner allowlist
are opposites that read alike — the first keeps a file out of the commit,
the second tells the scanner to accept one that is in — so they are written
in different packs, and a gate's config never grows an ignore rule that
belongs in `.gitignore`.

Gates satisfy no vwf harness capability. What they contribute is the
`repo`-axis fact of one task name per gate.
