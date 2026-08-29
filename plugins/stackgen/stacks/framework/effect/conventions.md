# Effect-TS — conventions

Effect layers **on top of** the TypeScript baseline rather than replacing it:
plain TypeScript gets the baseline alone, an Effect project gets both.

**TypeScript with `strict` is a hard requirement.** Effect never applies to
JavaScript.

**Failures are in the type.** This is the reason to adopt it — the error channel
makes the failure modes of a call visible to the compiler, which is exactly what
plain TypeScript cannot do (see the language pack's error semantics reference,
which describes working without this).

**Dependencies are in the type too**, provided at the composition root, which is
the same information-hiding rule the baseline states with a stronger enforcement
mechanism.

**The test runner is unchanged — only the assertions differ.** Where code under
test returns an `Effect`, read this skill's testing reference alongside the
language pack's.

Full judgment: the `effect` skill's references.
