# Postgres — access & connection shape

## Connection pooling is the design decision, not a tuning knob

This is the failure that takes products down, and it is entirely predictable.

A serverless or autoscaling runtime scales to many instances, each holding its
own connection pool, against a server with a **hard** connection limit. Traffic
rises, instances multiply, connections exhaust — and then every request fails at
once, including the ones that would have succeeded. The failure is not gradual
and it does not shed load gracefully.

Decide three things up front, and record them in the blueprint:

1. **A small per-instance pool**, sized for the concurrency one instance
   actually handles — not for the traffic the service receives.
2. **An instance ceiling** on the runtime, sized against the connection limit
   rather than against traffic. The ceiling is what makes the arithmetic hold:
   `instances × pool ≤ limit`, with headroom for migrations and operators.
3. **Whether a pooler sits in front**, and in which mode. This is a contract
   decision, not an afterthought: transaction-mode pooling breaks session state,
   prepared statements and `LISTEN`/`NOTIFY`. Choosing it constrains what the
   application layer may use, so it belongs in the blueprint rather than in
   someone's deployment config.

## Access is services-only

Every read and write goes through the product's own services — the datastore
contract's access rule, and here also a hard limit rather than a policy. There
is no client-direct path to grant, which means there is also no row-level
authorization surface to design; authorization lives in the services layer,
where the product's own rules already are.

## Credentials

**Env-injected, names-not-values, catalogued in
`docs/blueprint/environment.md`.** Nothing is read from a committed file.

**Prefer identity-based database authentication wherever the host offers it** —
the best password is the one that does not exist. Where a password is
unavoidable, it is rotatable without a redeploy, which means the application
reads it at connection time rather than baking it into an image.

**Local-stack credentials are throwaway** and obviously so. A local password
that looks like it might be real is one copy-paste from becoming real.

## Least privilege

The application's role is not the migration role. The application needs DML on
its own tables; it does not need to create or drop them, and a role that can
`DROP TABLE` is a role that can lose the product's data to one bad code path.
Migrations run as a role that has those rights, from the deploy step that owns
them.
