# Format Check (preflight)

A cheap drift check the vwf workflow commands run before consuming the
blueprint. Because vwf is installed **once at user level**, an upgrade does not
re-run per repo — this check is what prompts each repo to migrate, the next time
you use the workflow there.

Steps:

1. Read the **shipped** format: the integer in
   `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`.
2. Read the **repo** format: `blueprint_format` in `docs/blueprint/.vwf.yml`.
3. Compare:
   - **Stamp present and equal to the shipped value** → silent; proceed.
   - **Stamp behind, OR missing while a `docs/blueprint/` (or legacy
     `docs/specs/`) tree exists** → tell the user, then offer `/vwf:init`:
     > "This repo is on blueprint format `<N>`; vwf now ships `<M>`. Run
     > `/vwf:init` to migrate to the latest format."
   - **No blueprint tree at all** → not a drift case; the command's own
     bootstrap halt handles it.
4. **Halt only if blocking.** Proceed with the requested operation when its
   required docs are present; hard-halt only when the operation needs an
   artifact the old format lacks (e.g. a `design-system.md` or section the new
   format introduced). Never auto-migrate — `/vwf:init` does that behind its own
   consent gate.

Skip silently if `.vwf.yml` or the format constant cannot be read.
