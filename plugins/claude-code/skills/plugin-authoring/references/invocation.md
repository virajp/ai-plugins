# Invocation

One decision that fails silently when made wrong: **who may invoke a skill**.

## Two keys, three states

Claude Code spells this with two independent booleans in a skill's frontmatter,
and the useful states are three:

| State                 | Frontmatter                            | Means                                       |
| --------------------- | -------------------------------------- | ------------------------------------------- |
| user **and** model    | `disable-model-invocation: false`      | the default; a slash command the model      |
|                       |                                        | may also invoke itself                      |
| model only (doctrine) | `user-invocable: false`, plus `paths:` | auto-applies when matching files are edited |
| user only             | `disable-model-invocation: true`       | the user owns the timing                    |

The one that bites: **a user-only skill is removed from the model's context
entirely, so it cannot be invoked by another skill, and the failure is silent**
— the delegating skill simply cannot see it, and gets no error.

## The rule, and the grep that enforces it

**Model-invocable when anything delegates to it. User-only when nothing does**
and the user owns the timing. Doctrine — `user-invocable: false` paired with
`paths:` — is the auto-applying archetype, and is model-only by construction.

Before making a skill user-only, grep its name across every skill and agent in
the plugin (and any plugin that reaches it by contracted name) and confirm
**every hit is prose addressed to the user**. The reverse trap is worse because
it is invisible from the callee's side: adding a delegation to a skill that is
already user-only will never fire, and nothing reports it.

A worked example of the mesh this produces, from the `vwf` workflow plugin
whose skills delegate to each other constantly:

- **Model-invocable** — `git-workflow` (every skill commits through it);
  `blueprint` / `plan` / `execute` (`recall` routes its continuation through
  all three); `product` / `architecture` / `design-system` / `doctor` (`setup`
  orchestrates them); `handoff` (`execute` runs it at a resource cap);
  `feedback`, `screens`, `readme` (each routed into by another skill).
- **User-only** — `setup`, `verify`, `mockups`, `archive`, `recall`. Every
  reference to these from another skill reads as a **recommendation to the
  user**, never an invocation.

This holds across plugins too: a skill another plugin invokes by contracted
name must be model-invocable, whoever ships it.

## Constructed names, and why they need a preflight

The sharpest version of the trap appears when a caller **constructs** a skill
name rather than reading one — `/<plugin>:<plugin>-stack-menu`, or an adapter
name resolved from config. A constructed name that does not resolve returns
nothing instead of erroring, so three different faults produce one
indistinguishable result:

- the skill exists but is user-only, so the model cannot see it;
- the plugin that would answer is not installed;
- the skill answered honestly and the answer is empty.

Only the third is a valid outcome. A caller in this shape needs a **preflight**
that distinguishes them and halts on the first two, and the answering plugin
needs its skill pinned model-invocable with a note saying why. Both halves are
required; either alone still fails quietly.

## Names are scoped to their plugin

Skill names need only be unique **inside** a plugin — Claude scopes a skill to
the plugin that ships it, so two plugins may both ship a `plan`. Two things
follow. An adapter skill's contracted name repeats its plugin
(`datastore-stack-menu`) for readability, not for correctness. And prose may
name a skill plainly, since there is nowhere for a bare name to resolve
wrongly.
