---
name: doctor
description: Check that the repo actually matches what .config/vwf.yaml declares
  — per-language
  LSP servers and toolchains, each project's frameworks and dependencies against
  its manifest, the harness task names, health endpoints, the mempalace wing and
  room set, the graphify CLI/graph/hook, and format-stamp drift.
  Reports; never writes without consent. Run it after setup, before execute, or
  any time the repo and the config might have drifted apart.
---

# doctor — Check the Repo Against Its Config

`.config/vwf.yaml` declares what each project is built with. This checks the
repo agrees. Everything here is a **read** — doctor reports and offers, it never
edits without consent.

Scope to the projects named in `$ARGUMENTS`; with no argument, check every
project in the registry. **That scope narrows §§3–5 only.** The harness, the
memory config and the code-intelligence graph belong to the repo rather than to
any one project, so **§§6–8 run in full on every invocation**, scoped or not —
and their references are read every run, not just when no argument was given.
Narrowing them is how a scoped run comes back clean while a blocking finding
sits unread, and `/skill:setup` / `/skill:execute`
halt on a blocking finding they were never told about.

## Doc Paths

| Doc               | Path                                                           |
| ----------------- | -------------------------------------------------------------- |
| vwf config        | `.config/vwf.yaml`                                             |
| Registry          | `docs/blueprint/registry.yaml`                                 |
| Stack vocabulary  | `%%AI_PLUGINS_ROOT%%/assets/stack-vocabulary.md`             |
| Stack templates   | from the installed stack plugins, never from vwf                |
| Harness contract  | `%%AI_PLUGINS_ROOT%%/assets/harness.md`                      |
| Memory protocol   | `%%AI_PLUGINS_ROOT%%/assets/memory.md`                       |
| mempalace config  | `mempalace.yaml` (one per repo — parent + submodules)          |
| Graphify protocol | `%%AI_PLUGINS_ROOT%%/assets/graphify.md`                     |
| Knowledge graph   | `graphify-out/graph.json` (workspace root)                     |
| Format stamp      | `%%AI_PLUGINS_ROOT%%/assets/blueprint-format`                |

## Hard Rules

- **Read-only by default.** Every fix is offered, never applied unprompted, and
  each is its own consent — never a batch "fix all".
- **Never install anything, and never build anything.** Report the command; the
  user runs it. This matches the installer CLI's own rule and keeps doctor safe
  to run anywhere — and it is why §8 never triggers a graph build, which is a
  long LLM-driven job reserved for `/skill:setup`.
- **Unavailable ≠ missing.** A language with no LSP shipped in this marketplace
  is reported as *unavailable* with no suggested command. Only a language that
  *has* a plugin and isn't installed is a finding.
- **Never halt.** Doctor always finishes and reports, even when everything is
  broken — a mandate is expressed as a **blocking finding**, never as doctor
  stopping early. Callers decide what a finding means: `setup` and `execute`
  both halt on `blocking`, `execute` additionally gates on the LSP check.

---

## Pipeline

### 1. Load

Read `.config/vwf.yaml` and `docs/blueprint/registry.yaml`. If the config is
absent, stop and report exactly one thing: this repo is not onboarded — run
`/skill:setup`.

Note each project's `role` (registry) and `stack` block (config). A project the
registry declares with **no `stack` block** is a finding in itself
(`config_format` 10 drift — the block is mandatory since 11); report it, nudge
`/skill:setup`, and check what you can from its role's templates meanwhile.

**Recall.** Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, recall room `doctor`
for this repo's prior findings. Anything still present that a previous run
already reported is marked **known** in §9 rather than presented as new — the
same treatment `/skill:verify` gives a criterion it already knows is failing. Skip
silently if mempalace is unavailable; §7 then reports the outage itself.

### 2. Stamps

Compare `config_format` and `blueprint_format` in the config to what this vwf
ships (`assets/blueprint-format`, and the schema version in the vwf-config
asset). Drift → report the delta and nudge `/skill:setup`; it is never doctor's
job to migrate.

### 3–8. The checks

Work these in order, reading each reference immediately before its sections.
Between them they cover every finding kind listed in §9; nothing here is
optional, and no reference restates a rule that lives above.

| Sections                                                   | Reference                                                 | Covers                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **3–5** — languages, manifests, repo tooling               | [Stack checks](references/stack-checks.md)                | LSP + toolchain per language, framework/dependency drift per manifest, the four stack axes, the `iac` own-repo rule, `mise`, `repo.stack`. **Blocking findings live here** |
| **6–7** — harness & health, memory config                  | [Harness & memory](references/harness-and-memory.md)      | Harness task names and health paths; the `mempalace.yaml` wing/room contract and the markdown mirror |
| **8** — code intelligence                                  | [Code intelligence](references/code-intelligence.md)      | The graphify CLI, the workspace-root graph, the refresh hook, staleness. **Blocking findings live here** |

### 9. Report & persist

One table, findings first, grouped by kind — **blocking** (something *mandatory*
is absent or misplaced: mise, the graphify CLI, a workspace-root graph, an `iac`
project inside another repo; callers must halt),
**drift** (config and repo disagree), **missing** (something declared has no
install), **unavailable** (nothing shipped here to install), **unknown**
(outside the vocabulary), **degraded** (something optional is absent and a
fallback is carrying the work). Mark anything the §1 recall already carried as
**known**, so a repeat run reads as a diff rather than a re-accusation. State
the count of checks that passed rather than listing them.

Close with the remedies, each as a runnable line, and offer to apply only the
ones that are pure config edits (a stale `stack` entry, a harness task rename, a
missing room in a `mempalace.yaml`). Anything that installs, or that changes
code, is reported and left to the user.

**Persist.** File this run's findings to room `doctor` — one compressed line per
finding per the memory asset's AAAK style, plus what was fixed if the user
accepted a remedy. That is what lets the next run say **known**. Skip silently
if mempalace is unavailable.

**Callers.** `/skill:setup` step 10 runs this over the whole repo and records what
it finds. `/skill:execute` runs it scoped to the plan's projects. **Both halt on
any `blocking` finding** — the mandated tooling is what the pipeline is built
on, so proceeding without it produces a run that fails later and less clearly.
`/skill:execute` additionally gates on the LSP findings, as it always has.
