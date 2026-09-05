# The Readme Stub, the Licence, and the Rest of Hygiene

The files a repository carries whatever it is written in. All of them are the
hygiene pack's; `init` places them, fills the three placeholders, and stops.

## The readme

**A new repo gets a two-line stub and nothing more:**

```markdown
# <repo name>

<the one-line brief>
```

Both lines come from the two questions the new-repo path asks. An **empty
brief** writes the H1 alone — an honest empty file beats an invented sentence
about a product nobody has described yet.

Then **name `/vwf:readme`** in the report as the command that fills the rest.
It writes the title, the project list, the architecture diagram, the setup
guide and the task list, and it does that by scanning a repo that has
something in it. Running it against a stub is the wrong order.

**An existing readme is never rewritten.** It is moved to the lowercase
filename, content untouched, as the existing-repo pipeline's second survey
pass lists it. `init` writes a stub only where there is no readme at all.

## The licence

Question 4's answer, one of three:

- **MIT** or **Apache-2.0** — copy that one text from the hygiene pack's
  licence catalogue to `LICENSE` at the repo root, filling `<YEAR>` and
  `<HOLDER>`.
- **none** — write no file. That is a legible answer, and it is not the same
  as a licence a tool picked on the author's behalf.

The catalogue directory is **pack-private** and never lands in a repo: the
materializer skips it, and `init` reads one file out of it. A repo ends up
with `LICENSE`, never with the catalogue.

`<YEAR>` is the current year — the year the licence is first applied, not a
range, and not something a later run updates. `<HOLDER>` is `git config
user.name`, confirmed in the plan before applying; where git has no configured
name, ask for it once rather than writing an empty holder.

## The security contact

Question 5's answer fills `<REPO_URL>` in the hygiene pack's security file —
the origin remote's web URL, no trailing slash, with the advisories page as
the proposed default.

**Declining writes no file.** A repository with no private channel to point at
is better off with none than with one naming a channel nobody watches, and
that is the pack's own rule rather than a preference here.

## Copied as-is

The remaining hygiene files land exactly as the pack ships them, with no
placeholder and no question:

| File                         | Is                                                         |
| ---------------------------- | ---------------------------------------------------------- |
| the editor-shape defaults    | indentation and line endings a formatter has no plugin for |
| the attributes file          | line-ending normalisation, generated trees, binaries       |
| the dependency-update policy | the update cadence and the minimum release age             |

The ignore file is the exception among them — it lands as the pack's sectioned
base and then **grows** by the append in
[fragments and sections](fragments-and-sections.md).

**When the dependency-update policy lands, print the caveat the pack's
conventions state** about where that tool actually looks for its
configuration. The file sits where this repo shape puts configuration, which
is not where the hosted service searches; a repo that wants the service
enabled has one more thing to do, and saying so at write time is cheaper than
a policy nobody notices is inert.

## What `init` does not write here

- **`CLAUDE.md`** — `/vwf:setup`'s, out of scope outright.
- **A full readme** — `/vwf:readme`'s.
- **Anything at the repo root that is not on the hygiene doctrine's
  allowlist.** The materializer enforces that as a ceiling and refuses a pack
  that violates it; `init` holds itself to the same line, because a ceiling
  one caller can step over is not a ceiling.
