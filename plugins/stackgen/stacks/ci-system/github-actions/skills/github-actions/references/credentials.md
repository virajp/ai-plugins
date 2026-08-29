# GitHub Actions — credentials in CI

## Federated identity over stored tokens

**Where the target supports OIDC federation, use it.** The workflow exchanges a
short-lived, workflow-scoped identity token for access at the moment it needs
it. Nothing long-lived is stored anywhere.

A stored long-lived token is the finding this topic exists to prevent, and its
properties are all bad: it does not expire, so a leak is permanent until
somebody notices; it is copied into every environment that needs it; and it
usually carries more access than the one job required, because scoping it
tightly was extra work at creation time.

## Least privilege, per workflow

Declare the pipeline token's permissions **explicitly and minimally** at the
workflow level rather than inheriting a default. Most jobs need only to read the
repository. A job that needs to write — pushing a tag, opening a pull request,
dispatching another workflow — gets exactly that one addition, in that one job.

The default permission set is chosen for convenience across all repositories,
which means it is wrong in the safe direction for almost every specific job.

## What must never reach a log

Anything the workflow received as a secret, and anything derived from it.

The masking the platform applies is a backstop, not a control: it masks values
it knows, in the exact form it knows them. A secret that has been
base64-encoded, JSON-embedded, URL-encoded or split across a diagnostic line is
no longer that string and prints in full.

So the discipline is upstream — do not echo, do not run tools in debug mode
against authenticated endpoints, and treat a failing authenticated command's
output as sensitive rather than as debugging material.

## Untrusted input in a trusted context

A workflow triggered by a pull request from a fork runs with a lower-privileged
token, by design. The dangerous move is a trigger that grants a fork's code
access to the repository's real secrets — and the branch, title and body of a
pull request are attacker-controlled strings that must never be interpolated
into a shell command.

The safe shape: pass untrusted values through the environment rather than
interpolating them into a script body, and keep any privileged step out of a
workflow that runs fork code.

## Environments as an approval gate

Where a deployment target should require a human, an environment protection rule
holds the credential and the approval together, so the secret is unavailable
until the approval exists. That is stronger than a conditional step, because the
conditional is code that can be edited in the same pull request.
