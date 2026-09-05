---
name: repo-hygiene
axis: repo
kind: repo-hygiene
unconditional: true
components:
- repo-hygiene/repo-hygiene@1.0.0
---

# Repo — hygiene

The files a repository carries **whatever it is written in**: a sectioned
`.gitignore`, an `.editorconfig` and a `.gitattributes`, a licence, a
`SECURITY.md` naming a private channel for a vulnerability report, and the
dependency-update policy. None of them runs; all of them are the ground the
gates run over.

**This is not a menu pick.** There is exactly one pack in this slot, and a
one-entry menu is theatre. The frontmatter carries `unconditional: true`, so
`stackgen-stack-menu` leaves this bundle out of the payload it returns and
`/vwf:init` fetches it by its **fixed slug** — `repo-hygiene` — instead.
Fixed, never constructed: a name assembled from configuration is one that
can silently resolve to nothing, which is the rule the `ux-gate` and
design-adapter seams already follow.

The reason it is unconditional is the same one that makes the other two
baselines unconditional, and it bites harder here: **a repo has these files
before it has a stack.** An empty repository with no language chosen still
needs to know what not to commit, and a pack only reaches a repo when
someone picks a bundle. Left to the menu, the first commit of every new repo
would carry whatever the machine dropped into it.

Nothing is recorded in `.config/vwf.yaml` for it — nothing was chosen, so
there is no choice to record. The landing goes in `lock.yaml`, like any
other materialization; this slug is also one of the three whose presence
there is what tells a caller the repo is shaped at all.

**The seam with [Repo gates](repo-gates.md).** A gate *scans*; hygiene
*declares what is not there to scan*. An ignore rule and a scanner allowlist
look alike and are opposites: ignoring a file keeps it out of the commit,
allowlisting one tells the scanner to accept it in. Writing them as one
decision is how a secret ends up committed and unflagged, so the two live
in different packs on purpose.

**The seam with [mise](mise.md).** The toolchain manager's local override
files are hygiene's to ignore and the manager's to document. Each writes one
half, and neither infers the other's.

**One per repo, and stack sections are appended rather than shipped.** The
pack carries the generic sections every repo needs; the per-technology ones
are added at init time from the community templates, one labelled section
each. A pack that froze them would age the moment a language renamed its
build directory, and nobody would notice, because a stale ignore line fails
by being silently absent from a diff.

This kind satisfies no vwf harness capability and realizes no capability
token — nothing in a blueprint chooses an `.editorconfig`.
