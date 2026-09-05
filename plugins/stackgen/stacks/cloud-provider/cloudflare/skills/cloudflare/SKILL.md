---
name: cloudflare
version: 0.1.0
category: development
description: >-
  Cloudflare as this product's private plane and as its static host — the
  account and role model behind least-privilege grants, seat-shaped billing
  and what frees a seat, what does and does not exist locally, and the
  networking rule that decides whether the private plane is real or
  decorative. Provider-wide judgment every Cloudflare service component —
  Zero Trust Access and Workers Static Assets — cites rather than restates.
license: MIT
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloudflare

The provider-wide half of this stack: what holds across every Cloudflare
service, written once. This skill carries the judgment; the dashboard,
the API and `cloudflared`'s current flags belong to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Sizing, or explaining, a bill | [Cost doctrine](references/cost-doctrine.md) |
| Granting access to the account, or to automation | [Identity & IAM](references/identity-and-iam.md) |
| Running or testing the product on a laptop | [Local development map](references/local-development-map.md) |
| Making a project unreachable except through the proxy | [Networking & private plane](references/networking-and-private-plane.md) |

**Two rules that do not wait for a reference.** Cloudflare, at the scope
this stack offers, **hosts** exactly one kind of thing — a built directory
of files, on Workers Static Assets — and for anything with a running
process it **fronts** what runs elsewhere, where "elsewhere" is that
project's hosting pin's business and never this one's. And an origin that
answers a direct request is a private plane in name only; that failure is
invisible from the outside and is the subject of the networking reference.

## What this stack does not cover

Coverage is parked at **Zero Trust Access** and **Workers Static Assets**.
A **Worker script fronting static assets** — server-side rendering on
Workers — along with Pages, R2, D1, KV, Durable Objects, Queues, Images
and Stream, is planned under its own effort and is **not** part of this
stack. If the product needs one of them, that is a gap to name — not a gap
to fill from general Cloudflare knowledge, because doctrine nobody wrote
is doctrine nobody reviewed.
