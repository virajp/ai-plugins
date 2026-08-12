# The statusline, and why it lives in the CLI

The statusline is **not a plugin**. It ships inside `@askviraj/ai-plugins`, the
same small CLI that installs the plugin toolkit, and it is installed by the same
command.

```sh
pnpx @askviraj/ai-plugins --statusline
```

This page exists to explain that placement. **The full configuration reference
is [docs/plugins/statusline.md](../plugins/statusline.md)** — the script, its
defaults, the JSON schema, the caps hook, and every per-surface option. Nothing
here repeats it.

## Why it is not a plugin

A plugin is content a host tool loads: skills, agents, hooks, servers. A
statusline is not content — it is a **line the host tool draws**, and every
target offers a different mechanism for drawing it. There is no plugin manifest
key on any of the four targets that installs one. So the statusline rides the
installer instead, which is the one component that already knows how to touch
each tool's own configuration.

That is also why it is gated differently from everything else the CLI installs.
Installing a plugin adds a file; configuring a statusline **displaces what the
user already had**. `--statusline` is the only consent for that step, `--all` is
not, and a bar the tool does not own is never replaced silently.

## Three installs of one idea

"The statusline" is a single idea reaching three targets through three unrelated
mechanisms, because none of them offers ours. The goal across all three is
**information parity, not visual parity** — each tool keeps its own separators
and palette.

| Target      | Mechanism                                                           |
| ----------- | ------------------------------------------------------------------- |
| Claude Code | a config key pointing at the shipped script                         |
| Oh-My-Pi    | four `omp config set statusLine.*` keys                             |
| OpenCode    | a TUI plugin drawing into the bottom slot, registered in `tui.json` |
| Cursor      | **nothing — Cursor exposes no status surface at all**               |

Cursor's row is the one worth remembering. It is not an unimplemented target;
there is no surface to implement against, so a `--statusline` run simply has
nothing to do there.

Two consequences follow from the mechanisms rather than from choice. The
OpenCode plugin ships as authored `.tsx` because that loader is Bun and nothing
needs transpiling. And the OpenCode line carries no rate-limit windows, because
OpenCode exposes no ambient rate-limit state — a made-up number would be worse
than a missing one.

## The caps hook is Claude-only

Installing the Claude statusline also wires a **context & rate-limit caps
hook**, which pauses long `/vwf:execute` runs at budget thresholds by triggering
a handoff. It is Claude-only because its sensor *is* that bar: neither of the
other two surfaces exposes the numbers it reads.

## Where to go next

- [docs/plugins/statusline.md](../plugins/statusline.md) — setup and the full
  configuration reference.
- [usage.md](./usage.md) — the `--statusline` and `--no-statusline` flags in the
  context of the whole flag surface.
- [internals.md](./internals.md) — where the three surfaces live in the source,
  and the receipt each one writes.
