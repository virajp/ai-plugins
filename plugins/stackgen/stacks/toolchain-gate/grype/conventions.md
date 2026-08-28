# grype — dependency vulnerability scanning

**Two scans, at two moments, catching different things.** The source tree is
scanned on every commit and sees what the manifests and lockfile declare. The
**built artifact** is scanned before release and sees what actually shipped —
the base image's system packages, anything a build step pulled in, everything
the lockfile never mentioned. A repo that only scans source is unguarded
against most of what runs in production.

**Fail on a severity threshold, chosen deliberately.** The default is a
position, not an absence of one. Pick the threshold the project can actually
hold, and write down why — a gate tuned to fail on everything gets bypassed,
and a gate tuned to fail on nothing is decoration.

**Every ignore carries a reason and an expiry.** A vulnerability ignored because
no fix exists yet is a legitimate, temporary state. The same ignore two years
later is a permanent silence nobody re-reads, covering a fix that shipped long
ago. The expiry is what turns the ignore list back into a queue.

**An ignore is scoped to the finding, never to the package.** Ignoring the
package means the next, unrelated advisory against it arrives silently.

**Wired as one task name**, and CI runs that same task. See the hook-runner
component for the parity rule this depends on.
