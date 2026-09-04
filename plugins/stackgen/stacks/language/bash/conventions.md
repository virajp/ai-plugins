# Shell as the second language

A project authored in markdown ships shell only where it must — a hook the host
executes, a small check the repo runs. It is never the project's main surface,
and a project with no hooks has no shell at all. That is what makes it optional
rather than absent: the token is admitted, not required.

## Portability is the whole discipline

The script runs on whatever machine installed the project, under whatever shell
the host invokes — not the author's.

- **Target the oldest tool you might meet, not the one on your machine.** On
  macOS that means **BSD `sed`**: no `\s`, no `\b`, no `-i` without an argument.
  A GNU-only expression works for the author and silently fails to match for
  everyone else, which is worse than failing loudly.
- **Prefer the POSIX form when the convenient one is a bashism**, unless the
  script's interpreter line genuinely guarantees bash.
- **Quote every expansion.** An unquoted path with a space is the defect this
  rule exists for, and it only appears on someone else's machine.

## Exit codes are the interface

- **Exit non-zero on failure, and say why on stderr.** A script whose caller is
  a host or a gate communicates only through its exit code and its output;
  anything it prints to stdout may be parsed.
- **A verdict's shape is decided by its caller, never by convention.** Where the
  host defines a response format for the event being handled, that format is the
  contract — emitting a well-formed verdict of the wrong shape reads to the host
  exactly like a script that chose to stay quiet, which is the failure mode that
  hides longest.
- **Guard anything optional.** A script depending on a tool that may be absent
  tests for it and degrades, rather than failing the whole invocation for a
  convenience.

## Keep it small, or stop writing shell

Shell earns its place for a dozen lines of glue. Past that — real argument
parsing, data structures, anything needing tests — the project is better served
by the language it is already written in, or by a task in the repo's own runner.
A long shell script is a decision to revisit, not a style to perfect.
