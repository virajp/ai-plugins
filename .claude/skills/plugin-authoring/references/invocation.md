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

That makes the vwf mesh the deciding constraint, since every workflow skill is
delegated to by name somewhere:

- **Model-invocable when anything delegates to it.** `git-workflow` (every skill
  commits through it); `blueprint` / `plan` / `execute` (`/vwf:recall` routes
  its continuation through all three); `product` / `architecture` /
  `design-system` / `doctor` (`setup` orchestrates them — and `doctor` also has
  `plan` and `execute` as callers, both of which halt on a blocking finding);
  `handoff` (`execute` runs it at a resource cap, and the external caps hook's
  directive names it); `feedback` (`verify` routes failures through it);
  `screens` (`feedback canvas` routes into it); `readme` (`setup` orchestrates
  it).
- **User-only when nothing does**, and the user owns the timing: `setup`,
  `verify`, `mockups`, `archive`, `recall`. Every reference to these from
  another skill must read as a **recommendation to the user**, never an
  invocation.
- **Doctrine** — `user-invocable: false` paired with `paths:` — is the
  auto-applying archetype.

This holds across plugins too. `devtools:scaffold` is model-invocable because
`/vwf:setup` orchestrates it; so are the stack-adapter and design-adapter skills
on every plugin, which vwf invokes by contracted name. `cicd:workflow` stays
user-only — vwf's mentions of it are prose addressed to the user.

### Before making a skill user-only

Grep its command reference across `plugins/vwf/skills/` and
`plugins/vwf/agents/` and confirm **every hit is prose addressed to the user**.
The reverse trap is adding a delegation to a skill that is already user-only: it
will never fire, and nothing reports it.

## Two contracts `plugins:check` enforces

Both exist because vwf **constructs** a skill name rather than reading one, so a
name that does not resolve returns nothing instead of erroring — and an empty
result is indistinguishable from a design nobody authored.

- **The design adapter.** All three import skills must be present in
  `design-tools` and model-invocable: `design-tools-import-screens`,
  `design-tools-import-design-system`, `design-tools-import-conversations`.
- **The stack adapters.** `/<plugin>:<plugin>-stack-menu` and
  `/<plugin>:<plugin>-stack-template` must be model-invocable on every stack
  plugin.

## What the flat namespace took with it

Skill names used to have to be unique across **all** plugins, and vwf set a
`prefixSkillNames` flag so the two targets that discovered every provider's
skills into one bare-name namespace saw `vwf-plan` rather than `plan`. Both the
flag and the uniqueness rule are gone: Claude scopes a skill to its plugin, so
`plan` need only be unique inside vwf.

Two things follow, and the second is the one worth remembering. Cross-plugin
name collisions are no longer possible, so an adapter skill's contracted name
repeats its plugin (`datastore-stack-menu`) purely for readability now, not for
correctness. And **prose may name a skill plainly again** — `via plan` used to
be a checker failure because it resolved to nothing on the flat targets; there
is nowhere left for it to resolve wrongly.
