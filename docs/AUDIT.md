# Skills Audit Report — `plugins/skills/` (re-audit 2)

**Audited against:** Skillsmith syntax specs (entry-point, tasks, templates,
frameworks, checklists) **Skills audited:** 7 **Audit date:** 2026-06-15 (after
D2 task extraction, commit `547b7f8`) **Migration history:** `acc69c5`
(entry-point frontmatter + XML) → `547b7f8` (extract process into `tasks/`)

> **Result:** Entry points are now **Compliant** (D2 resolved — process logic
> extracted to `tasks/`). New `tasks/` files are **Compliant** against the tasks
> spec. **D1 (the `SKILL.md` filename) is now closed as a permanent, required
> deviation** — verified against the official Claude Code docs (see below), it
> cannot change without breaking the plugin. The untouched
> `templates/`/`frameworks/`/`checklists/` folder types remain non-conformant by
> design.

---

## Summary

| Skill               | Smith tier | Entry point   | tasks/        | templates/    | frameworks/   | checklists/   | Overall       |
| ------------------- | ---------- | ------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| karpathy-guidelines | task-only  | **Compliant** | n/a           | —             | —             | —             | **Compliant** |
| git-workflow        | standalone | **Compliant** | **Compliant** | —             | —             | —             | **Compliant** |
| spec-plan           | standalone | **Compliant** | **Compliant** | —             | —             | Non-compliant | Partial       |
| doc-architecture    | standalone | **Compliant** | **Compliant** | Non-compliant | —             | —             | Partial       |
| exec-plan           | standalone | **Compliant** | n/a¹          | —             | Non-compliant | —             | Partial       |
| doc-product         | standalone | **Compliant** | **Compliant** | Non-compliant | —             | Non-compliant | Partial       |
| doc-engineering     | standalone | **Compliant** | **Compliant** | Non-compliant | Non-compliant | Non-compliant | Partial       |

¹ exec-plan is a thin dispatcher whose stage logic already lives in
`frameworks/` (4 stage files); no `tasks/` extraction was needed.

All "Partial" overalls are now driven **solely** by the untouched folder types
(`templates`/`frameworks`/`checklists`), not by the entry points.

---

## D1 — `SKILL.md` filename: CLOSED (permanent required deviation)

Verified against the official Claude Code skills documentation:

- **`SKILL.md` is mandatory** — "Each skill is a directory with `SKILL.md` as
  the entrypoint." The loader discovers skills by scanning registered paths for
  files literally named `SKILL.md`. Renaming to `{dir-name}.md` removes the
  skill from discovery.
- **The directory name already serves Skillsmith's intent** — the command is
  derived from the directory (`doc-architecture/` → `/skills:doc-architecture`);
  the `name` frontmatter is only a display label.
- **Extra frontmatter (`type`/`version`/`category`) is safely ignored** by the
  YAML parser.

**Disposition:** This is the single point where the two standards are mutually
exclusive. Keeping `SKILL.md` is correct. It is no longer counted as a gap — it
is a documented, intentional deviation required by the host platform.

---

## D2 — Process extraction: DONE

Six new task files created in Skillsmith task format (no frontmatter;
`<purpose>` → `<user-story>` → `<when-to-use>` → `<steps>` with snake_case named
steps → `<output>` → `<acceptance-criteria>`):

| Skill            | Task file(s)                                       | Entry point now                                     |
| ---------------- | -------------------------------------------------- | --------------------------------------------------- |
| git-workflow     | `tasks/isolate-workspace.md`                       | 65 lines — identity + routing                       |
| doc-architecture | `tasks/document-architecture.md`                   | 82 lines                                            |
| doc-product      | `tasks/scan-product.md`, `tasks/author-product.md` | 131 lines (identity + shared reference, no process) |
| doc-engineering  | `tasks/document-engineering.md`                    | 93 lines                                            |
| spec-plan        | `tasks/create-spec-plan.md`                        | 66 lines                                            |

Entry points now contain **no `## Process`/`## Step` workflow blocks** (verified
by grep). They hold frontmatter, the four XML sections, `@tasks/...` routing,
and — where genuinely shared across tasks — small reference blocks (e.g.
doc-product's boundary rules and Doc Paths). All process content was moved
**verbatim**, with step bodies preserved and cross-references rewritten to step
names.

### tasks/ conformance check (against `tasks.md`)

- [x] No YAML frontmatter
- [x] `<purpose>`, `<user-story>` (As a… I want… so that…), `<when-to-use>`
      present
- [x] `<steps>` with `<step name="snake_case">`, imperative voice, explicit wait
      points where input is needed
- [x] `<output>` and `<acceptance-criteria>` (plain checklists) present
- Minor: reference tables (Doc Paths, Doc Types, Topology) are placed as
  markdown sections rather than `<context>`/`<references>` tags. Harmless;
  convert if strict tag-conformance is wanted.

---

## Entry-point conformance (against `entry-point.md`)

All 7 now pass every applicable check:

- [x] Frontmatter: `name` (kebab), `type`, `version` (`0.1.0`), `category`,
      `description`
- [x] `<activation>` (What / When to Use / Not For)
- [x] `<persona>` (Role / Style / Expertise)
- [x] `<routing>` (Load on Command → tasks; Load on Demand →
      frameworks/templates/checklists) — karpathy n/a (task-only, no aux files)
- [x] `<greeting>`
- [x] Entry point is thin — process lives in `tasks/`
- [x] @-references resolve to existing files
- [—] `<commands>` omitted — none are multi-command suites
- [D1] Filename `SKILL.md` — permanent required deviation (see above)

XML tag balance verified across all entry points (1 open / 1 close per section).

---

## Remaining non-conformance — folder types (out of scope, unchanged)

These were never in scope for D1/D2 and remain as the first audit described:

- **`frameworks/`** (doc-engineering ×5, exec-plan ×4) — have frontmatter and
  are instruction/process files (per-type / per-stage). Skillsmith would
  classify these as `tasks/`. **Note:** after D2 the codebase now has both
  `tasks/` (new) and these task-like `frameworks/` — if you want full taxonomy
  consistency, these are the next candidates to move to `tasks/`.
- **`templates/`** — direct doc skeletons with `<angle>`/HTML-comment
  placeholders; no `# X Template` header, fenced block, Field Documentation, or
  Section Specifications.
- **`checklists/`** — reviewer system prompts, not `- [ ]` pass/fail checklists.

---

## Bottom line

- **Entry points: fully Skillsmith-structured and thin.** D2 done.
- **`tasks/`: conformant.**
- **D1: closed** — `SKILL.md` is a required platform deviation, not a fixable
  gap.
- **Remaining gap is entirely in the three untouched folder types**, which you
  chose to leave. The clearest next step, if desired, is reclassifying the
  task-like `frameworks/` into `tasks/` for taxonomy consistency.

---

*Generated by /skillsmith audit*
