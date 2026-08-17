# Notice — andrej-karpathy-skills

The `karpathy-guidelines` skill in this plugin is third-party work, vendored
here. This file records what upstream says about its licence, and what it does
not say.

## Attribution

| | |
|---|---|
| **Work** | `karpathy-guidelines`, from the `andrej-karpathy-skills` plugin |
| **Author** | `forrestchang` |
| **Upstream** | <https://github.com/multica-ai/andrej-karpathy-skills> |
| **Derived from** | Andrej Karpathy's thread on LLM coding pitfalls — <https://x.com/karpathy/status/2015883857489522876> |

## What upstream declares

MIT, in exactly two metadata places and nowhere else. Both are quoted verbatim.

`skills/karpathy-guidelines/SKILL.md`, in the frontmatter:

```yaml
license: MIT
```

`.claude-plugin/plugin.json`:

```json
  "license": "MIT",
```

## What upstream does not publish

**There is no licence text.** The upstream repository ships no `LICENSE` file on
its default branch — the root holds `.claude-plugin`, `.cursor`, `CLAUDE.md`,
`CURSOR.md`, `EXAMPLES.md`, `README.md`, `README.zh.md` and `skills`, and
GitHub's own metadata reports the licence as `null`. The two lines above are the
whole of it.

**So none is reproduced here.** Pasting an MIT template the author never
published would put words in their mouth and make this file look like evidence
of something it is not. An honest note that records the declaration and its
absence of accompanying text is the accurate thing to ship, and it is what a
reader needs in order to decide anything for themselves.

This differs from the sibling [mempalace](../mempalace/README.md) vendoring,
where upstream publishes a real `LICENSE` and it travels with the code.

If upstream later adds a licence file, take it at the next resync and replace
this section with it — see [README.md](README.md).
