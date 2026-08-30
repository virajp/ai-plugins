# Container image — config & secrets at run time

## Nothing environment-specific is inside the image

Configuration reaches the running container as **environment variables from
the host**, and the image contains none of it. This is not tidiness: it is
the precondition for promoting one digest between environments. An image
that knows which environment it is cannot be the same image in two of them.

The same applies to anything that behaves like configuration — an endpoint,
a feature flag default, a bucket name, a log level.

## Secrets come from the host's own mechanism

A secret is injected at run time by whatever the host provides. It is never
baked into a layer, never a build argument, and never a file committed
beside the build definition. The neutral clauses are
`assets/contracts/secrets.md`; this is the container half of them.

Build arguments deserve the explicit warning: they are visible in the image
metadata, so a secret passed as one is a published secret even if no layer
copies it.

## Names, never values

What the blueprint records is the **catalogue of variable and secret
names** each project needs, aligned with `environment.md`. Values live in
the host and in the developer's own secret injection, and nothing in this
repo holds them.

That catalogue is what makes a missing variable a deploy-time answer rather
than a run-time surprise: the set is known, so the host's configuration can
be checked against it.

## Fail closed on a missing value

Read configuration once at start-up and refuse to start when something
required is absent or unparseable. A service that starts with a missing
value and fails on the first request that needs it has turned a deploy
failure into an incident, and it will have passed its readiness probe on the
way.
