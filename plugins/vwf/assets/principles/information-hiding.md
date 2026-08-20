# Information Hiding (Parnas)

## Definition

Decompose a system by **decisions, not by steps**: each module owns one
design decision likely to change — a data representation, an algorithm, a
format, a vendor choice — and hides it behind an interface that would
survive that decision changing. Others use the module knowing *what* it
does, never *how*.

This is the deepest of the modularity principles: the SOLID entries are
largely its consequences. It also explains why "hide the database" and
"hide the vendor" ([dependency inversion](dependency-inversion.md)) work —
they are decisions with high change probability given a hiding place.

## Smells

- Modules named after processing steps (`step1_parse`, `step2_transform`)
  rather than after the decisions they own — a flowchart, not a
  decomposition.
- A "private" representation everyone knows: raw structures returned from
  accessors, internal fields reached across the boundary, callers doing the
  module's math with the module's data.
- A one-line change to a representation or format rippling through many
  modules — the ripple's width *is* the leaked decision's exposure.
- Interfaces that restate their implementation: parameter names, ordering
  quirks, or error codes only explicable by how the insides work today.
- Shared mutable state as the interface between modules.

## How a reviewer verifies it

- For each module the diff creates or reshapes, name **the decision it
  hides** in one sentence. No hideable decision → it is a step, not a
  module; consider inlining it.
- Play the change game: pick the module's likeliest change (new format, new
  representation, new vendor) and walk who else would have to edit. Anyone
  outside the module → the decision leaks there.
- Inspect what crosses the boundary: internal types, half-processed
  structures, or indices into private state crossing outward are leaks even
  when the fields are nominally private.
- Check the module's tests exercise the interface only. Tests that reach
  into internals will freeze the very decision the module exists to keep
  changeable.

## Application patterns

- List the volatile decisions first — formats, representations, algorithms,
  vendor choices, policies — and assign each a home; the module map falls
  out of the list.
- Design each interface for the decision's *absence*: expose operations
  meaningful even if the insides were rewritten tonight.
- Return domain values, not internals; accept intentions, not
  representation fragments.
- Pair with [single responsibility](single-responsibility.md): one decision
  per module keeps "reason to change" concrete rather than rhetorical.

## When not to apply it

- **Some information is the contract.** Data that two sides must agree on —
  a published schema, a wire format, an API shape — is deliberately shared
  knowledge; hiding it behind a leaky wrapper only obscures the agreement.
  Publish it explicitly and version it instead.
- Performance-critical seams sometimes must expose representation (zero-copy
  paths, memory layout). Do it as a *declared* exception with the dependents
  named, not as a quiet leak.
- Stable, finished decisions need less ceremony: hiding pays in proportion
  to change probability, and wrapping the never-changing is
  [YAGNI](yagni.md).
- Over-hiding inside a small, single-owner codebase — private everything,
  accessors for every field — adds friction without protecting any decision
  anyone would change independently.
