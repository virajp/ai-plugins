# Format Check (preflight)

A cheap drift check the vwf workflow commands run before consuming the
blueprint. Because vwf is installed **once at user level**, an upgrade does not
re-run per repo — this check is what prompts each repo to migrate, the next time
you use the workflow there.

Steps:

1. Read the **shipped** format: the integer in
   `%%AI_PLUGINS_ROOT%%/assets/blueprint-format`.
2. Read the **repo** format: `blueprint_format` in `.config/vwf.yaml` (the vwf
   config). When that file is absent, fall back to the **legacy stamp**
   `docs/blueprint/.vwf.yml` — finding the stamp only there is itself
   pre-format-6 drift.
3. Compare:
   - **Config present and equal to the shipped value** → silent; proceed. This
     holds even when the blueprint tree is thin or absent: a stamped config with
     no `registry.yaml` yet is a repo **early in the chain**, not a repo that
     drifted, and setup has nothing left to do for it. Never nudge there — the
     command's own foundation gate names the doc it actually needs.
   - **Stamp behind, only at the legacy location, OR missing while a
     `docs/blueprint/` (or legacy `docs/specs/`) tree exists** → tell the user,
     then offer `/setup`:
     > "This repo is on blueprint format `<N>`; vwf now ships `<M>`. Run
     > `/setup` to reconcile the tree to the current format."
   - **No config and no blueprint tree at all** → not a drift case; the
     command's own bootstrap halt handles it.
4. **Halt only if blocking.** Proceed with the requested operation when its
   required docs are present; hard-halt only when the operation needs an
   artifact the old format lacks (e.g. a `design-system.md` or section the new
   format introduced). Never auto-migrate — `/setup` does that behind its
   own consent gate.

Skip silently if neither config/stamp nor the format constant can be read.
