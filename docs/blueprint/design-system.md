---
type: vwf-design-system
title: Design System
description: Product-wide UX contract; the terminal is the only surface it
  styles.
status: reviewed # draft | reviewed | stable
---

# Design System

<!-- Text-only. The registry declares no screen platform — `plugins` is
     system/[plugin] and `installer` is system/[cli] — so the visual sections
     (Brand & Mood, Color Tokens, Typography, Spacing & Layout, Motion,
     Component Behaviors) are omitted rather than filled with values no screen
     consumes. Terminal UX carries the whole contract. -->

## Voice

**Terse and technical.** Short declarative sentences addressed to a developer
who knows their tools. No apology, no exclamation, no encouragement on success —
a run that worked says what it did and stops.

**Where a rule would look arbitrary, one clause of reason.** This is the part
worth protecting: a refusal that says only *cannot do that* invites the user to
work around it, while one that says *refuses rather than guesses* is
self-justifying and is remembered. One clause, not a paragraph, and only where
the behaviour is genuinely surprising.

**This register governs the strings `installer` emits at runtime** — errors,
help, prompts, and the closing report. It stops there.

**It does not govern the `plugins` project's prose.** That markdown already has
an owner: the documentation standards this product ships, which declare writing
style and apply automatically to every markdown file. Two authorities with
disjoint domains, so neither can contradict the other — a register defined in
two places would eventually be defined differently in each.

## Scope

This product has **no screens**. Nothing renders, nothing is designed on a
canvas, and no mockup tree exists. Both projects present themselves entirely as
text:

- **`installer`** — a one-shot command-line tool, platform `cli`. The only
  surface a user directly operates.
- **`plugins`** — extension points the agent host loads. Their output is prose
  inside a conversation the host renders, so this product controls neither its
  presentation nor its register: presentation belongs to the host, and register
  to the documentation standards that govern all markdown here.

So the sections a screen product would fill are **deliberately absent**, not
pending: there is no palette, type scale, spacing scale, or motion contract to
decide, and inventing one would be a doc full of tokens nothing reads.

## Terminal UX

The contract for the `cli` platform. Required because a registry project
declares it, and enforced by the execute **code** reviewer — there is no UX gate
here, because there is nothing to render.

### Output formatting

**Two streams, two audiences, and the split is the contract.**

- **stdout carries the machine plan** — an executable, `#`-commented list of
  commands, safe to pipe to a shell. It is *commands, not data*: this tool's
  output is a sequence of operations, and a caller's most useful consumption is
  to run or inspect them.
- **stderr carries everything for a human** — the enumerated inventory, the live
  step indicator, and the closing report.

The consequence worth stating, because it is the reason for the rule: a run's
human output can be watched while its machine output is redirected, and neither
interferes with the other.

**Structured output is not offered.** No `--json` mode exists and none is
promised. A caller wanting data rather than commands is a use case the product
has not been asked for.

**The machine stream's consumer is a shell, not a JSON processor.** Stating it
positively because the opposite is easy to assume from the stream discipline
alone: keeping stdout clean usually implies structured data, and here it does
not.

### Color semantics

**No color.** This is the decision, not an omission waiting to be filled.

**Meaning is never carried by color alone** — and here that rule costs nothing,
because there is no color to lean on. State is carried by glyphs and words:
`[x]` and `[ ]` for selected and deselected, a `#` prefix for a section of the
machine plan, plain sentences for outcomes.

What this buys: accessible by construction, identical piped and interactive, no
`NO_COLOR` branch, no TTY detection for color, and no palette to keep legible
against terminal themes the product cannot see. A CLI whose output is a command
list and a checkbox table does not need color to be read.

If color is ever introduced it inherits this rule unchanged: roles named
semantically rather than as hex, `NO_COLOR` honoured, non-TTY auto-detected, and
**no meaning conveyed by color that is not already in the text**.

### Progress conventions

**A step indicator, not a spinner** — and the reason is a real constraint rather
than taste. Every step shells out synchronously, blocking for the whole of each
external invocation, so an animated spinner would freeze on one frame for
exactly the seconds it is meant to reassure. A frozen spinner reads as a hang.

What moves is therefore the **step**, and it advances only when something real
has finished. It writes to stderr, and it is **off entirely when stderr is not a
TTY** — piped output has no cursor to rewrite, so the escape codes would land as
literal junk and every transient step would become a permanent line, for a run
whose result is the closing report anyway.

### Errors & exit codes

**Message shape** — what happened, why, and what to do about it. The third part
is not optional: an error that names a problem without naming a next action
makes the user guess.

Two shapes the product commits to:

- **An unknown or retired flag is an error naming itself.** Strict parsing is
  what makes a flag that was removed report its own removal rather than being
  silently ignored — a silent no-op leaves the user believing an option took
  effect.
- **A request that cannot be served answers the request, not the flag table.**
  An invocation that installs nothing prints usage; a request for a capability
  that moved prints where it went.

**Exit codes:**

| Code | Means                                                                    |
| ---- | ------------------------------------------------------------------------ |
| `0`  | the requested operation succeeded                                        |
| `1`  | the operation ran and failed                                             |
| `2`  | **usage error** — the invocation was malformed, so nothing was attempted |

The `0`/`1` split is what the product already does. **`2` is a change**: usage
errors exit `1` today, and separating them lets a wrapper script distinguish
*you invoked me wrong* from *the operation failed* — the two cases that call for
completely different responses. Usage errors are the unknown flag, the retired
flag, and the invocation that requests nothing.

`--dry-run` reports what *would* happen and exits `0`; describing a plan is a
successful operation.

### Help & naming

**A flat flag surface, no subcommands.** Every request is expressed as a
long-form flag. There is no verb-noun command tree, because the surface is small
enough that one does not earn its complexity.

- **Long-form flags only**, spelled out; no single-letter aliases.
- **Help never diverges from what the invocation actually accepts.** Every flag
  the product honours appears in help, and every flag help lists is honoured.
  How that is guaranteed is a build concern, not a contract one.
- **Help wraps at 78 columns**, with descriptions aligned in a column whose
  width is taken from the longest flag. A fixed width rather than the terminal's
  own: it renders identically wherever it is read, including when captured into
  an issue or a transcript.
- **Help is the answer to an empty request**, not only to an explicit request
  for it.

### Interaction

**An interactive prompt requires a real terminal on both ends** — input and
error output. Without one it **refuses rather than guesses**, and says so.

The rule this expresses: a destructive operation never infers consent from
silence. Where a scriptable path is needed, it is an explicit flag whose output
is the machine plan.

**Selection is deselection.** Where the product enumerates things to act on, it
presents them all selected and asks the user to remove what should be kept. The
enumeration is the information; the default is to act on what was found. Making
the user re-name each piece would turn a cleanup into a quiz.

**One exception, and it is a rule rather than a special case: a row whose
removal would modify a file the current checkout tracks starts deselected.**
Dirtying the working tree is not a cleanup, so that choice is always made
deliberately rather than by accepting a default.

**The prompt is a line of input, not a keypress interface.** Rows are numbered;
entering numbers **toggles** those rows; entering nothing accepts the selection
as shown; `q`, `quit` or `cancel` abandons the run without acting. A line prompt
rather than a cursor-driven list because it needs no raw terminal mode, degrades
readably, and is describable in a sentence.

**An enumeration that finds nothing asks nothing.** It says so and exits `0` —
whether or not anyone is watching, and regardless of whether a terminal is
attached. The refuse-without-a-terminal rule applies only once there is
genuinely something to decide; there is no such thing as an unanswerable
question about an empty list.

## Accessibility Standard

**No graphical conformance standard applies, and saying so is the decision.**
WCAG is written for rendered interfaces: its contrast ratios, focus order,
target sizes and reflow criteria have no referent in a product that emits lines
of text. Citing it would imply a conformance claim nothing here could evaluate.

**The stated target is the three rules below** — each one checkable against the
product's actual output, which is what a conformance target is for:

- **No meaning conveyed by color** — satisfied absolutely, since there is no
  color.
- **Output is linear and readable aloud.** No box-drawing that depends on
  alignment to parse, no meaning in cursor position, no content that exists only
  as a transient redraw — the step indicator is decoration, and its content is
  repeated in the closing report.
- **Nothing time-dependent.** No output disappears on a timer; a user reading
  slowly loses nothing.

## Anti-Patterns

- **An animated spinner around a blocking call.** It stops on one frame and
  reads as a crash. See Progress conventions.
- **Meaning in color alone**, including a future one — the text must stand by
  itself.
- **A silently ignored flag.** Retired options report themselves.
- **Human prose on stdout.** It corrupts the machine plan for anything consuming
  it.
- **Prompting with no terminal attached**, or assuming a default for a
  destructive action.
- **Inventing screen tokens for a product with no screens** — a palette or type
  scale in this doc would be contract nothing reads.

## Open Questions

- **None blocking.** If a structured (`--json`) output mode is ever requested,
  it arrives as an explicit flag and does not disturb the stdout-is-a-shell-plan
  rule above.
