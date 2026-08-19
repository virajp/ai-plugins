# Dependency Inversion (SOLID: D)

## Definition

Policy should not depend on mechanism: the code that owns a business
decision depends on an **abstraction it defines**, and the technical detail
(storage, transport, vendor SDK) implements that abstraction. The "inversion"
is of ownership — the boundary contract belongs to the high-level side, so
the detail can change without the policy noticing.

The [engineering baseline](../engineering-baseline.md) enforces the
coarse form: business/technical separation, and backing services as attached
resources reached only through injected config. This entry is the judgment
for where to put the seam and how abstract to make it.

## Smells

- Domain logic importing a vendor SDK, a driver, or a transport library
  directly.
- The abstraction shaped like the detail it wraps — method names, error
  types, and pagination style mirroring one particular vendor — so
  "swapping" the implementation means rewriting every caller anyway.
- Construction of concrete dependencies buried deep in the call graph
  instead of at the composition root.
- Tests for business rules needing a live backing service, network, or
  clock — the un-invertible dependency is measured by what the tests
  cannot avoid.
- Config, credentials, or endpoints hardcoded next to the logic that uses
  them.

## How a reviewer verifies it

- Read the import graph of the diff's business modules: an import pointing
  at a concrete technical detail (SDK, driver, framework internals) is the
  finding. Direction is checkable mechanically; check it.
- Ask **who owns the interface**: defined beside its consumer in the
  policy's terms, or exported by the implementation? The latter is
  dependency *hiding*, not inversion.
- Check the abstraction leaks: vendor-specific errors, types, or semantics
  escaping through the seam mean callers depend on the detail anyway.
- Verify the business rules in the diff are testable with an in-memory
  substitute. If the test suite spins up infrastructure to check a domain
  decision, the seam is missing or misplaced.

## Application patterns

- Define ports in the domain's vocabulary (what the policy needs: "record a
  reading", "notify the operator"), implement adapters per detail, and wire
  them once at the composition root.
- Inject the dependency's *capability*, sized per
  [interface segregation](interface-segregation.md) — and prefer injecting
  values (the config, the time) over injecting providers when the callee
  needs no indirection.
- Treat time, randomness, and environment as dependencies too — the tests
  will thank you before the architecture does.
- Let the seam earn abstraction gradually: one implementation → a thin
  adapter; a second implementation or a hard-to-test detail → a proper
  port.

## When not to apply it

- **Not every dependency deserves a seam.** The language's standard library,
  stable utility code, and pure data structures are cheaper used directly;
  inverting them is ceremony. Invert what is volatile, vendor-shaped, or
  slow/impure under test.
- A wrapper that re-exposes the detail one-to-one adds a layer without
  inverting anything — if the product is genuinely committed to one
  mechanism, a thin direct use with the seam *placed but shallow* can be the
  honest choice.
- Frameworks that own the application's entry points are a dependency you
  live inside, not one you invert; contain their reach at the boundary
  rather than pretending the core is framework-free while every type leaks.
- At a system's smallest scale, wiring indirection can cost more than the
  coupling it prevents — apply the [minimalism ladder](../minimalism.md)
  before adding the port/adapter pair.
