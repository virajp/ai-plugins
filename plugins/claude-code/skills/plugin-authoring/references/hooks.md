# Hooks

Hooks are authored directly as a plugin's `hooks/hooks.json`, in Claude Code's
own format, with the scripts beside it. What you write is what runs — there is
no intermediate event vocabulary and no projection step.

They are also the only executable code most plugins hold, which is why the
three rules below are about **shell** as much as about hooks.

## Three rules when editing a hook script

### 1. Plugin hooks are never written to `settings.json`

They are auto-discovered from `hooks/hooks.json` and loaded in memory at
session start. Verify what is active with `/hooks` — inspecting `settings.json`
will show you nothing and prove nothing.

### 2. The verdict shape follows the event

There are two, and they are **not** interchangeable:

| Event                | Denial                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `PreToolUse`         | `hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision}` |
| `Stop`, `PreCompact` | top-level `{"decision": "block", "reason": …}`                          |

A `hookSpecificOutput` without a matching `hookEventName` makes Claude reject
the **whole** verdict. There is no variant of it that denies on `Stop` — its
one field is `additionalContext`, which lets the stop through — and no variant
at all on `PreCompact`.

**This is the worst failure mode in the hook surface**, because a rejected
verdict is indistinguishable from a hook that chose to stay quiet. A real
checkpoint hook shipped the `PreToolUse` spelling on a `Stop` event and was
silently rejected on every single invocation; nothing in any log said so, and
the hook looked like it was working because staying quiet is what it does most
of the time. When a hook "does nothing", suspect the verdict shape before the
logic.

### 3. Portable shell, and a guard around anything optional

- **macOS ships BSD `sed`**, which supports neither `\s` nor `\b`. Use POSIX
  classes (`[[:space:]]`) and explicit boundaries. This is worth a table test
  through the *system* sed rather than a reading of the script — the GNU and
  BSD behaviours differ silently on exactly the patterns that look portable.
- **Guard a hook that shells out to an optional binary**, so a machine without
  it is not blocked on every matching tool call:

  ```sh
  command -v <tool> >/dev/null 2>&1 && <tool> hook claude || true
  ```

  Report the absence once, somewhere the user will look — a per-invocation
  warning on a `Bash` matcher is unusable noise, which is the reason the guard
  swallows it rather than printing.
- **A `PreToolUse` hook that rewrites a command** does so with `updatedInput`.
  That capability is not universal across agent tools; a deny-with-correction
  is the fallback shape where it is missing, and it is a genuinely worse user
  experience rather than an equivalent one.

## State that has to survive between invocations

A hook is a fresh process every time, so anything counting invocations needs a
state file — `$XDG_STATE_HOME` (falling back to `~/.local/state`) is the right
home for it, never the repo. Two things are easy to get wrong:

- **Break your own loop.** A `Stop` hook that triggers work which itself stops
  will re-enter. Claude sets `stop_hook_active: true` on the re-entry; honour
  it, and reset the counter there rather than incrementing.
- **Honour the underlying tool's own opt-out**, if it has one, rather than
  inventing a second switch that disagrees with it.
