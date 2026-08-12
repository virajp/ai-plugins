# Vendored from andrej-karpathy-skills

vwf ships the Karpathy coding guidelines directly rather than depending on the
upstream plugin. Before this, `andrej-karpathy-skills` was a url-sourced entry
in `marketplace.yaml` and a vwf dependency — and a url-sourced plugin has no
rendered bundle, so **only Claude's marketplace could resolve it**. Cursor's
target excludes it (`build/src/targets/cursor.test.ts`) and the OpenCode
installer skips it (`cli/src/plan.ts`, the `localOnly` branch), which left
OpenCode users installing `vwf` and getting none of the guidelines it assumes
are on.

That is the same failure that got mempalace vendored, and the remedy is the
same: vendoring is what makes the guidelines ship on every target instead of
only where a marketplace can reach.

## Provenance

| | |
|---|---|
| **Upstream** | <https://github.com/multica-ai/andrej-karpathy-skills> |
| **Version taken** | `1.0.0` |
| **Taken from** | the resolved plugin cache — a shallow clone of upstream `main`, verified against it at the time of vendoring |
| **Licence** | MIT, **as declared in frontmatter and `plugin.json` only** — upstream publishes no licence text; see [NOTICE.md](NOTICE.md), which ships with every rendered bundle |
| **Author** | `forrestchang` |
| **Derived from** | <https://x.com/karpathy/status/2015883857489522876> |

## What was taken

One skill, and nothing else:

| Upstream path | Lands as |
|---|---|
| `skills/karpathy-guidelines/SKILL.md` | `templates/vwf/skills/karpathy-guidelines/` |

Deliberately **not** taken: `EXAMPLES.md`, `README.zh.md`, `CLAUDE.md`,
`CURSOR.md`, `.claude-plugin/` and `.cursor/`. The first two are documentation
about the skill rather than the skill; the rest are upstream's own packaging for
targets this repo renders itself. Only the agent-facing prose is vendored.

No `invocation:` key was added, so the skill takes the default `both`. That is
what behavioural guidance wants: read by the model as doctrine, and invocable by
hand as `/vwf:karpathy-guidelines` when someone wants to read the pillars.

## Local edits

**One, and it is five characters.** The fenced block under *Goal-Driven
Execution* was opened bare; it is now opened as `text`. This repo's lint gate
requires a language on every fence (`markdown/fenced-code-language`), and a
vendored file is linted like any other. Nothing inside the fence changed.

The **render** needed no edit at all: the text carries no Eta tag-opening
sequence for the renderer to interpret, its frontmatter is already strict-YAML
valid, its links are absolute URLs rather than paths this repo would have to
rewrite, and `templates/**/*.md` is excluded from dprint, so nothing reflows it.
The frontmatter's `name`, `description` and `license` keys are re-emitted byte
for byte.

Re-apply the fence language on any resync — everything else is a straight copy,
so a resync is a diff rather than a merge.

## Resync policy

This is a **one-time fork, re-synced deliberately** — not a mirror and not a
submodule. Nothing automated watches upstream, so a change there is invisible
here until someone looks.

To re-sync: diff `skills/karpathy-guidelines/SKILL.md` against the upstream tag,
apply what matters, and update the **Version taken** row. That row is the only
thing that makes drift detectable, so it is the one edit that must not be
skipped.

Re-check the licence position at the same time. If upstream has since published
a real licence file, take it — [NOTICE.md](NOTICE.md) exists precisely because
today it has not.
