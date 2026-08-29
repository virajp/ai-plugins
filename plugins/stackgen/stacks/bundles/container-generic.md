---
name: OCI image · any container host
axis: deploy
kind: deploy-target
components:
- deploy-target/container-image@0.1.0
artifact: container-image
---

# Deploy — OCI image · any container host

A **provider-neutral** deploy target: build a standard OCI image, push it to any
registry, run it on any host that runs containers (a managed container service,
a scheduler, or a plain VM). The option to pick when the product must not be
tied to one cloud.

**The composition is this one component and nothing else.** A Deploy-Bundle has
no second half, because there is no category above a provider-neutral target to
write doctrine at — a target belonging to a cloud is a `cloud-service` in that
cloud's bundle instead. What keeps the single component honest is its kind's
scope fence: the pipeline belongs to the CI system, the managed flavour to a
cloud provider, and the local stack to the harness contract.

**The trade is explicit.** Portability is bought by declining the managed
features a cloud's own compute service would have supplied — request-based
autoscaling, a built-in identity, integrated log routing. Pick this when the
option to move is worth more than those; pick the cloud's own service when it
is not.

**One digest is promoted, never rebuilt per environment.** That is what makes
the tested artifact the released artifact, and it is why the image carries no
environment-specific configuration.

A `frontend` project does not deploy here — it ships through its platform's
store or update channel, and a `cli` frontend ships to a package registry
(`npm-package`). Record the channel in `architecture.md` and pin
`deploy_template: n/a`.

Full judgment: the component's own skills and their references. The local stack
this bundle does **not** cover is `assets/contracts/local-stack.md`.
