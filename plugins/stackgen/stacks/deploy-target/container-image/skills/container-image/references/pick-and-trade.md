# Container image — pick & trade

## What it is for

A standard OCI image, pushed to any registry, run on any host that runs
containers: a managed container service, a scheduler, or a plain VM. Pick it
when the product must not be tied to one cloud, or when it must be able to
move without a rewrite.

## What the portability costs

Neutrality is bought, and it is worth naming the price rather than
discovering it:

- **The managed features a cloud's own compute service supplies are yours.**
  Request-based autoscaling, scale-to-zero, a built-in identity for calling
  the provider's other services, integrated log routing — a neutral target
  either does without them or reimplements them per host.
- **Operational surface grows.** Someone owns the host, its base images and
  their patching. A managed service folds that into the bill.
- **The cheapest path on any one cloud is usually its own service.** This
  target trades that for not having to care which cloud.

## When it stops being the answer

- **The product has settled on one cloud and will not move.** The neutrality
  is then paying for an option nobody will exercise, and that cloud's own
  compute service is the smaller answer.
- **The workload is not a long-running server.** A scheduled job, an
  event-triggered function or a static site each have targets that fit
  better; wrapping them in a container host is machinery around a smaller
  need.
- **The project is client-distributed.** A desktop or mobile app ships
  through its platform's store or update channel, and a CLI ships to a
  package registry. Neither has an environment to deploy into.

## The thing it is not

Choosing this target says nothing about whether the repo runs a local stack.
Those are unrelated decisions that happen to share a runtime, and a product
deploying to a managed cloud service still runs its local stack the same
way.
