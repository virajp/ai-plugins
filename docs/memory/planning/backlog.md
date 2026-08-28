# Backlog

Ideas agreed as worth doing, not yet planned or scheduled. One heading per item.
Promote an item to `docs/plans/` when it is picked up; delete it here when it
lands or is dropped, with the reason.

## Release the plugins from git tags, not `main`

**Raised** 2026-08-28 by Viraj.

Serve the marketplace from a **git tag** instead of this repo's `main`. Claude
accepts a `ref` on a marketplace source, and a ref may be a branch or a tag — so
pinning the registration to a tag decouples "merged" from "released".

**Why.** Today `claude plugin marketplace add virajp/ai-plugins` resolves to
`main`, which makes every push a release. `CLAUDE.md` already concedes the
consequence rather than solving it:

> a bad merge is installable until the build goes red, which is the residual
> risk any git-served marketplace carries.

That risk is only half of it. The sharper cost is that it makes **enhancement
and release the same act** — there is no way to land work in progress without
shipping it, so improvements get held back or batched to avoid reaching users
early. A tag ref removes the coupling: `main` takes work continuously, users
move when a tag is cut.

It would also bring plugin releases into line with how the installer CLI already
ships — `v*` tags, one GitHub Release each — instead of two release models in
one repo.

**Verify before planning:**

- That a marketplace source accepts a tag ref, and how it is spelled on
  `claude plugin marketplace add`. Nothing in this repo exercises it — every
  generated `source` is the directory form `./plugins/<name>`, and the only
  mention of a ref is about url-sourced plugins. Prove it against the real CLI;
  that is `target-verifier`'s job.
- What `claude plugin marketplace update` does against a pinned tag — whether it
  re-resolves the tag, or moves to a newer one. If it does not move, upgrading
  becomes a re-`add`, and the upgrade instructions in `readme.md` and
  `CLAUDE.md` are wrong rather than merely incomplete.
- Whether a tag ref survives the **dependency** path. `vwf` pulls `devtools`
  from the same marketplace; if a dependency resolves against a different ref
  than the parent, the pin leaks.

**Touches when planned:** the install/upgrade instructions in `readme.md` and
`CLAUDE.md`, `docs/cli/usage.md`, the CLI's `marketplace add` call in
`cli/src/install.ts`, `--version`'s "plugins on `main`" report in
`cli/src/version.ts`, and the release ritual in `.claude/skills/release/`, which
currently covers the installer only. The tag namespace needs deciding alongside
the existing drift between `v6.0.0` and the contracted `installer-v6.0.0`.
