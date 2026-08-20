# Open–Closed (SOLID: O)

## Definition

At a **proven variation point**, adding the next variant should not require
editing the code that dispatches over the existing ones: the module is open
to extension, closed to modification. The mechanism is any form of
polymorphism the stack offers — an interface, a function value, a lookup
table, a data-driven registry.

The modern reading is deliberately narrower than the classic one: it applies
where variation is *demonstrated* (a second variant exists or is a stated
requirement), not everywhere. Pre-building extension points is
[YAGNI](yagni.md)'s territory.

## Smells

- A branch ladder (`if`/`switch` over a type tag) that every new variant
  grows — especially the *same* ladder repeated in several places, which is
  also a [DRY](dry.md) finding.
- Adding variant N requiring edits to N files that each enumerate the
  variants.
- Core logic modified — and re-tested, and re-risked — every time a
  peripheral option is added.
- The inverse smell: an extension mechanism (plugin registry, abstract base)
  with one registrant, built for variation that never came.

## How a reviewer verifies it

- For a diff that **adds a variant**: count the files edited that merely
  enumerate variants. More than the one place registering the new variant →
  the variation point is not closed; suggest consolidating the dispatch.
- For a diff that **adds an abstraction**: demand the second variant, present
  or in a stated requirement. Absent both, flag the speculative seam.
- Check the dispatch has a single home: one table, one registry, one match
  site — however many variants it routes to.
- Verify new variants honor the contract the dispatch assumes — a variant
  that only works because the caller special-cases it breaks
  [Liskov substitution](liskov-substitution.md), and the special case
  reopens the closed module.

## Application patterns

- Consolidate variant knowledge first (one dispatch site), then, at the
  second or third variant, invert it: variants register themselves or are
  listed as data, and the core iterates.
- Prefer the lightest mechanism the stack offers — a map from tag to
  function often beats a class hierarchy; declarative data beats both when
  the variants differ only in values.
- Keep the closed part genuinely closed by contract: what the core guarantees
  to variants and requires of them is written down (see
  [design by contract](design-by-contract.md)), so extensions compose
  without reading the core's source.
- At published boundaries, this principle becomes additive-only evolution —
  the API-surface version detailed in the
  [rest-api-design skill](../../skills/rest-api-design/SKILL.md).

## When not to apply it

- **Closed sets stay closed honestly.** Dispatch over a set that is complete
  by domain definition is best written as an exhaustive branch the compiler
  or linter checks — an extension mechanism there hides missing-case bugs.
- Editing code is not a failure. For a young module, modification is cheaper
  and clearer than abstraction; reach for closure when the *rate* of variant
  addition justifies the indirection.
- Don't close a module against changes to its **own responsibility** —
  open–closed protects against variant churn, not against fixing or evolving
  the core rule itself.
- An extension surface is a public contract you must then keep stable; where
  you don't want that obligation, staying "open to modification" is the
  lighter promise.
