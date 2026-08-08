# andrej-karpathy-skills

`andrej-karpathy-skills` is a set of behavioral guidelines that reduce the
coding mistakes large language models make repeatedly, derived from Andrej
Karpathy's observations. Four pillars: **Think Before Coding**, **Simplicity
First**, **Surgical Changes**, **Goal-Driven Execution**.

It is maintained externally at
[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
and **re-listed** in the `virajp-plugins` marketplace under a `url` source, so
it installs from the same place as the rest without any third-party code being
vendored into this repo. It is one of `vwf`'s three dependencies.

## Install

```sh
pnpx @askviraj/ai-plugins --user andrej-karpathy-skills
```

`--project` works too — nothing pins it to a scope.

It is **no longer opt-in**: `vwf` depends on it, so installing `vwf` installs it
and enables it at the same scope. That is a change of position. It used to be
excluded from `--all` on the reasoning that the workflow already enforces the
same pillars structurally — elicitation is *think before coding*, the
plan-as-a-diff and the coder's "nothing that is not in the plan" are *surgical
changes* and the minimalism ladder, TDD behind a coverage gate is *goal-driven
execution*.

That reasoning holds **inside** the pipeline and only there. The ad-hoc,
off-pipeline turn — a quick fix, a question, anything not running under
`/vwf:execute` — has none of those gates, and it is exactly where the mistakes
these skills name occur. So the guidelines are now on by default rather than
something you remember to add.

Being url-sourced changes what each target can do with it, exactly as it does
for [mempalace](./mempalace.md). The three targets with a native marketplace —
**Claude**, **Cursor** and **Oh-My-Pi** — install it from its own upstream repo.
**OpenCode** can only copy a rendered bundle, and there is none to copy, so it
is **skipped with a note**: an OpenCode install of `vwf` leaves you to install
this one yourself, from upstream.

## Skills

The skills are upstream's — this repo neither authors nor renders them, and the
upstream README is authoritative for the current set. They are **doctrine**:
they apply to how work is done rather than being invoked for a task, so there is
no slash command to learn.

## See also

- [../readme.md](../readme.md) — the marketplace overview and full plugin list.
- [vwf](./vwf.md) — the workflow that depends on it, and where each pillar is
  already enforced structurally.
- [mempalace](./mempalace.md) — the other url-sourced `vwf` dependency.
- [upstream](https://github.com/multica-ai/andrej-karpathy-skills) — the
  authoritative skill list and its rationale.
