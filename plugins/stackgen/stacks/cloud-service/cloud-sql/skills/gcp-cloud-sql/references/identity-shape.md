# Identity shape — Cloud SQL

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference. This file states only what
this service needs, and the one decision that removes a credential entirely.

## There should be no database password

The connector — the provider's IAM-authenticating client library, or the auth
proxy sidecar — authenticates the **workload's own identity** to the instance
and issues a short-lived token. So the connection string carries no password,
nothing is stored in a secret manager, and there is no credential to rotate or
leak.

This is the single highest-value decision on this service. Take it at the start:
retrofitting it means changing every connection path at once, whereas taking it
first costs nothing.

Two properties worth knowing about the connector beyond the credential: it
handles the TLS handshake and the instance's address itself, so the instance
needs no public address to be reachable, and access becomes a **grant** — which
means it is revocable centrally, and it shows up in audit logs as an identity
rather than as "someone who had the password".

## The grants

The service account needs the **client** role, which permits connecting, plus a
database-level grant for what it may actually do. It does **not** need the admin
role — that permits deleting instances, and the naming is the trap the
provider's IAM reference documents.

Database-level privileges are a separate system from cloud IAM and are granted
inside the database: the application's role gets data-plane privileges on the
schema it uses, and nothing else. Migrations run as a **different** identity with
DDL rights, so the running application cannot alter the schema it depends on.

## Network position

The instance should have **no public address**. With the connector, nothing
needs one; with a private address plus the private-service path, there is
nothing to allowlist and nothing to scan. Adding a private path later does not
remove a public one — that is a separate act, and an easily forgotten one. The
mechanisms are the provider's: see the `gcp` skill's networking reference.

## Reviewing this instance

1. Does a **database password** exist anywhere?
2. Does the instance have a **public address**?
3. Does the application's identity hold the **admin** role rather than the
   client role?
4. Can the **running application** alter its own schema?
