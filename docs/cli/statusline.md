# The statusline, and why it lives in the CLI

The statusline is **not a plugin**. It ships inside `@askviraj/ai-plugins`, and
installing it is that CLI's main job.

```sh
pnpx @askviraj/ai-plugins --statusline
```

This page exists to explain that placement. **The full configuration reference
is [docs/plugins/statusline.md](../plugins/statusline.md)** — the script, its
defaults, the JSON schema, the caps hook, and every option. Nothing here repeats
it.

## Why it is not a plugin

A plugin is content a host tool loads: skills, agents, hooks, servers. A
statusline is not content — it is a **line the host tool draws**, configured by
a key in the user's own `settings.json` pointing at an executable. No key in the
plugin manifest reaches it. So the statusline needs an installer of its own, and
that installer is what this package now is, almost entirely.

That is also why it is gated differently from everything else. Installing a
plugin adds a file; configuring a statusline **displaces what the user already
had**. `--statusline` is the consent for that step, and a bar the tool does not
own is never replaced silently. With no terminal to ask on, the run fails rather
than guessing.

## One surface

Claude Code: a config key pointing at the shipped script, plus the caps hook.
One script drives both the main two-line bar and the subagent panel — a payload
carrying a `tasks` array renders the panel, anything else the bar.

**Cursor exposes no status surface at all**, and never did.

The **OpenCode** TUI bar and **Oh-My-Pi**'s four `omp config` segments existed
and were discontinued in the Claude-first release. They are removed cleanly
rather than orphaned — `--uninstall` reads the old receipts and offers them for
removal — but the surfaces are gone and do not come back.

That is worth a sentence on what it cost, because the multi-surface version is
the kind of thing that looks cheap to add back: three unrelated mechanisms, two
foreign-detection tests with different semantics (one surface was overwritten,
the other appended to), a `configure` flag threaded through two installers, a
`.tsx` file no tsconfig could type-check, and a deep-equality ownership test
that asked for consent on every single run until it was found.

## The caps hook

Installing the statusline also wires a **context & rate-limit caps hook**, which
pauses long `/vwf:execute` runs at budget thresholds by triggering a handoff.
Its sensor *is* the bar — it reads the context-window and rate-limit numbers
Claude puts on the statusline payload — which is why it travels with it.

## Its version is its own

The script reports its version from a constant it carries:

```sh
~/.claude/scripts/statusline --version
```

`--version` on the CLI runs the **installed** script and prints that, so you see
what is on disk rather than what the package you just downloaded contains. Under
`pnpx` those are routinely different, and the CLI used to conflate them.

## Where to go next

- [docs/plugins/statusline.md](../plugins/statusline.md) — setup and the full
  configuration reference.
- [usage.md](./usage.md) — `--statusline` and `--no-statusline` in the context
  of the whole flag surface.
- [internals.md](./internals.md) — where it lives in the source, and its
  receipt.
