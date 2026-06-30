---
description: Create or update the repository's README — scan the codebase and
  document it with a title, short description, a project list, an architecture
  mermaid diagram with notes, an infrastructure (cloud tools) section, a
  local-development setup guide, per-project sections (monorepo or polyrepo), and
  the important mise tasks. Follows the documentation-standards skill.
argument-hint: "[target-dir]"
model: sonnet
effort: high
---

# markdown:readme — Document the repo in its README

Scan the repository and write (or update) its **README**, following the
**documentation-standards** skill (writing style, tables, and the mermaid
diagram rules). Default the target to the current repo root; if `$ARGUMENTS`
names a directory, operate on `<dir>`.

Update an **existing** readme in place — preserve its filename and casing
(`README.md` / `readme.md`); otherwise create `README.md`.

## Required sections (in this order)

The README must contain these, top to bottom:

1. **Title** — the project name as the `#` H1.
2. **Short description** — one or two sentences on what the project is and does.
3. **List of projects** — every project/package in the repo (a table for a
   monorepo; a single entry for a polyrepo).
4. **Architecture** — a `mermaid` diagram of how the projects/services fit
   together, plus the important notes a reader needs (boundaries, data flow, key
   decisions).
5. **Infrastructure** — every cloud tool/service the repo uses.
6. **Local Development** — a step-by-step guide to run the repo locally.
7. **Projects** — one detailed section per project (monorepo) or a single
   project section (polyrepo).
8. **Important mise tasks** — the tasks a developer actually runs.

When updating, **refresh these eight in place and keep every other section** an
existing README has (License, Contributing, badges, …) — never delete them.

## 1. Detect (scan the repo — do not assume)

Gather the facts before writing:

- **Title & description.** Repo/package name (`package.json` `name`,
  `pubspec.yaml`, `Cargo.toml`, `pyproject.toml`, the git remote, or the
  directory name) and any existing description/tagline.
- **Layout & projects.** Monorepo vs polyrepo — `pnpm-workspace.yaml`,
  `package.json` `workspaces`, `melos.yaml`, `nx.json`, `turbo.json`, a Cargo
  `[workspace]`, `go.work`, or multiple package manifests in sub-directories.
  Record each project's path, name, language/stack, and purpose.
- **Architecture.** How the projects relate — workspace/import dependencies
  between packages, service boundaries (api / worker / web / db), entry points,
  and any existing `docs/blueprint/architecture.md` (e.g. a vwf Project
  Registry) — to draw the diagram and capture the key decisions.
- **Infrastructure (cloud tools).** Scan for: IaC (`*.tf`, Pulumi, CDK,
  CloudFormation), containers/orchestration (`Dockerfile`, `docker-compose*`,
  k8s manifests, Helm), CI/CD (`.github/workflows`, `.gitlab-ci.yml`), deploy
  configs (`vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `app.yaml`,
  `serverless.yml`), and cloud SDKs/services in dependencies or config (AWS,
  GCP, Azure, Firebase, Supabase, Vercel, Cloudflare, Neon, PlanetScale, …).
- **Local development.** The toolchain manager (this marketplace standardizes on
  **mise** — prefer `mise install` plus the `setup:*` tasks), env setup
  (`.env.example`, doppler, mise `[env]`), and prerequisites.
- **mise tasks.** Run `mise tasks` and pick the ones used day to day (setup, the
  `code:*` gates, test, build, dev/run, release).

## 2. Ask (one batched round — only what you cannot infer)

Ask only for what the scan can't answer: the one-line description/tagline if
none exists; which detected cloud services are actually in use vs vestigial; and
confirmation of the architecture's boundaries before drawing the diagram. Don't
invent a description, a cloud service, or a project's purpose — ask.

## 3. Write

Write/update the README with the eight sections above, per the
**documentation-standards** skill:

- Short sentences, active voice, no filler; a language id on every code block;
  tables for the project list, infrastructure, and mise tasks.
- **Architecture diagram** — `mermaid`, type chosen by purpose (`flowchart` for
  topology/dependencies, `sequenceDiagram` for request flows). No `%%{init}%%`
  or custom themes (GitHub + GitLab portability). Quote any label with special
  characters (`A["api (node)"]`). Animate any dotted/loop-back edge. One concept
  per diagram — split if it sprawls. Each note states the *why*, not just the
  *what*.
- **List of projects** as a table: `| Project | Path | Stack | Purpose |`.
- **Infrastructure** as a table: `| Tool / Service | Used for |`.
- **Local Development** as ordered, copy-pasteable steps — clone,
  `mise install`, env setup, the `setup:*` task, and how to run it.
- **Projects** — per project: what it is, its stack, how to run/test it, and its
  key tasks.
- **Important mise tasks** as a table: `| Task | What it does |` — use real task
  names from `mise tasks`, never invented ones.

## 4. Report

State whether you **created or updated** the README, the layout detected
(monorepo / polyrepo) and the projects listed, and anything you had to ask about
or could not determine (e.g. a cloud service you flagged but couldn't confirm).
