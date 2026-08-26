# Gaps — does `optional_languages` satisfy the unknown-language test?

**Date** 2026-08-26 · **Branch** `main` · **Tag** `ws2/found`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

The first finding of WS2, hit during `/vwf:architecture`'s Step 6 sync-verify —
which is the check that halts on a stack token vwf does not know.

## The ambiguity

`.config/vwf.yaml` pins `projects.plugins.stack.languages: [ markdown, bash ]`.

- **`markdown`** is declared by
  `plugins/claude-code/stacks/project/claude-code-plugin.md` under `languages:`.
  Unambiguously known.
- **`bash`** is declared by the *same* template — but under
  **`optional_languages: [ bash ]`**.

Two rules meet here and disagree:

- `skills/doctor/references/stack-checks.md:24` — "**No installed plugin
  declares the token** and no materialized facts cover it → report **unknown
  language** as a **blocking** finding." *Declares* is unqualified. On the
  strict reading (`languages:` only), `bash` is unknown and `setup` + `execute`
  halt.
- `assets/stack-vocabulary.md:104` — `optional_languages` is "admitted by the
  template, not required". On this reading the template plainly does declare
  `bash`, and nothing is wrong.

**Resolved for this run by the charitable reading**: `optional_languages`
counts, so `bash` is known and sync-verify passed. Not authored into the
contract — per the plan's rule, WS2 records and works around, never authors
mid-sweep.

## Why it is not merely pedantic

The two readings differ in **severity**, not in wording: one is a clean run, the
other halts `/vwf:setup` and `/vwf:execute`. A contract whose blocking findings
depend on which of two sentences you read last is the kind that produces a halt
nobody can explain.

There is also a real question underneath the wording. `languages:` is documented
as "the plugin owning the language defines its facts" — LSP provision, mise
tool, manifest — and those facts are what doctor §3 checks a language *against*.
It is not stated whether an `optional_languages` token is expected to carry the
same facts. If it is not, then admitting a token there makes it known while
leaving nothing to verify, which is a weaker guarantee than `languages:` gives
and should probably say so.

## What would close it

One sentence in `stack-checks.md` §3 stating whether `optional_languages`
satisfies the declaration test, and one in `stack-vocabulary.md` stating whether
such a token carries language facts. Both are vwf-side wording, no format bump.

Worth doing in the same pass as the parked stack-vocabulary coverage audit
([drawer](2026-08-26-stack-vocabulary-coverage-audit.md)), which already owns
the vocabulary's fact shape — but it does not depend on the merge waves the way
that audit does, so it could land sooner.

## Where it was found

`/vwf:architecture` create-mode run, 2026-08-26, writing this repo's first
`registry.yaml`. Recorded rather than fixed, and the run proceeded.
