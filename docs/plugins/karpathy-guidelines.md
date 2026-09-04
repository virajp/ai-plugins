# karpathy-guidelines

`karpathy-guidelines` is a set of behavioral guidelines that reduce the coding
mistakes large language models make repeatedly, derived from
[Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876)
on LLM coding pitfalls. Four pillars:

- **Think Before Coding** — state assumptions rather than guessing, present the
  interpretations instead of silently picking one, say so when a simpler
  approach exists, and stop and name what is confusing rather than hiding it.
- **Simplicity First** — the minimum code that solves the problem and nothing
  speculative: no unasked-for features, no abstractions for single-use code, no
  configurability nobody requested, no error handling for impossible scenarios.
- **Surgical Changes** — touch only what you must and clean up only your own
  mess: don't "improve" adjacent code, match the existing style, mention
  unrelated dead code rather than deleting it, and remove only the orphans your
  own change created.
- **Goal-Driven Execution** — turn a task into a verifiable goal before starting
  ("fix the bug" → write the test that reproduces it, then make it pass), and
  state a brief plan with a check per step. Strong success criteria are what let
  an agent loop without asking.

It biases toward caution over speed. For trivial tasks, use judgment — that
tradeoff is stated in the skill itself.

**It is not a plugin in this marketplace.** It was one — a `url`-sourced
re-listing of
[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills),
and a `vwf` dependency — until it was folded into `vwf` itself. The skill is now
vendored under `plugins/vwf/skills/karpathy-guidelines/`. There is nothing to
install by name.

## Why it was vendored

At the time, this repo authored plugins once and rendered a separate tree per
agent, and only Claude's marketplace could fetch a plugin hosted at a URL:
Cursor's manifest was generated from local plugins alone, Oh-My-Pi took the URL
and then silently dropped the entry, and OpenCode had no marketplace at all —
its adapter copied a rendered bundle, and there was none to copy. So installing
`vwf` on three of the four targets left the guidelines it assumes are on simply
absent.

That is the same failure that got [mempalace](./mempalace.md) vendored, and the
remedy was the same. This repo used to argue the gap was tolerable here —
guidelines missing on one target degrade quality, whereas a missing memory layer
breaks `/vwf:handoff` outright — but the reasoning rested on it being *one*
target, which was never true: only Claude ever had it. The four-target renderer
is retired now — this repo is Claude-first, and another agent is served by the
copy-paste prompt in readme.md's [Other tools](../../readme.md#other-tools)
section rather than a rendered tree — but the vendoring decision outlives the
architecture that motivated it: it settled a licensing question a dependency
edge does not, and a plain `url`-sourced dependency would still leave the
guidelines outside this repo's own review.

Provenance, the version taken, the licence position and the resync policy are
recorded in `plugins/vwf/vendor/andrej-karpathy-skills/`, which ships with the
plugin. It is a deliberate one-time fork, not a mirror and not a submodule —
nothing automated watches upstream, so the **Version taken** row is the only
thing that makes drift detectable.

**On the licence:** upstream declares MIT in its skill frontmatter and its
`plugin.json`, and publishes no licence text at all. Both declarations are
quoted verbatim in that directory's `NOTICE.md`, and no MIT template is
reproduced — shipping words the author never published would be worse than an
honest note.

## Using it

The skill ships with `vwf` and installs with it:

```sh
claude plugin marketplace add virajp/claude-plugins
claude plugin install vwf@virajp-plugins
```

It is **doctrine**: it applies to how work is done rather than being invoked for
a task, so there is normally nothing to type. Read the pillars on demand with
`/vwf:karpathy-guidelines`.

`vwf` already enforces the same pillars structurally *inside* its pipeline —
elicitation is *think before coding*, the plan-as-a-diff and the coder's
"nothing that is not in the plan" are *surgical changes* and the minimalism
ladder, TDD behind a coverage gate is *goal-driven execution*. That holds inside
the pipeline and only there. The ad-hoc, off-pipeline turn — a quick fix, a
question, anything not running under `/vwf:execute` — has none of those gates,
and it is exactly where these mistakes occur. The guidelines cover that turn.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and full plugin
  list.
- [vwf](./vwf.md) — the workflow that ships it, and where each pillar is already
  enforced structurally.
- [mempalace](./mempalace.md) — the memory layer, vendored into `vwf` for the
  same reason.
- [upstream](https://github.com/multica-ai/andrej-karpathy-skills) — the
  authoritative source and its rationale.
