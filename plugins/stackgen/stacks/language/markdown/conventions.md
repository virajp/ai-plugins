# Markdown as the language

Most projects hold markdown; a few are **written in** it. This component is for
the second case — where the shipped artifact is prose with frontmatter, loaded
by a host that reads it directly, and there is no compile step between what is
authored and what runs.

## What that changes

- **Frontmatter is the interface.** The prose is the payload, but the
  frontmatter is what a host parses to decide whether the file exists at all. It
  is validated like an interface, not like metadata: a key the host does not
  recognize is a typo that fails silently, and a value of the wrong type drops
  the file without an error. Parse it with a **strict** YAML parser in the
  repo's own checks — a lenient one accepting it proves nothing about the host.
- **There is no build, so the review is the gate.** Nothing catches a mistake
  between authoring and loading. Whatever correctness this project has comes
  from checks the repo runs against the authored tree itself, which makes those
  checks load-bearing in a way they are not for a compiled language.
- **The toolchain belongs to the repo axis.** Formatting, linting and link
  checking are repo-wide concerns applied to every markdown file, not a
  language toolchain installed per project. This component installs nothing and
  pins no tool; what runs is whatever the repo's own gates run.

## Placement and structure

- **One directory per unit**, named for the unit, with the entry file at a fixed
  name the host expects. A reader finds a unit by its directory name; nothing
  should have to grep for it.
- **Split by load cost, not by length.** A file loaded on every invocation stays
  small and routes to on-demand references beside it; a file loaded only when
  needed carries whatever it needs to be complete. There is no line cap — a unit
  that outgrew one sitting is decomposed into a router plus references, never
  trimmed to fit a number.
- **Prose is the source of truth for judgment; tables are for lookup.** A
  decision with a reason belongs in prose where the reason survives. A closed
  set of values belongs in a table where it can be scanned.

## What not to do

- **Do not restate the host's own documentation.** A unit that explains what the
  host already explains ages badly and adds nothing; state what *this* project
  decided, and link the host's docs for the rest.
- **Do not encode behavior in prose the host cannot read.** If a rule matters to
  the host, it belongs in frontmatter or in a check. Prose the host never parses
  is a convention for humans, and should be honest about being one.
