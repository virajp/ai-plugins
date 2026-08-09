# The LSP Gate (Setup step 1)

Read this at Setup step 1 **only when `doctor` reports a missing LSP server**.
A clean preflight, or one whose only findings are non-LSP, never needs it — and
a `blocking` finding is a hard halt handled in `SKILL.md`, not here.

If a language's LSP server is missing, ask and **wait**:

> "No LSP server detected for `<language>`. Without it, type errors may not
> surface until runtime. Continue without LSP?"

- **Yes** → proceed. **No** → halt; install via `/plugin` (Discover) then
  retry. On a **resumed** run, don't re-ask — note it as a gap (degraded
  type-safety) and continue.
- A language doctor reports as **unavailable** (no LSP ships in this
  marketplace) or **unknown** is not a gate — there is nothing to install.
  Note it as a gap and proceed.

Everything else doctor reports is noted and carried into the run's gap list, not
blocked on.
