# ESLint — conventions

The **correctness** gate for TypeScript and JavaScript. Topic 10 of the language
bundle, deliberately not a repo gate: a linter meaningful for exactly one
toolchain belongs to that toolchain's bundle, or a polyglot repo acquires one
per language.

**Flat config only.**

**Zero formatting rules.** The formatter owns layout — a rule a formatter can
satisfy must never be able to fail a lint run. See the `dprint` repo-gate pack
for the other half of that split.

**Overrides are scoped by `files` glob**, never disabled globally. A rule turned
off everywhere because one file could not satisfy it is a rule the repo no
longer has.

**One lint command, wired through the task library**, so local and CI run the
identical gate.

Full judgment: the `eslint` skill.
