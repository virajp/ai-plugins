# Invocation & the flat namespace

Two decisions that fail silently when made wrong: **who may invoke a skill**,
and **what its name is on the targets that have no plugin namespacing**.

## The three-valued key

Skills declare the neutral `invocation:` key — `model`, `user`, or `both` (the
default). It is not cosmetic. On every target, `user` removes the skill from the
model's context entirely, so **a `user` skill cannot be invoked by another
skill, and the failure is silent** — the delegating skill simply cannot see it,
and gets no error.

That makes the vwf mesh the deciding constraint, since every workflow skill is
delegated to by name somewhere:

- **`both` when anything delegates to it.** `git-workflow` (every skill commits
  through it); `blueprint` / `plan` / `execute` (`/vwf:recall` routes its
  continuation through all three); `product` / `architecture` / `design-system`
  / `doctor` (`setup` orchestrates them — and `doctor` also has `plan` and
  `execute` as callers, both of which halt on a blocking finding); `handoff`
  (`execute` runs it at a resource cap, and the statusline caps hook instructs
  it); `feedback` (`verify` routes failures through it); `screens`
  (`feedback canvas` routes into it); `readme` (`setup` orchestrates it).
- **`user` when nothing does**, and the user owns the timing: `setup`, `verify`,
  `mockups`, `archive`, `recall`. Every reference to these from another skill
  must read as a **recommendation to the user**, never an invocation.
- **`model`** is the auto-applying doctrine archetype, paired with `paths:`.

This holds across plugins too. `devtools:scaffold` is `both` because
`/vwf:setup` orchestrates it; so are the stack-adapter and design-adapter skills
on every plugin, which vwf invokes by contracted name. `cicd:workflow` stays
`user` — vwf's mentions of it are prose addressed to the user.

### Before flipping a skill to `user`

Grep its command reference across `templates/vwf/skills/` and
`templates/vwf/agents/` and confirm **every hit is prose addressed to the
user**. The reverse trap is adding a delegation to a skill that is already
user-only: it will never fire, and nothing reports it.

## How each target spells it

All verified against a real install or vendor source — do not infer these.

| Target   | `user`                              | `model`                 | Invocation                             |
| -------- | ----------------------------------- | ----------------------- | -------------------------------------- |
| Claude   | `disable-model-invocation: true`    | `user-invocable: false` | `/vwf:plan`                            |
| OpenCode | moved to `command/<plugin>-<skill>` | bare, under `skills/`   | `vwf-plan`; `/vwf-setup` for user-only |
| Cursor   | `disable-model-invocation: true`    | bare + `paths:`         | `/plan`                                |
| Oh-My-Pi | `disableModelInvocation: true`      | **bare — no key**       | `/skill:vwf-plan`                      |

**Oh-My-Pi has one axis, not two.** `hide` and `disableModelInvocation` are
aliases the loader ORs into a single flag meaning *hidden from the model*. So
doctrine must carry **neither**: emitting `hide` on a `model` skill drops it
from the prompt, and the skill still loads and still lists while never firing.
Nothing can hide a skill from the slash menu alone. This was found only by
checking a real install, having silently broken a whole class of skill.

## The flat namespace

Claude and Cursor scope a skill to its plugin, so `plan` need only be unique
inside its own bundle. **OpenCode and Oh-My-Pi discover every provider's skills
into one namespace keyed by bare name** — where `plan`, `execute`, `verify` and
`product` are generic enough to belong to nobody, and vwf's 25 skills are the
largest single claim on it.

So `plugin.yaml` carries **`prefixSkillNames`**, and vwf sets it: the two flat
targets emit `vwf-plan`, matching OpenCode's existing `<plugin>-<skill>`
convention for user-only wrappers. It is off by default and per-plugin, since
turning it on renames every skill the plugin ships. No other plugin sets it.

The prefix is applied by the **renderer**, never authored. Three things must
agree — the directory, the frontmatter `name:`, and every cross-reference — and
`flatSkillName` in `build/src/target.ts` is the single point they all pass
through.

**Bare prose naming a prefixed skill is a `plugins:check` failure.** It reads
correctly on Claude and resolves to nothing on the flat targets, silently. The
rule matches delegation-shaped mentions only (`via`, `through`, `delegates to`),
because these names double as the workflow's own vocabulary and "the `plan`
stage" is prose, not a call.

`plugins:check` also enforces cross-plugin skill-name uniqueness for the same
reason — two plugins declaring `stack-menu` would overwrite each other on the
flat targets, which is why every adapter skill's contracted name repeats its
plugin.
