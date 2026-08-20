# YAGNI — You Aren't Gonna Need It

## Definition

Build a capability only when a **current, stated requirement** needs it —
never because a future one might. The cost of speculative code is not just the
writing: it is carried forever (read, tested, migrated, secured) and it is
usually wrong, because the future requirement, when it arrives, has different
details than the guess.

This is rung 1 of the [minimalism ladder](../minimalism.md), which is the
enforced home of this principle in vwf — the ladder decides *what gets built*,
and its reviewers already flag speculative capability. This entry adds the
judgment for the cases the ladder's one line leaves open.

## Smells

- Fields, endpoints, parameters, or states no current flow reads or writes.
- "Extensibility" seams — plugin registries, hook points, strategy slots —
  with a single registrant.
- A generalized version of the needed thing: the requirement said one, the
  code handles N.
- Feature flags guarding features nobody asked to toggle.
- Dead configuration: options that have never left their default.
- Commented-out or `TODO: later` scaffolding checked in "so it's there".

## How a reviewer verifies it

- For each new public surface (field, endpoint, option, type parameter), ask
  **which requirement, plan step, or test needs it now**. No answer → finding.
- Diff the built shape against the asked-for shape: the requirement's
  cardinality (one currency, one locale, one tenant) is the shape to build;
  generalization beyond it needs a stated requirement.
- Check the tests: speculative capability is usually either untested or tested
  only by tests written to justify it — both are the same smell.
- Distinguish speculation from **cheap reversibility**: leaving a decision
  open by *not* hardcoding it is fine; building the second option is not.

## Application patterns

- Build the current requirement's exact shape; when the second case arrives,
  generalize **then**, with both cases in front of you — two real cases
  produce a better abstraction than one real and one imagined.
- Prefer decisions that are cheap to change over capabilities that anticipate
  the change: a well-placed boundary (see
  [information hiding](information-hiding.md)) makes the future edit small
  without writing any of it today.
- When a stakeholder insists the future need is certain, record it as a
  requirement and schedule it — then it is no longer speculation and YAGNI
  does not apply.

## When not to apply it

- **Never on the safety guardrails** — validation, data-loss handling,
  security, accessibility are needed *now* by definition, even when no
  requirement spells them out. The minimalism protocol's guardrail list wins.
- **Irreversible or contract-shaped decisions** deserve forward thought:
  a published API (additive-only evolution per the
  [rest-api-design skill](../../skills/rest-api-design/SKILL.md)), a stored
  schema, an event contract. Choosing a shape that can evolve is not
  speculation — shipping the evolved shape early is.
- Operational readiness is a present requirement: graceful shutdown, retry
  discipline, structured logs are baseline rules
  (see the [engineering baseline](../engineering-baseline.md)), not futures to
  defer.
- In a library or platform whose *whole product* is the extension surface, the
  extension points are the requirement — judge them against their consumers,
  not against YAGNI.
