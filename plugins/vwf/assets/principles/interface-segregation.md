# Interface Segregation (SOLID: I)

## Definition

No consumer should be forced to depend on capabilities it does not use.
Interfaces are sized to the **consumer's need**, not the provider's
inventory: a component that only reads should depend on a reader interface,
even if the object behind it can also write, delete, and administrate.

Small interfaces are what make the other principles cheap:
[substitutability](liskov-substitution.md) is easy to honor when the promise
is narrow, and [dependency inversion](dependency-inversion.md) works best
when the inverted dependency is exactly one capability wide.

## Smells

- Fat interfaces — a dozen methods where every consumer uses two or three,
  each a different two or three.
- Implementations stubbing methods ("not supported", empty bodies) to
  satisfy an interface they only partially are.
- Mocks in tests stubbing many members to exercise one — the test is
  measuring the interface's width for you.
- A change to one capability recompiling, re-testing, or re-releasing
  consumers that never touch it.
- Parameters typed as the whole world (the full client object, the entire
  config, a god context) where the function reads one field.

## How a reviewer verifies it

- For each consumer in the diff, compare the members it **uses** against the
  members it **depends on**. A wide gap is the finding; the used subset is
  the interface that wants extracting.
- Look at the test doubles: counting the stubbed-but-unverified members of a
  mock is the cheapest width measurement available.
- When an interface gains a member, check every existing implementation —
  each one forced to stub it is a vote that the member belongs on a
  different, narrower interface.
- For function signatures, check parameter width the same way: passing a
  whole object to read one field couples the function to everything else
  that object drags in.

## Application patterns

- Define interfaces **where they are consumed**, named for the role the
  consumer needs (a reader, a notifier, a clock) — the provider implements
  as many small roles as it genuinely is.
- Compose wide from narrow when someone truly needs the union, rather than
  splitting narrow out of wide after the fact.
- Accept the narrowest type that serves the function; pass values rather
  than providers of values where the callee doesn't need the indirection.
- At API boundaries, the same instinct shapes resources and scopes —
  consumer-sized surfaces, per the
  [rest-api-design skill](../../skills/rest-api-design/SKILL.md), and
  permission scopes sized per [least privilege](least-privilege.md).

## When not to apply it

- **Cohesive contracts should not be shattered.** An interface whose members
  are one conceptual protocol (open/read/close) belongs together even if
  some consumer only reads — segregation targets *unrelated* capabilities
  bundled by convenience, not coherent ones.
- A proliferation of single-method interfaces used exactly once each adds
  naming and navigation cost with no decoupling gain; extract a role when a
  consumer's narrower need actually exists.
- Inside a small, single-team module, the full concrete type is often fine —
  the principle earns its keep at boundaries where independent change and
  independent testing matter.
- Don't create a narrow interface merely to make mocking easier when a real
  value or in-memory implementation would test better.
