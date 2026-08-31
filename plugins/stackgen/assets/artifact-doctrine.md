# Artifact Doctrine — what makes a generated artifact valid

stackgen's output vocabulary is **skills, agents, hooks and rules**
(`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`), landed in a repo's committed
`.claude/` tree. This file is what each of those has to be to actually work.

It is **host doctrine, not stack doctrine**: it says nothing about any
technology, and it applies identically to every generation run whatever the
stack. `kinds.md` decides what an artifact must *cover*; this decides whether
the artifact is *valid at all*.

**Read by the generator** while producing output, and by the
`stackgen-skill-reviewer` as a gate. Neither may wave a violation through — the
failures below are almost all **silent**, so nothing downstream will catch what
this misses.

**This is never materialized.** It governs stackgen's output; it is not part of
it.

---

## 1. Frontmatter must be strict-YAML valid

Every skill and agent opens with a YAML frontmatter block. The host's own
parser is lenient; a stricter one rejects, and **a rejected skill is dropped
with no error** — it does not appear, and nothing says why.

The spellings that pass a lenient parser and fail a strict one:

- An unquoted value containing `:` followed by a space.
- An unquoted value opening with `[`, `{`, `*`, `&`, `!`, `%`, `@`, or a
  backtick.
- A folded or literal block scalar whose continuation lines are misindented.
- Tabs used for indentation anywhere in the block.

A `description` is the field that trips this most, because it is prose and
prose contains colons. When in doubt, fold it and indent the continuations
consistently.

**Never emit frontmatter that has not been parsed.** A generation run that
cannot parse its own output has produced nothing, and will not find out.

## 2. Invocation — the decision that fails silently

Who may invoke a skill is spelled with two independent booleans, and the useful
states are three:

| State                 | Frontmatter                            | For                                         |
| --------------------- | -------------------------------------- | ------------------------------------------- |
| user **and** model    | `disable-model-invocation: false`      | anything another artifact delegates to      |
| model only (doctrine) | `user-invocable: false`, plus `paths:` | auto-applies when matching files are edited |
| user only             | `disable-model-invocation: true`       | the user owns the timing                    |

**A user-only skill is removed from the model's context entirely**, so it
cannot be invoked by another skill, and the failure is silent — the delegating
caller simply cannot see it and gets no error.

**The rule: model-invocable when anything delegates to it; user-only when
nothing does.** Doctrine — `user-invocable: false` paired with `paths:` — is
the auto-applying archetype and is model-only by construction.

Each kind's **Invocation** ruling in `kinds.md` fixes which state its artifacts
take. A generation run that emits the wrong state produces an artifact that
looks landed and never fires.

Before emitting a user-only skill, confirm nothing else in the generated set
references it as a delegation. The reverse trap is worse because it is
invisible from the callee's side: a delegation added to an artifact that is
already user-only will never fire, and nothing reports it.

## 3. Names are scoped, and constructed names are a defect

A skill name need only be unique within the tree that ships it. Prose may name
a skill plainly; there is nowhere for a bare name to resolve wrongly.

**Never emit an artifact that builds a skill name from configuration.** A
constructed name that does not resolve returns nothing rather than erroring, so
three different faults produce one indistinguishable result: the skill is
user-only and invisible; the thing that would answer is absent; or it answered
honestly and the answer is empty. Only the third is valid.

This is why stackgen materializes a **fixed** name into the repo's own
`.claude/` — `ux-gate` rather than `<plugin>-ux-gate`. Generated output must
keep that property: fixed names, resolved at materialization time, never
assembled at run time. Where a caller genuinely cannot avoid one, it needs a
preflight that distinguishes the three faults and halts on the first two.

## 4. Hooks

A generated hook is at most a **recommendation in prose**; only packs ship
executable scripts (`pack-format.md`). Where a pack does ship one, or where
generated prose tells a user how to write one, these hold.

### The verdict shape follows the event

Two shapes, and they are **not** interchangeable:

| Event                | Denial                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `PreToolUse`         | `hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision}` |
| `Stop`, `PreCompact` | top-level `{"decision": "block", "reason": …}`                         |

A `hookSpecificOutput` without a matching `hookEventName` makes the host reject
the **whole** verdict. There is no variant that denies on `Stop` — its one
field is `additionalContext`, which lets the stop through — and none at all on
`PreCompact`.

**This is the worst failure mode in the hook surface**, because a rejected
verdict is indistinguishable from a hook that chose to stay quiet. A real
checkpoint hook shipped the `PreToolUse` spelling on a `Stop` event and was
silently rejected on every invocation; nothing in any log said so, and it
looked like it was working because staying quiet is what it does most of the
time. When a hook "does nothing", suspect the verdict shape before the logic.

### Portable shell, and a guard around anything optional

- **macOS ships BSD `sed`**, which supports neither `\s` nor `\b`. Use POSIX
  classes (`[[:space:]]`) and explicit boundaries. Worth a table test through
  the *system* sed rather than a reading — the GNU and BSD behaviours differ
  silently on exactly the patterns that look portable.
- **Guard a hook that shells out to an optional binary**, so a machine without
  it is not blocked on every matching tool call:

  ```sh
  command -v <tool> >/dev/null 2>&1 && <tool> hook claude || true
  ```

  Report the absence once, somewhere the user will look. A per-invocation
  warning on a `Bash` matcher is unusable noise, which is why the guard
  swallows it.
- **A `PreToolUse` hook that rewrites a command** does so with `updatedInput`.
  A deny-with-correction is the fallback where that is unavailable, and it is a
  genuinely worse experience rather than an equivalent one.

### State between invocations

A hook is a fresh process every time, so anything counting invocations needs a
state file — `$XDG_STATE_HOME` (falling back to `~/.local/state`), never the
repo. Two things are easy to get wrong:

- **Break your own loop.** A `Stop` hook that triggers work which itself stops
  will re-enter. The host sets `stop_hook_active: true` on the re-entry; honour
  it, and reset the counter there rather than incrementing.
- **Honour the underlying tool's own opt-out** where it has one, rather than
  inventing a second switch that disagrees with it.

### Where a generated hook is registered

Output lands in a repo's `.claude/` tree, where hook entries belong to
`.claude/settings.json`. That file is **never edited without separate explicit
consent** — a pack's `hooks.yaml` entries land behind the materializer's own
settings-consent line, never folded into the ordinary dry-run gate.

## 5. MCP and LSP wiring

Both are **JSON configuration, not artifacts** — which is why stackgen holds no
registry of them and generates the **installer** rather than the config. A
curated list could only ever hold what someone curated, and stackgen exists for
the uncovered tail.

What the generated wiring must respect:

- **The transport choice is load-bearing, not stylistic.** A **stdio** MCP
  server is a child of the client: when it dies the connection stays dead for
  the rest of the session, and one process is spawned per session — each
  holding its own copy of whatever it loads. An **http** server is a long-lived
  process the user runs, so it reconnects, survives session restarts and serves
  every client at once. Prefer stdio for a cheap stateless tool; prefer http
  for anything holding a model, a store, or state shared across sessions.
- **Two servers must not write one store** unless the store's own backend
  documents concurrent writers, and a lockless read-modify-write file beside
  the store counts as the store for this purpose.
- **An LSP declaration must not start a server in a repo with no matching
  files.** Every generated `lspServers` entry **must** carry an
  `extensionToLanguage` map. This is a hard rule, not a preference: the map is
  the only guard, so a declaration without one starts unconditionally in every
  session in every repo — and since the generated declaration is user-scoped
  (below), that is every repo on the machine. An entry with no map is invalid
  output; the reviewer fails it.
- **A generated installer writes the user's own project files.** `.mcp.json` is
  an ordinary repo file and is a permitted target under the tier-2 consent
  model; it is still a separate, skippable consent line.

### The local-plugin form

`lspServers` exists only in a plugin manifest, so the installer pattern above
takes one further form: stackgen **generates a plugin** at the fixed path
`~/.claude/plugins/local/stackgen-lsp/` — a `.claude-plugin/plugin.json`
carrying `lspServers` and `mcpServers` as a union across the user's stacks,
beside a single-plugin `marketplace.json` — and prints the two `claude plugin`
commands that register it at **user** scope. The full contract, the consent
tier and the lockfile key are
`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`.

Three rules bind the generated manifest:

- **The path and the plugin name are fixed**, never assembled from the stack
  pin — §3 applies to a plugin name exactly as it does to a skill name.
- **Every `lspServers` entry carries `extensionToLanguage`**, per the rule
  above. User scope is safe only because of it.
- **A server belongs in exactly one place.** Project-scoped servers go to the
  repo's `.mcp.json`; user-scoped ones go to this manifest. Declaring the same
  server in both gives the store two writers, which the concurrency rule above
  already forbids.

## 6. Rules

A rule is the one-screen artifact: a constraint short enough that lazy loading
would cost more than it saves. Anything that needs a second screen is a skill
with references instead.

## What the reviewer checks

Beyond its per-kind structural checklist, the `stackgen-skill-reviewer` fails
an artifact for any of: frontmatter that does not parse strictly; an invocation
state contradicting its kind's ruling; a skill or plugin name assembled from
configuration; a hook verdict shape that does not match its event; a
`settings.json` or `.mcp.json` edit not behind its own consent line; an
`lspServers` entry with no `extensionToLanguage` map; and a local-plugin write
or registration not behind its own tier-3 consent line.

Every one of these is silent at run time. That is the whole reason they are
checked here.
