# pre-commit — the local gate, and gate wiring

## The gate

**Hooks call the repo's task library; they never inline a command.** This is the
parity guarantee, and it is the reason this component owns the wiring topic. A
hook that inlines its command is a second definition of that gate, and the two
drift the first time one is edited — after which local and CI disagree and the
gate is worse than absent, because it is trusted.

**`files:` scopes every hook** so it fires only for what it validates. An
unscoped hook runs the formatter over a commit that touched one YAML file, and a
gate people wait on is a gate people bypass.

**Revs are pinned and updated deliberately.** An unpinned rev means the gate's
behaviour changes without a commit, and the change lands on whoever pulls next.

**Never bypass a red gate.** The gate found something or it is broken; both need
answering, and neither is answered by skipping it.

## Gate wiring & CI parity

**Every gate is reachable as exactly one task name, and CI runs those same task
names.** Nothing else keeps the two in step: a gate invoked one way locally and
another way in CI is two gates that happen to share a name.

**Cheap gates run before expensive ones.** Formatting and secret scanning fail
in under a second; a vulnerability scan does not. Ordering by cost means the
common failure is reported immediately rather than after the slow gate.

**The exclusion set is stated once**, not restated per gate. Generated trees,
vendored code and lockfiles are excluded for the same reason everywhere, and
per-gate copies drift until one gate is scanning what the others skip.

**A repo with no hook runner records this topic `n/a`** and loses the parity
guarantee with it. That is a real loss, not a formality — without it, nothing
makes local and CI run the same command.
