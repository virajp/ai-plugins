# TypeScript — config & env

The contract is vwf's: **names, not values**, catalogued in
`docs/blueprint/environment.md`. This is how TypeScript satisfies it.

## Read the environment once, at the composition root

**Exactly one module reads `process.env`**, at startup, and everything else
receives what it needs. Scattered `process.env.FOO` reads are the anti-pattern
this rule exists to prevent, and the reasons compound:

- A missing variable is discovered **when that line first runs**, which may be
  in a rare branch, in production, at 3am — rather than at boot.
- Nothing enumerates what the service actually needs, so
  `environment.md` drifts and nobody can tell.
- The value's type is `string | undefined` at every site, so every site invents
  its own coercion and default.

## Validate and coerce at that one place, then fail fast

Parse the environment into a typed configuration object at startup, and **exit
on invalid or missing values**. A service that boots with an absent database URL
and fails on first request has converted a deterministic startup failure into a
runtime one.

The rest of the code depends on a typed object with real types — numbers as
numbers, booleans parsed from strings deliberately, enums narrowed to their
closed set.

## Defaults are for development only, and never for secrets

A default connection string for local work is convenient. A default **secret**
is a credential in the source tree, and it is worse than an obvious one because
it works — so nobody notices it was never configured.

Required-in-production values have no default. They are absent, and absence
fails the boot.

## Never `import` config into a module's top level for branching

A module that reads config at import time to decide what to export is
untestable and order-dependent. Pass configuration in; let the composition root
wire it. This is the same information-hiding rule the principles catalog states,
applied to the one dependency every module is tempted to reach for globally.

## Secrets are injected, never committed

No `.env` file with real values in version control — and the secret scanner is
the backstop, not the control. Local development uses a secret injector that
puts values in the process environment at run time; production uses the
platform's own mechanism.

**What goes in `environment.md` is the name, what it is for, and which projects
need it.** Never the value, not even a redacted-looking one.

## Distinguish configuration from secrets

They have different handling: configuration can be logged, committed as
defaults, and diffed between environments; a secret can do none of those.
Keeping them in one undifferentiated bag is how a connection string with an
embedded password ends up in a debug log.
