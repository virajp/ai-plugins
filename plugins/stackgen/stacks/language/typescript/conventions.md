# TypeScript — conventions

The Node/TypeScript baseline. New code is TypeScript with `strict` on;
JavaScript files get the same standards minus the type-level rules and are
migration candidates, never an excuse to relax them.

**Errors are values at the boundary and exceptions in the middle.** One mapping
home turns internal failures into the product's coded responses — never
scattered `try`/`catch` that each invent their own shape.

**`async`/`await` throughout; never block the event loop.** CPU-bound work moves
off the main thread rather than being awaited around.

**Tests are Vitest**, colocated, with the shared config and v8 coverage.

**The `@/` path alias, no deep relative chains, and a clean→check→build
pipeline.** Barrels are for public surfaces only.

**Config is read once at the composition root** — names-not-values, catalogued
in `docs/blueprint/environment.md`, never `process.env` reads scattered through
the code.

**Telemetry is OTLP.** The product emits it and never imports a vendor SDK.

Full judgment: the `typescript` skill's references.
