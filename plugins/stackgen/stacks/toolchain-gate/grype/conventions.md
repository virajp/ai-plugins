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

## What this pack writes

`.config/grype.yaml` — the threshold and the (empty) ignore list, with the bar
an ignore entry has to clear written above it.

The fence in `output-tree.md` was opened for gate config files on 2026-09-05;
`package.json` and CI workflows remain outside it.

**The threshold ships at `medium`**, and `code:sec` runs
`grype dir:. --config .config/grype.yaml --fail-on medium`. The flag at the call
site and the key in the file say the same thing on purpose — the call site is
where somebody reads the gate, the file is where the decision and its reasoning
live. Change them together.

**There is no pre-commit hook for this one.** gitleaks ships hook definitions;
grype does not, so it reaches the commit gate only through `code:sec`. That is
worth knowing before assuming the local gate covers it: remove the task and
nothing else runs the scanner.

**SBOM-first is the recommended CI shape, and this pack does not write it.**
Generating an SBOM from the built artifact and scanning that, rather than
re-scanning the source tree a second time, is what catches the base image's
system packages — the larger share of a real image's findings and the part no
lockfile mentions. The workflow that does it is outside this pack's fence; the
recommendation is here so the gap is deliberate rather than unnoticed.
