# Postgres — local stack

## The mechanism is fixed

**Docker-composed Postgres, behind a `wait-on` readiness gate.** This is vwf's
one non-negotiable harness mechanism, and the reason is the acceptance verifier:
it needs a deterministic ready signal before it runs anything. `sleep 5` is not
one — it is a guess that passes on a fast machine and fails in CI, which is the
worst kind of test failure because it looks like a real one.

The gate waits for the server to actually accept connections, not for the
container to exist. A container is up long before the database is ready.

## Pin the same major version as production

A local stack on a different major version is not a local stack; it is a
different database that usually behaves the same. The differences that matter
show up exactly where testing is thinnest — planner behaviour, newly reserved
words, changed defaults, extension availability.

Pin the major version explicitly and update it deliberately, as its own change,
so that a version upgrade is something the team does rather than something that
happens to them.

## Run migrations against it as a task

The local schema must be produced **the same way the deployed one is** — by
running the migration sequence, as a task, from empty. Not by restoring a dump,
and not by a hand-maintained schema file that drifts.

This is what makes migrations tested rather than merely written. A migration
that has only ever run against a hand-built local schema has not been exercised
against the sequence it will meet in production.

## Seed data is separate from schema

Seeds are a task of their own, run after migrations, and they are for local
development and E2E fixtures. They are never part of a migration: a migration
that inserts rows will insert them in every environment, including the one where
someone will later wonder where the test users came from.

## What the local stack is not

It is not a performance environment. A container on a laptop shares CPU and disk
with everything else and has no realistic data volume. Query plans that matter
are checked against production-shaped data, not against fifty seeded rows —
which is a reason to keep the blueprint's expensive queries identified rather
than discovered.
