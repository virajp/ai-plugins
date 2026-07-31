---
name: doctor
description: Check that the repo actually matches what .config/vwf.yaml declares
  — per-language
  LSP servers and toolchains, each project's frameworks and dependencies against
  its manifest, the harness task names, health endpoints, and format-stamp drift.
  Reports; never writes without consent. Run it after setup, before execute, or
  any time the repo and the config might have drifted apart.
argument-hint: "[project ...]"
model: sonnet
effort: medium
disable-model-invocation: false
---

# doctor — Check the Repo Against Its Config

`.config/vwf.yaml` declares what each project is built with. This checks the
repo agrees. Everything here is a **read** — doctor reports and offers, it never
edits without consent.

Scope to the projects named in `$ARGUMENTS`; with no argument, check every
project in the registry.

## Doc Paths

| Doc              | Path                                                   |
| ---------------- | ------------------------------------------------------ |
| vwf config       | `.config/vwf.yaml`                                     |
| Registry         | `docs/blueprint/registry.yaml`                         |
| Stack vocabulary | `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`     |
| Stack templates  | `${CLAUDE_PLUGIN_ROOT}/assets/stacks/<type>/<slug>.md` |
| Harness contract | `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`              |
| Format stamp     | `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`        |

## Hard Rules

- **Read-only by default.** Every fix is offered, never applied unprompted, and
  each is its own consent — never a batch "fix all".
- **Never install anything.** Report the command; the user runs it. This matches
  the installer CLI's own rule and keeps doctor safe to run anywhere.
- **Unavailable ≠ missing.** A language with no LSP shipped in this marketplace
  is reported as *unavailable* with no suggested command. Only a language that
  *has* a plugin and isn't installed is a finding.
- **Never halt.** Doctor always finishes and reports. Callers decide what a
  finding means — `execute` gates on the LSP check, `setup` only records.

---

## Pipeline

### 1. Load

Read `.config/vwf.yaml` and `docs/blueprint/registry.yaml`. If the config is
absent, stop and report exactly one thing: this repo is not onboarded — run
`/vwf:setup`.

Note each project's `type` (registry) and `stack` block (config). A project the
registry declares with **no `stack` block** is a finding in itself
(`config_format` 10 drift — the block is mandatory since 11); report it, nudge
`/vwf:setup`, and check what you can from its type's templates meanwhile.

### 2. Stamps

Compare `config_format` and `blueprint_format` in the config to what this vwf
ships (`assets/blueprint-format`, and the schema version in the vwf-config
asset). Drift → report the delta and nudge `/vwf:setup`; it is never doctor's
job to migrate.

### 3. Languages — LSP and toolchain

For each project, for each token in `stack.languages`, resolve its row in the
stack vocabulary:

- **LSP** — the row names a plugin. Check it is active
  (`claude plugin list --scope project`, falling back to user scope). Missing →
  finding, with `/plugin` as the remedy. Row says `none` → report *no LSP
  available in this marketplace* and move on. Token not in the table → report
  **unknown language**, check nothing else for it.
- **Toolchain** — the row names a mise tool. Check it appears in the repo's mise
  config (`.config/mise*.toml`, per the mise skill's three-file split) or
  resolves on `PATH`. Missing → finding, with the `mise use` line as the remedy.
  A `—` in the column means the toolchain is not mise-managed; skip silently.

Report per language, not per project — one missing Dart LSP is one finding even
when three projects declare `dart`.

### 4. Frameworks and dependencies — manifests

For each project, read the manifest its languages imply (the vocabulary's
Manifest column, resolved against the project's `path` from the registry). Check
each `stack.frameworks` and `stack.dependencies` token appears there.

Match on the **token as a substring of a dependency name**, case-insensitively —
`effect` matches `effect` and `@effect/platform`; `tailwindcss` matches
`tailwindcss` and `@tailwindcss/vite`. This is deliberately loose: the goal is
catching a stack that has genuinely moved on, not policing package naming.

Two findings live here, and the second is the one that matters:

- **Declared but absent** — the config names something the manifest doesn't
  have. Usually a stale config entry.
- **Dominant but undeclared** — a framework or package manager doing obvious
  structural work that `stack` never mentions. Judge this from the manifest's
  scripts and its heaviest dependencies, not from a fixed list. This is the
  check that catches a runtime swap the config never recorded.

Report both as *drift to reconcile*, never as an error — the manifest is always
the truth and the config is what needs updating.

### 5. Repo tooling

Check `repo.stack`: the `package_manager` resolves (lockfile present, tool on
`PATH` or in mise config) and each entry in `tools` has its expected marker — a
config file, a mise tool, or a manifest dependency. Absent `repo.stack` block →
`10` drift; report and nudge `/vwf:setup`.

### 6. Harness and health

Per `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`, check every capability the
config's `harness:` block marks `true` still resolves — its canonical task name
exists (`mise tasks`), or the non-canonical override the config records does. A
capability marked `false` is a **recorded gap, not a finding**: `/vwf:plan`
injects its bootstrap when a cycle needs it.

Then check each project's health path (`projects.<name>.harness.health`,
defaulting to `/health`) is actually registered in that project's routing. Do
this by reading the routing surface, not by making a request — doctor never
starts a server or calls a deployed environment; that is `/vwf:verify`'s job.

### 7. Report

One table, findings first, grouped by kind — **drift** (config and repo
disagree), **missing** (something declared has no install), **unavailable**
(nothing shipped here to install), **unknown** (outside the vocabulary). State
the count of checks that passed rather than listing them.

Close with the remedies, each as a runnable line, and offer to apply only the
ones that are pure config edits (a stale `stack` entry, a harness task rename).
Anything that installs, or that changes code, is reported and left to the user.

**Callers.** `/vwf:setup` step 10 runs this over the whole repo and records what
it finds. `/vwf:execute` runs it scoped to the plan's projects and gates on the
LSP findings only.
