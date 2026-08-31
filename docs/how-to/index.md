# Which how-to guide am I?

These guides are journey-shaped: each one narrates a whole product's walk
through vwf, organized by the situation you are in rather than by the command
you are about to type. The by-command reference — flags, halt conditions, config
keys, file formats — stays in the [vwf plugin manual](../plugins/vwf.md). Pick
the situation that matches yours.

## Starting fresh (`greenfield/`)

- **[Start a product from an empty repo](./greenfield/single-repo.md)** — you
  have an idea, an empty git repo, and vwf installed. This is the **spine**:
  install through first verified deploy as one continuous session log, worked on
  **Relay**, a team task manager in one repo. A first-time reader starts here.

The four below are **deltas** on that spine — they narrate only where their
product's journey diverges, so read the spine first and keep it open alongside.

- **[Design a product's screens in a design tool, then build them](./greenfield/ui-with-design-tool.md)**
  — your product is mostly interface and the visuals are decided on a canvas.
  **Centwise**, a Flutter expense tracker for phones, with the design tool
  authoring the design system and screens and vwf importing both as contract.
- **[Build a headless service with no UI anywhere](./greenfield/api-only-service.md)**
  — every consumer of your product is somebody else's code. **Hookline**, a
  payments-webhook relay whose primary surface is an OpenAPI contract, frozen at
  the production release.
- **[Build a product whose only surface is a terminal](./greenfield/cli-product.md)**
  — no screens, so the design system, the screen vocabulary and the UX gate all
  land differently. **clockon**, a CLI time tracker held to a Terminal UX
  contract.
- **[Start a product that spans several repos](./greenfield/multi-repo.md)** —
  your product will not fit in one checkout. **Stallfront**, an e-commerce
  product in four repos: one base repo holding the blueprint, three members
  holding the code.

## Adopting vwf (`brownfield/`)

- **[Adopt vwf in a codebase that already works](./brownfield/onboard-existing-codebase.md)**
  — you have a product in production, a team that knows it, and no vwf history
  at all. The early commands write down what is already true instead of deciding
  it. **Bookable**, a two-year-old booking monorepo.
- **[Catch a repo up after a vwf upgrade](./brownfield/migrate-old-vwf-repo.md)**
  — you upgraded vwf and a repo you blueprinted a while ago is written against
  the format that shipped back then. **Jotter**, a notes app: one command and a
  handful of confirmations.

## Running a live product (`operate/`)

- **[Keep the blueprint true once the product is live](./operate/production-feedback-loop.md)**
  — production has started disagreeing with the contract: a bug report, a metric
  under target, a UX complaint, a feature three teams want. Where each one
  belongs, picking **Relay** up after its deploy.
- **[Hand off work that outlives one session](./operate/sessions-and-handoff.md)**
  — a sweep, a long elicitation or an unattended run is going to outlast this
  context window. Capturing it so a fresh session continues rather than rebuilds
  it.
- **[Decide which stack your product pins](./operate/choosing-your-stack.md)** —
  vwf names no technology, so every concrete option comes from a `stackgen`
  bundle. Which bundle answers each of the four axes, decided **before**
  `/vwf:architecture`, with a reason for each pin.
