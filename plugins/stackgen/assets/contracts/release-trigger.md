# The release trigger — the CI-system contract

**This is a kind contract, not a capability contract.** Its capability
neighbours in this directory each state what any provider of one capability
*category* must satisfy. This one states the mechanism behind one **kind** —
`ci-system` — which every CI component implements in its own syntax and none
gets to invent. It is written here for the same reason they are: it is
doctrine that belongs above the instance, and anything two CI systems would
both say belongs written once.

Components cite it. They do not restate it. What they add is their own
system's spelling of it.

## Where the line falls

vwf owns the **delivery-pipeline contract** — the environment vocabulary and
the five `pipeline/*` rules a deploy must satisfy. That contract states that a
deploy is deliberate, that it is validated against the branch its environment
releases from, and that it is tested before it ships. It deliberately states
**no mechanism**, because a mechanism is one CI system's business and vwf pins
none.

This file is that mechanism, as the recommended default. It is a
recommendation rather than a mandate: a product may express a deliberate
deploy some other way, provided whatever it chooses still satisfies vwf's
rules. But a product that has not decided gets this, because an undecided
release trigger is how a branch push ends up deploying to production.

## The recommended default: a version tag

A deploy is triggered by a **git tag**, shaped:

```text
<project>-<env>-v<semver>
```

`api-prod-v1.2.3`, `web-stage-v0.4.0`. Three segments, each load-bearing:

- **`<project>`** names the registry project being released, so one tag
  releases exactly one project. A **multi-repo member uses the repo name**,
  which is what keeps the shape identical across layouts — a pipeline written
  for a monorepo and one written for a single repo parse the same string.
- **`<env>`** is `stage` (deploys to `staging`) or `prod` (deploys to
  `production`). `development` has no token because it is never deployed.
- **`v<semver>`** is the version being released.

**Parse right-to-left.** Project names contain hyphens and environment tokens
do not, so splitting from the left mis-parses `payment-api-prod-v1.2.3` and
mis-parses it *silently* — it yields a project nobody has, and the run fails
somewhere later for a reason that reads as unrelated.

**The trigger filter is coarse; the pipeline re-validates.** Most CI systems
match tags by glob (`*-stage-v*`, `*-prod-v*`), and a glob cannot express the
full grammar. So the first thing the run does is match the whole shape and
fail on a malformed tag with the tag quoted in the error. Trusting the glob
means a typo deploys something.

## Branch validation

vwf's `pipeline/branch-validated` requires the pipeline to prove the tagged
commit is reachable from the branch that environment releases from. The
recommended default mapping is **`stage` → `develop`** and **`prod` →
`main`**; a product that designates other branches records them in
`conventions.md#pipeline`, and the pipeline reads that pair rather than
assuming this one.

The check itself is an ancestry test against the *remote* branch —
`git merge-base --is-ancestor <tag-commit> origin/<branch>` — which needs the
checkout to have real history rather than a shallow one. A shallow clone makes
this check pass or fail on how much history was fetched, which is the worst
available outcome: it is wrong intermittently.

**This is a real hole, not a theoretical one.** A tag can be pushed pointing at
any commit on any branch, and a mistyped `git push --tags` from the wrong
checkout is the ordinary way it happens.

## Release task naming

The pipeline **invokes the repo's task library**; it never inlines the deploy
commands. The recommended names:

| Layout     | Test                | Release                                  |
| ---------- | ------------------- | ---------------------------------------- |
| monorepo   | `<project>:test`    | `<project>:release:<environment>`        |
| multi-repo | `test`              | `release:<environment>`                  |

`<environment>` is the **canonical** vwf name — `staging`, `production` —
never the tag's short form. The tag's `stage`/`prod` tokens exist to keep tags
short; letting them leak into task names creates a second environment
vocabulary that drifts from vwf's.

**Confirm these tasks exist rather than assuming them.** Where the workspace's
package identifiers differ from the task prefixes, ask for the mapping — a
guessed task name fails at deploy time, which is the most expensive place to
discover it.

## One deploy path, split as little as the repo allows

Everything common to every project — parsing, branch validation, the test gate
— is written **once**. Only the deploy itself is factored per project.

Split further **only** when two projects differ in something the CI system
itself must express: a different federated-identity provider, a different
registry login, a different approval rule. Differences in *build or deploy
commands* are not a reason, because those already live in the per-project task.

The cost of a split is structural rather than cosmetic, and it is worth
measuring before taking it: on most systems the reusable-workflow reference is
a literal path that accepts no expression, so a second variant means a second
conditional job in the caller, and that condition list grows with every project
added. Detect the actual variation first; uniform projects want one path.

## Findings, not variants

- **A branch push that deploys.** The rule this contract exists for. It
  conflates *this code is good* with *this code should ship*.
- **A release path that trusts an earlier green run.** The commit that was
  validated is not necessarily the commit being released.
- **A publish that hard-fails on an already-published version.** Tags get
  re-pointed and runs get re-run; skip rather than fail, or the pipeline
  reports a correct state as a failure and people learn to ignore it.
- **A release workflow renamed casually.** Where a registry authorizes
  publishing by workflow filename, the rename breaks publishing with an error
  that reads as a credentials problem.

## What this contract does not cover

The gate sequence on ordinary pushes, credential handling, pinning and
caching, and where workflow files live are each the CI component's own topic —
they vary by system in ways no neutral statement improves. This contract is
the release trigger and nothing else.
