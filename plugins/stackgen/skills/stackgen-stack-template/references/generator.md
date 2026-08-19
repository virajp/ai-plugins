# The Generator

Read this only for a first pin of `generated/<technology-slug>` — a
technology no shipped pack covers. The generator produces the same shape a
pack has (payload fields, conventions prose, optionally skills), then hands
it to [the materializer](materializer.md) for the consent gate and landing.
Generation is **explicit**: it runs on a pin, never as a background refresh.

## Preconditions — halt, never guess

- **The principles catalog must have been passed in.** vwf passes the
  catalog's asset paths (its index plus entries) into the invocation. No
  catalog in the invocation → halt and name what is missing. Never
  substitute general knowledge for the catalog — the catalog is the trust
  anchor the reviewer gate checks against.
- **Context7 must be reachable.** Resolve the technology's library IDs and
  fetch current documentation before writing a word. Unreachable → **halt**;
  a generated skill written from training knowledge is exactly the
  plausible-but-stale artifact this pipeline exists to prevent. Thin
  coverage on a niche stack is reported as thin — the output says what it
  could not verify rather than padding.

## Pipeline

1. **Resolve the kind, then detect the real stack.** The pinned technology
   maps to one kind (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) — the kind
   fixes the output structure, scope, facts and invocation modes before a
   word is written. Then read the repo's manifests (and the graphify graph
   when one exists) for the technology's actual versions, config flags,
   companion tools, and usage shape. Generation targets what the repo has,
   not the technology in the abstract — a claim about a config-dependent
   feature the detection never confirmed is a reviewer gap waiting to
   happen.
2. **Research.** Context7 for the technology and its detected companions:
   current APIs, configuration shape, testing idioms, the ecosystem's own
   conventions. Keep the source references — citations are mandatory in the
   output, and they land durably in
   `.claude/stackgen/citations/<slug>.yaml`. For a `language-bundle`, keep
   each technology's research separable, so sync can regenerate one part
   without churning the others.
3. **Instantiate the catalog.** For each principles-catalog entry, write how
   it lands in this stack — concrete idioms, not restated definitions — and
   honor each entry's **when-not-to-apply** section: where the stack's own
   idiom already embodies or supersedes a principle, the generated skill
   says so instead of prescribing ceremony. Every claim about the technology
   cites its research source; every judgment cites its catalog entry.
4. **Assemble the pack shape, per the kind's structure**: payload fields
   (axis, `kind`, languages **with emitted facts** — how an LSP is
   provided, the mise tool, the manifest; `n/a` where honest), the
   `harness` block naming tasks and mechanisms, the conventions prose, and
   the kind's artifacts — skills, agents, rules, within the output
   vocabulary. **Never an executable** (hook scripts are pack-only), never
   MCP or LSP configuration.
5. **The reviewer gate.** Dispatch the `stackgen-skill-reviewer` agent —
   stateless: it gets the catalog paths, the declared kind, the detected
   stack, the generated artifacts, and the citation list; it returns
   `NO GAPS` or a numbered gap list. Loop generation on the gaps until
   clean. It is a **gate**: a run that cannot come clean is reported to the
   user with the residual gaps, never landed quietly.
6. **Materialize.** Hand the clean pack shape to
   [the materializer](materializer.md) — its dry-run consent gate is where
   the user sees everything before it lands.

## Rules

- **Configure, not conjure.** Generated output wires and documents existing
  tools — it never implements servers, and it never invents a tool the
  ecosystem does not have. A capability with no real mechanism is `n/a`.
- **Judgment over API surface.** The conventions carry decisions (layout,
  placement, testing shape, failure modes); API reference stays in Context7,
  fetched by whoever codes against it later.
- **The minimalism bar applies to the output itself**: generate the entries
  the detected stack needs, not one skill per catalog entry by rote.
