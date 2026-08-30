# Doppler — cost shape

No dollar figures: they age badly and are wrong per plan anyway. What matters
is the **shape** of the bill and which decisions move it.

## The billing model is per seat

**Cost scales with people, not with secrets or with reads.** That is unusual
among backing services and it inverts the usual instinct — adding another
credential is free, adding another person is not.

The consequence is the one trap that matters, and it is a security failure
wearing a cost disguise: **a shared login to avoid a seat.** It defeats clause 3
entirely — offboarding one person means rotating the shared credential and
telling everyone else, which is exactly the ritual Doppler was picked to remove.
If a seat is not worth buying for someone, they should not have the secrets.

Related and equally common: **a service token used as a person's credential**,
so that a contractor can be given access without a seat. Now an
environment-scoped, long-lived token is on a laptop, revoking it breaks whatever
else uses it, and the audit trail attributes every read to the same anonymous
principal.

## What sits behind the tier boundary

The properties that make this pick defensible are generally **not all on the
free tier**, and it is better to find that out while choosing than during an
incident:

- **Audit-log depth and retention.** The trail exists; how far back it goes and
  how much detail it carries is a plan question. If the reason for picking a
  hosted platform is auditability, this is the line item to check first.
- **Fine-grained access control.** Restricting who can read `production` rather
  than treating org membership as one permission is generally the paid shape.
  Without it, clause 2's "read-only where the pipeline only reads" is aspiration
  rather than configuration.
- **Team and environment counts**, which cap how far the model above extends.

## What is free and stays free

**Reads.** The injector runs once per task, so the read volume is a function of
how often someone starts a process — a rounding error under any model. There is
no incentive here to cache secrets or to reduce reads, and doing so would trade
a nonexistent cost for a real staleness problem.

**Secret count.** Adding a variable costs nothing, which is why the discipline
that matters is `environment.md`'s catalog rather than restraint — nothing bills
you for the credential nobody removed after the integration it served was
deleted.

## The cost this pack's scope avoids

Deployed environments do not run through Doppler
([two injectors](two-injectors.md)), so the bill covers the development team and
stops there. It does not grow with traffic, with the number of running services,
or with the number of deployed environments — which is a different curve from
what a manager on the runtime path would have.
