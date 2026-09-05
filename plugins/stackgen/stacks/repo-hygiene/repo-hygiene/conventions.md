# Repo hygiene — conventions

The files a repository needs **before** it has a stack. Nothing here runs, so
nothing here is a gate: this is the ignore set, the editor and attribute
defaults, the licence and the security contact, and the dependency-update
policy — the four topics of the `repo-hygiene` bar
(`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`).

This bundle is **unconditional**: there is exactly one pack for the slot, so
nothing is picked and nothing is recorded in `.config/vwf.yaml`. It is fetched
by the fixed slug `repo-hygiene`, the way `mise` and `repo-gates` are.

## What this pack writes

| Lands at              | Is                                                      |
| --------------------- | ------------------------------------------------------- |
| `.gitignore`          | the sectioned base; stack sections are appended to it   |
| `.editorconfig`       | the shape defaults a formatter has no plugin for        |
| `.gitattributes`      | line-ending normalisation, generated trees, binaries    |
| `.config/renovate.json` | the dependency-update policy                          |
| `SECURITY.md`         | the private report channel — written only when asked for |
| `LICENSE`             | one of `_licenses/`, **copied by the initializer**      |

Six of the seven files sit at the repo root, which is the whole of the
exception list — everything a repo configures otherwise lives under
`.config/`. The allowlist is `.gitignore`, `.editorconfig`, `.gitattributes`,
`LICENSE`, `SECURITY.md`, `readme.md`, `CLAUDE.md`, `fnox.toml`, the linter's
root shim, `wrangler.jsonc` — which wrangler discovers only at the root —
and the manifests and lockfiles a language mandates at the root. A tool that
merely *prefers* the root is configured under `.config/` and pointed at from
the command line.

**`config/_licenses/` is the one path in this tree that is NOT copied into a
repo.** It is a two-file catalogue the initializer reads: it asks which
licence the repo takes, copies that one file to `LICENSE`, and fills the
placeholders. A repo ends up with `LICENSE`, never with `_licenses/`.

## The gitignore section rule

Every section is a `# ==== <Name> ====` banner and its entries, and each
entry that is not self-evident carries a one-line why above it. Three rules
hold the file together:

- **Sections are appended, never interleaved.** The initializer appends a
  stack's ignore file from `github/gitignore` as its own banner at the end,
  and appends nothing whose pattern the file already carries.
- **The mise local patterns are load-bearing.** They cover every path mise
  loads a local override from; dropping one is how a machine-local pin ends
  up in a review.
- **A negation follows the pattern it re-includes.** `!.env.example` after
  `.env.*`, never before, or git never sees it.

### Which template a pinned pack takes

The pack the repo pins names the template — the initializer never infers one
from a file it happened to find. Every name below resolves at
`https://raw.githubusercontent.com/github/gitignore/main/<Name>.gitignore`,
and each was fetched to confirm it does.

| Pinned pack             | Template appended   |
| ----------------------- | ------------------- |
| `package-manager/pnpm`  | `Node.gitignore`    |
| `language/typescript`   | `Node.gitignore`    |
| `package-manager/uv`    | `Python.gitignore`  |
| `package-manager/pub`   | `Dart.gitignore`    |
| `app-framework/flutter` | `Flutter.gitignore` |

A TypeScript repo on pnpm pins two rows naming the same template and gets
**one** `# ==== Node ====` section — the append rule is per section, not per
pack. A Flutter repo pins `pub` and `flutter` and gets both: the Dart template
covers the package tooling, the Flutter one the app build output above it.

The rest of this tree has **no row and needs none**. `language/bash` and
`language/markdown` have no template upstream at all; `framework/effect` is
Node, already appended by the pack that pins it; and `toolchain-manager/mise`,
the toolchain gates, `datastore/postgres`, `ci-system/github-actions`, the
cloud packs, the deploy targets and the design tools write nothing an ignore
file has to learn — the base sections already cover them. Absence here is an
answer, not an omission.

**A pinned pack with no row is proposed, never guessed.** The initializer
names the template it would fetch and waits for a yes; a wrong name is a 404,
and a 404 is a section that silently never lands. Once confirmed, the row
belongs in this table.

**The seam with secret scanning.** Ignoring a file and allowlisting it are two
different acts, and this file only does the first. A secret that is ignored is
a secret that was never scanned — so an ignore entry is never the answer to a
scanner finding, and an entry added because "the scanner keeps complaining" is
the one edit to refuse. The allowlist belongs to the scanner's own config, by
fingerprint.

## The placeholder vocabulary

Three, and no others. The initializer fills them; nothing else in this pack
uses a placeholder, so a `<` in a shipped file is one of these or a bug.

| Placeholder  | Filled with                                                  |
| ------------ | ------------------------------------------------------------ |
| `<REPO_URL>` | the repository's web URL, no trailing slash                  |
| `<YEAR>`     | the year the licence is first applied                        |
| `<HOLDER>`   | the copyright holder — a person or the legal entity          |

## Licence and security contact

**Both are asked, never assumed.** A repository that declines a licence gets
no `LICENSE` file, which is a legible answer — "all rights reserved" — and
not the same as a licence chosen by a tool on the author's behalf. The two
offered are MIT and Apache-2.0: permissive either way, differing in whether
the grant is explicit about patents and about what a contributor is
contributing.

`SECURITY.md` is the same call. A repository with no private channel to point
at is better off with no file than with one naming a channel nobody watches.

## Dependency updates

`.config/renovate.json` is a policy, not an installation — nothing here adds a
bot to the repository, and the file is inert until one is enabled on it. What
it encodes: the recommended baseline, minor and patch grouped into one pull
request, weekly lockfile maintenance, and a **ten-hour minimum release age**,
which is the same number the toolchain manager pins its fuzzy resolution to.
The two are one decision — a version too new to have been withdrawn yet is not
a version this repo installs — so they move together.

Two managers are enabled by name. The mise manager reads the toolchain
manager's config files (including `.config/mise/conf.d/*.toml`, which is where
a secrets provider declares its tool) and is on by default; the pre-commit
manager is **off** by default and has to be asked for, or the hook revisions
are the one pinned set nothing updates.

**Renovate's own config discovery does not include `.config/`.** The file is
placed there because that is where this repo's shape puts configuration, and a
repository that actually enables the bot either points `configFileNames` at it
(self-hosted) or carries the root name the hosted app searches for. The
initializer says so when it writes the file.
