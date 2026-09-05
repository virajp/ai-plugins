---
name: repo-hygiene
version: 1.0.0
category: development
description: The repo's hygiene files — the sectioned ignore set, the editor
  and attribute defaults, the security contact and the dependency-update
  policy. Keep the sections, keep the why-comments, and never drop the local
  override patterns. Auto-applies when editing .gitignore, .editorconfig,
  .gitattributes, SECURITY.md or the Renovate config.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/.gitignore"
  - "**/.editorconfig"
  - "**/.gitattributes"
  - "**/SECURITY.md"
  - "**/.config/renovate.json"
  - "**/renovate.json"
---

# Repo hygiene

The files a repository needs before it has a stack. None of them runs, so none
of them is a gate — and each one is edited far less often than it is read,
which is why the shape below is worth preserving verbatim.

## `.gitignore`

**Sections are banners, and they stay.** Every entry lives under a
`# ==== <Name> ====` heading, and a new pattern joins the section it belongs
to rather than the end of the file. A stack's ignore set arrives as its own
appended banner; do not fold it into an existing section, and do not append a
pattern the file already carries.

**Keep the why-comments.** A pattern nobody can explain is a pattern nobody
dares delete, and the file grows forever. If you add a non-obvious entry, add
the line that says what it is.

**Never remove the toolchain manager's local-override patterns.** They cover
every path the manager loads a machine-local config from, and each one exists
because that path is real. Dropping one is how a local tool pin reaches a
review.

**A negation goes after the pattern it re-includes.** `!.env.example` under
`.env.*`. Reversed, git never applies it — and the failure is silent, because
the file simply stays ignored.

**A value never becomes an ignore entry.** If a secret was committed, the
answer is to rotate it; ignoring the file afterwards hides the next one too.

## `.editorconfig`

The formatter is the authority for every file type it has a plugin for. This
file covers the rest, plus what an editor does *before* a formatter runs. Two
entries are not style preferences and should not be normalised away: Markdown
keeps its trailing whitespace (two spaces is a hard line break), and `Makefile`
keeps tabs (the syntax requires them).

## `.gitattributes`

Three jobs: normalise line endings, mark generated trees so review collapses
them and language statistics ignore them, and keep binaries out of both
normalisation and the diff. A `merge=<driver>` entry names a driver that some
tool registers elsewhere — the entry alone does nothing, and without the
registration git reports a conflict rather than resolving it, which is the
failure you want.

## `SECURITY.md` and `LICENSE`

Both are per-repo answers, not defaults. `SECURITY.md` names one private
channel; if the channel changes, this file is the only place that says so.
`LICENSE` is copied once, with the year and holder filled — editing the licence
body itself is not a hygiene edit, it is a relicensing decision.

## The dependency-update policy

The Renovate config is inert until a bot is enabled on the repository, so
treat it as a statement of policy: what gets grouped, how old a release has to
be before it is installed, and which managers are on. The minimum release age
matches the toolchain manager's own setting deliberately — change one and
change the other, or the two disagree about what "too new" means.
