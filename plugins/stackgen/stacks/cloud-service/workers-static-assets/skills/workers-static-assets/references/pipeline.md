# Pipeline — Workers Static Assets

Build → asset directory → `wrangler deploy`. Three steps, one of which is
not this component's.

## The release runs behind a mise task

The task is **`p:<project-id>:deploy`**, shipped by this pack as an
overlay in the project's own task group, so **the same command runs
locally and in CI**. That is what keeps the deploy target swappable: the
workflow calls the task, and the task is the only thing that knows a
Cloudflare account is on the other end. A workflow that shells out to
`wrangler` directly has welded the pipeline to the target.

**The workflow file is the repo's, not this pack's.** A pack states which
task CI must run and never writes the workflow — the charter fence in
`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md` — because a generated
pipeline nobody maintains is worse than none.

## What the deploy task does, and deliberately does not

- **It checks the credentials first.** `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` are verified present before wrangler is invoked,
  because wrangler's own failure for a missing token reads like a network
  or permissions problem and costs an afternoon the first time.
- **It does not build.** It runs `p:<project-id>:build` where that task
  exists and otherwise says what it is assuming. What produces the
  directory is the framework's business; owning it here would mean this
  component deciding how a site is compiled.
- **It pins no wrangler.** Wrangler is a development dependency in the
  project's language manifest, and a manifest is outside the config
  tier's fence. The task calls the manifest's copy through the package
  manager, so the version CI runs is the version the lockfile records — a
  `[tools] wrangler` entry in a mise fragment would be a second, unpinned
  copy that drifts from it silently.
- **`--dry-run` validates without publishing**, and is exempt from the
  credential check because it neither authenticates nor uploads. That
  exemption is the point of the flag: it lets a contributor without
  account access validate a config change.

## What the deploy must guarantee

vwf's delivery-pipeline contract states these as guarantees rather than as
a spelling, and this component satisfies them without redefining them:

- **Deliberate** — an explicit act naming one project and one environment,
  never a consequence of a branch push.
- **Branch-validated** — the commit being released is reachable from the
  branch that environment releases from.
- **Tested before release** — the project's tests have passed on that
  commit.
- **Staging is not a release** — promoting to a preview does not imply
  production.
- **One build uploaded**, not rebuilt per environment. See
  [artifact](artifact.md).

## What triggers it is not this component's decision

The trigger — a tag, a dispatch, an approval — belongs to the CI system
pinned on the project's `cicd` axis, behind
`${CLAUDE_PLUGIN_ROOT}/assets/contracts/release-trigger.md`.

## Pre-production

A preview is a **separate URL**, not a separate configuration of the same
one. Two shapes exist and the product picks one and records it:

1. **A second Worker name** — a wholly separate deployment with its own
   configuration and its own route. Simplest to reason about, and the one
   that survives someone deploying to the wrong place, because the two
   names are visibly different.
2. **A version uploaded rather than deployed.** Cloudflare gives each
   uploaded version its own preview URL without moving production
   traffic, and a version can be given a stable alias so the URL does not
   change per upload. Check the wrangler floor for aliasing at Context7
   rather than assuming; it is recent.

Whichever is picked, the acceptance suite is given that URL by name — the
same way any other environment value reaches it, catalogued in
`docs/blueprint/environment.md`.

## Rollback

**The rollback path is selecting a previous version, not rebuilding an
earlier commit.** A rebuild produces an artifact nobody tested, and for a
static site the inputs that make the two differ — a floating dependency,
a content source that moved on — are exactly the ones nobody controls.

Two things make that possible and both are easy to lose:

- **Enough previous versions retained** for the one you want to still be
  there. This is the direction the retention setting is usually got wrong
  in.
- **A cached HTML document is not rolled back.** A browser holding the
  entry document from the bad release keeps it until its `Cache-Control`
  expires, whatever the origin now serves. That is the second reason the
  entry HTML is not cached aggressively — see [artifact](artifact.md).
