# tsconfig — conventions

**`strict` is on, everywhere, and is not negotiated per project.** The
type-level rules in the TypeScript baseline assume it; without it they are
suggestions.

**One shared base config, extended per project.** A per-project config that
restates the base has already drifted from it.

**The `@/` path alias** replaces deep relative chains, and the build resolves it
the same way the editor does.

**A separate emit variant for builds**, so type checking and emitting are
distinct operations — `tsc --noEmit` is the checker, and nothing about a check
should depend on output settings.

Full judgment: the `tsconfig` skill.
