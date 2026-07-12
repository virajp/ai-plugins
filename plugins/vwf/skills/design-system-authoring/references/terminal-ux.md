# Terminal UX

The design system's contract for **terminal surfaces** — required when any
registry project declares platform `cli` in `.config/vwf.yaml`
(`projects.<name>.platforms`). A CLI is a UI: its output, colors, and error
behavior deserve the same product-wide consistency as screens. No canvas
rendering applies — this section is a text contract, enforced by the execute
code reviewer (not the ux reviewer).

Pin (each has more than one reasonable answer):

- **Output formatting** — human output shape (tables/lists), a machine mode
  (`--json`/`--porcelain`) and when it's required, quiet/verbose levels, what
  goes to stdout vs stderr.
- **Color semantics** — which roles get color (success/warn/error/emphasis), the
  mapping to the product's semantic tokens by *role name* (not hex — terminals
  map roles to the user's palette), and the no-color rule (`NO_COLOR`, non-TTY
  auto-detect).
- **Progress conventions** — spinner vs progress bar vs silent-until-done; what
  long-running output looks like when piped/non-TTY.
- **Errors & exit codes** — the error message shape (what happened, why, what to
  do), exit-code conventions, when to print usage.
- **Help & naming** — help text style, verb-noun vs noun-verb command naming,
  flag conventions (long/short forms, negation).

Out (realization): the argument-parsing library, the rendering/TUI framework,
shell-completion mechanics — that is `plan`.
