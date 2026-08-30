# Gaps — vwf was resolving to a stale install, and the diagnosis went wrong first

**Date** 2026-08-26 · **Branch** `main` · **Tag** `ws2/toolchain`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Found at the start of WS2 (Stage 3 of
[the generalization plan](../../plans/archived/2026-08-26-vwf-generalization/index.md)),
while about to run `/vwf:architecture` against this repo for the first time.

## Corrected 2026-08-26, same day

**This drawer first concluded that skills always load from a cache copy and
never from the checkout. That is wrong**, and the wrong version was committed
(`e0c437a`) before the evidence that settled it arrived. Recorded here rather
than quietly rewritten, because the mistake is the instructive part.

**What is actually true.** With a directory-source marketplace in a healthy
state, skills load **from the checkout**. After
`claude plugin marketplace update virajp-plugins` +
`claude plugin update vwf@virajp-plugins` and a session restart,
`/vwf:architecture` reported its base directory as
`.../ai-plugins/plugins/vwf/skills/architecture` — the source tree. So the
plan's long-standing constraint (*work in the main checkout, because a worktree
hides plugin edits from the running tools*) **holds**, and briefly marking it
false was an error.

## The real gap

**vwf can silently resolve to a stale install, and nothing announces it.**

Before the update, `/vwf:architecture` reported its base directory as
`~/.local/share/virajp/ai-plugins/claude/claude/plugins/vwf/...` — the retired
render-tree install, `assets/blueprint-format` reading **22**, and a
`plugin.json` carrying **no `version` key at all** (so it lists as `0.0.0`, per
the marketplace trap in CLAUDE.md). Meanwhile the checkout was at 19.1.0 /
format 23.

The repair:

```sh
# commit first — the directory source resolves the committed tree
claude plugin marketplace update virajp-plugins
claude plugin update vwf@virajp-plugins     # bare `vwf` fails: Plugin "vwf" not found
# then RESTART the session — the CLI says so and means it
```

Three traps, each of which contributed to getting this wrong:

- **`claude plugin update vwf` fails** with `Plugin "vwf" not found`. The
  marketplace-qualified `vwf@virajp-plugins` is what works.
- **`installed_plugins.json`'s `installPath` is a version ledger, not the
  resolution path.** It names `cache/virajp-plugins/vwf/<version>/` even while
  skills load from the source directory. Diagnosing from it is what produced the
  wrong conclusion above.
- **A stale resolution is silent.** No version banner, no warning. The **only**
  tell is the base directory a skill announces on invocation — check it whenever
  a plugin edit appears not to have taken.

## Why it matters

**WS2's result is conditional on it.** WS2 exists to test whether the blueprint
format fits a plugin product. Run against a stale install it tests a *previous*
format instead, and every gap it logs is suspect — indistinguishable from a real
finding. **Confirm the loaded vwf version before trusting any WS2 output**, by
reading the base directory of the first skill invoked.

**And it cost a wrong correction.** The stale resolution was real, but the
inference drawn from it — that the checkout is never served — was not, and it
went into a commit. The general lesson: the announced base directory is direct
evidence; `installed_plugins.json` is not.

## A second install, still on disk

`~/.local/share/virajp/ai-plugins/claude/claude/plugins/` (5.6 MB) is the
**retired render-tree installer's** output — the `claude/` tree from the
four-target era. It holds a full plugin set whose
`vwf/.claude-plugin/plugin.json` carries **no `version` key at all** (so it
would list as `0.0.0`, per the marketplace trap in CLAUDE.md) and whose
`assets/blueprint-format` reads **22**.

Nothing in `settings.json` or `known_marketplaces.json` references it. It is
reachable through the installer CLI's `--uninstall` as the `claude.json` legacy
receipt (item 9, `filesOnly`) — but only as part of a full uninstall, which
would also drop the marketplace registration, `devtools`, the graphify hooks and
the graph. **Not removed**; left for a deliberate cleanup.

One honest caveat on the evidence: `skills/architecture/SKILL.md` is
**byte-identical** between that tree and the 19.0.0 cache, so the skill *text*
served at the time could not discriminate between them — only the announced base
directory could, and it named this legacy tree.

## Which pass it belongs to

The install refresh is done (19.1.0 is in the cache and verified to carry the
day's five decisions). What remains:

- **Decide the legacy tree's fate** — delete, or leave with this note as the
  record of what it is. It is the tree that was being served, so leaving it is
  not free: it is a live candidate for the same silent substitution.
