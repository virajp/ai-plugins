# GitHub Actions — conventions

The repo's delivery pipeline, implementing vwf's delivery-pipeline contract on
GitHub Actions.

**The pipeline installs the toolchain manager and nothing else.** No
per-language setup action, no system package install, no global install. Every
tool a job needs is declared in the repo's mise config; only *how mise itself is
installed* is the pipeline's business.

**Steps run through the task library** — `mise run <task>` — never a binary the
toolchain step did not put on `PATH`. The same task names a developer runs
locally are the ones CI runs, which is what makes local and CI the same gate.

**`MISE_ENV: ci` is set** when the repo defines a `mise.ci.toml` variant, and
omitted when it has only a flat `mise.toml`.

**Every third-party action is pinned to an explicit version.** An unpinned
action is remote code executing with the pipeline's credentials.

**Releases are tag-triggered** on `<project>-<env>-v<semver>`, validated against
the branch before publishing, and tested before released — vwf's contract, cited
rather than restated.

**Prefer federated identity to stored tokens.** A stored long-lived credential
is the finding most worth preventing here.

Full judgment: the `github-actions` skill's references.
