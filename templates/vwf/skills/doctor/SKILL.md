---
name: doctor
description: Check that the repo actually matches what .config/vwf.yaml declares
  — per-language
  LSP servers and toolchains, each project's frameworks and dependencies against
  its manifest, the harness task names, health endpoints, the mempalace wing and
  room set, the graphify CLI/graph/hook/ignore file, and format-stamp drift.
  Reports; never writes without consent. Run it after setup, before execute, or
  any time the repo and the config might have drifted apart.
argumentHint: "[project ...]"
model: sonnet
effort: medium
invocation: both
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
sits unread, and `<%= it.cmd("vwf:setup") %>` / `<%= it.cmd("vwf:execute") %>`
halt on a blocking finding they were never told about.

## Doc Paths

| Doc               | Path                                                           |
| ----------------- | -------------------------------------------------------------- |
| vwf config        | `.config/vwf.yaml`                                             |
| Registry          | `docs/blueprint/registry.yaml`                                 |
| Stack vocabulary  | `<%= it.root %>/assets/stack-vocabulary.md`             |
| Stack templates   | from the installed stack plugins, never from vwf                |
| Harness contract  | `<%= it.root %>/assets/harness.md`                      |
| Memory protocol   | `<%= it.root %>/assets/memory.md`                       |
| mempalace config  | `mempalace.yaml` (per mined tree — see the memory protocol)     |
| Graphify protocol | `<%= it.root %>/assets/graphify.md`                     |
| Membership        | `<%= it.root %>/assets/membership.md`                   |
| Knowledge graph   | `graphify-out/graph.json` (each checkout root)                 |
| Format stamp      | `<%= it.root %>/assets/blueprint-format`                |

## Hard Rules

- **Read-only by default.** Every fix is offered, never applied unprompted, and
  each is its own consent — never a batch "fix all".
- **Never install anything, and never build anything.** Report the command; the
  user runs it. This matches the installer CLI's own rule and keeps doctor safe
  to run anywhere — and it is why §8 never triggers a graph build, which is a
  long LLM-driven job reserved for `<%= it.cmd("vwf:setup") %>`.
- **Unavailable ≠ missing ≠ unknown.** A language with no LSP shipped in this
  marketplace is reported as *unavailable* with no suggested command; only a
  language that *has* a plugin and isn't installed is a *missing* finding.
  Both presuppose an installed plugin **declares** the language. One that no
  plugin declares at all is *unknown*, and unknown is **blocking** — vwf's stack
  menu is closed to what the installed plugins define
  (`<%= it.root %>/assets/stack-vocabulary.md`).
- **Never halt.** Doctor always finishes and reports, even when everything is
  broken — a mandate is expressed as a **blocking finding**, never as doctor
  stopping early. Callers decide what a finding means: `setup`, `plan` and
  `execute` all halt on `blocking`, and `execute` additionally gates on the LSP
  check — `plan` does not, since planning compiles nothing.

---

## Pipeline

### 1. Load

**Resolve the base repo first**, per
`<%= it.root %>/assets/membership.md` — a run started inside a member must check
the product, not the one repo it is standing in. Then read `.config/vwf.yaml`
and `docs/blueprint/registry.yaml` from there. If no config is reachable by any
step of that resolution, stop and report exactly one thing: this repo is not
onboarded — `<%= it.cmd("vwf:setup") %>` will onboard it.

**A config with no registry is early, not drifted.** A repo whose
`.config/vwf.yaml` is stamped while `docs/blueprint/registry.yaml` is still
absent is partway along the chain: `<%= it.cmd("vwf:setup") %>` writes the
config, and the registry arrives later from
`<%= it.cmd("vwf:architecture") %>`. Report it as **information** — *early: next
`<%= it.cmd("vwf:product") %>`, then `<%= it.cmd("vwf:architecture") %>`* —
never as a finding, and never as a setup nudge, since setup has nothing left to
do here. §§3–5 have no projects to scope to and are skipped, saying so; §§6–8
run in full, as they always do.

**Membership, both directions** (multi-repo only). Compare `members:` against
what each member repo's `.config/vwf-membership.yaml` claims, and report as
**blocking**: a member whose file names a different `product` or `host`, a
member listed with no file, a repo carrying a file the base does not list, and a
`multi-repo` topology with no `members:` at all. Each of these leaves exactly
one of the two entry paths silently wrong — a command run from the base works
while the same command run inside the member reports an un-onboarded repo, or
the reverse — which is the whole failure the two-file contract exists to
prevent. A **missing `url:`** on a member is blocking too: the absent-member
clone offer has nothing to clone from without it, and that only surfaces on the
day someone needs the repo.

**Presence is not a finding.** Detect which members are cloned here and say so
plainly in the report, but never as drift: a twenty-repo product with three
cloned is the normal state, and every per-repo check below simply scopes to the
present ones.

Note each project's `role` + `platforms` (registry) and `stack` block (config).
A project the registry declares with **no `stack` block** is a finding in itself
(`config_format` 10 drift — the block is mandatory since 11); report it, nudge
`<%= it.cmd("vwf:setup") %>`, and check what you can from its platforms' templates meanwhile.

**Recall.** Per `<%= it.root %>/assets/memory.md`, recall room `doctor`
for this repo's prior findings. Anything still present that a previous run
already reported is marked **known** in §9 rather than presented as new — the
same treatment `<%= it.cmd("vwf:verify") %>` gives a criterion it already knows is failing. Skip
silently if mempalace is unavailable; §7 then reports the outage itself.

### 2. Stamps

Compare `config_format` and `blueprint_format` in the config to what this vwf
ships (`assets/blueprint-format`, and the schema version in the vwf-config
asset). Drift → report the delta and name the remedy in terms of what setup
does: the stamp is behind, and `<%= it.cmd("vwf:setup") %>` will reconcile the
tree to the current format. It is never doctor's job to migrate.

### 3–8. The checks

Work these in order, reading each reference immediately before its sections.
Between them they cover every finding kind listed in §9; nothing here is
optional, and no reference restates a rule that lives above.

| Sections                                                   | Reference                                                 | Covers                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **3–5** — languages, manifests, repo tooling               | [Stack checks](references/stack-checks.md)                | LSP + toolchain per language, an unknown language, framework/dependency drift per manifest, the four stack axes, the `iac` own-repo rule, `mise`, `repo.stack`. **Blocking findings live here** |
| **6–7** — harness & health, memory config                  | [Harness & memory](references/harness-and-memory.md)      | Harness task names and health paths; the `mempalace.yaml` placement, wing/room contract and secret excludes, and the markdown mirror. **Blocking findings live here** |
| **8** — code intelligence                                  | [Code intelligence](references/code-intelligence.md)      | The graphify CLI, a graph per locally-present checkout, the refresh hook, staleness, the `.graphifyignore`. **Blocking findings live here** |

### 9. Report & persist

One table, findings first, grouped by kind — **blocking** (something *mandatory*
is absent or misplaced, or the stack is one no installed plugin defines: mise,
the graphify CLI, a graph missing from a locally-present checkout, an `iac`
project inside another repo whose extraction the user has **not** declined on
the record, an **unknown** language, a `custom` template pin, a
project whose template does not cover every platform it declares, a broken
membership link (§1), a misplaced / duplicated /
missing `mempalace.yaml` or one carrying no secret excludes; callers must halt),
**drift** (config and repo disagree), **missing** (something declared has no
install), **unavailable** (nothing shipped here to install), **unknown**
(no installed plugin declares it — always blocking, listed separately so the
remedy reads as *install or write the plugin*, never *install this one*),
**degraded** (something optional is absent and a
fallback is carrying the work — **or** a mandate the user declined on the
record: a declined graph build, and an `iac` extraction declined under
`enforcement:`, each reported every run and never escalating back to blocking).
Mark anything the §1 recall already carried as
**known**, so a repeat run reads as a diff rather than a re-accusation. State
the count of checks that passed rather than listing them.

Close with the remedies, each as a runnable line, and offer to apply only the
ones that are pure config edits (a stale `stack` entry, a harness task rename, a
missing room in a `mempalace.yaml`). Anything that installs, or that changes
code, is reported and left to the user — as is anything needing a **choice**: a
`custom` pin and an unknown language both look like one-line config edits and are
not, since resolving either means picking off a menu or installing a plugin.
Nudge `<%= it.cmd("vwf:setup") %>` and stop there; a template doctor guessed would silently
change what `plan` and `execute` read.

**Persist.** File this run's findings to room `doctor` — one compressed line per
finding per the memory asset's AAAK style, plus what was fixed if the user
accepted a remedy. That is what lets the next run say **known**. Skip silently
if mempalace is unavailable.

**Callers.** `<%= it.cmd("vwf:setup") %>`'s shared spine runs this over the whole
repo, right after it writes the config, and records what
it finds. `<%= it.cmd("vwf:plan") %>` runs it scoped to its dependency chain's projects, once
the chain is approved and before its survey. `<%= it.cmd("vwf:execute") %>` runs it scoped to
the plan's projects. **All three halt on any `blocking` finding** — the mandated
tooling is what the pipeline is built on, and the stack menu is what its
conventions and harness come from, so proceeding without either produces a run
that fails later and less clearly, or one that fails to fail at all.
`<%= it.cmd("vwf:execute") %>` additionally gates on the LSP findings, as it always has;
`<%= it.cmd("vwf:plan") %>` does not, since it compiles nothing.
