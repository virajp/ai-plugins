# Backlog

Ideas agreed as worth doing, not yet planned or scheduled. One heading per item.
Promote an item to `docs/plans/` when it is picked up; delete it here when it
lands or is dropped, with the reason.

*Nothing queued.*

<!--
Landed 2026-08-30: "Release the plugins from git tags, not `main`". Solved by
pinning each plugin's marketplace `source` to a per-plugin `<name>-v<version>`
tag via `git-subdir`, rather than pinning the marketplace registration itself.
That kept `claude plugin marketplace update` working unchanged — the marketplace
still tracks `main`, so an update re-reads the refs — and made releases
per-plugin instead of repo-wide, which pinning the registration could not have
done. The installer's tags moved to the contracted `installer-v*` spelling in
the same change.
-->
