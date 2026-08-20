# The Generator

Read this only for an **uncovered component** — one the resolved
composition needs and no shipped pack covers (a pin of
`generated/<technology-slug>` is the case where the bundle root itself is
uncovered). The generator produces, per component, the same shape a pack
has (classification + payload fields, conventions prose, optionally
skills), then hands it to [the materializer](materializer.md) as part of
the composition's single consent gate and landing. Generation is
**explicit**: it runs on a pin, never as a background refresh.

## Preconditions — halt, never guess

- **The principles catalog must have been passed in.** vwf passes the
  catalog's asset paths (its index plus entries) into the invocation. No
  catalog in the invocation → halt and name what is missing. Never
  substitute general knowledge for the catalog — the catalog is the trust
  anchor the reviewer gate checks against.
- **Context7 must be reachable.** It is the **primary and preferred
  research channel**: resolve the technology's library IDs and fetch
  current documentation before writing a word. Unreachable → **halt**; a
  generated skill written from training knowledge is exactly the
  plausible-but-stale artifact this pipeline exists to prevent.
  Supplementary sources are allowed only where Context7's coverage of a
  topic is thin — and both the thinness and every supplement are disclosed,
  per topic, in the citations file (step 3): the output says what it could
  not verify rather than padding.

## Pipeline

1. **Classify the component, then detect the real stack.** The component
   carries a `type` and, where its type has them, a `category`
   (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`) inside its bundle's kind
   (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) — together they fix the output
   structure, scope, facts and invocation modes before a word is written.
   Then read the repo's manifests (and the graphify graph when one exists)
   for the component's actual version, config flags, companion tools, and
   usage shape. Generation targets what the repo has, not the technology in
   the abstract — a claim about a config-dependent feature the detection
   never confirmed is a reviewer gap waiting to happen.
2. **Resolve the component's topics.** The unit of research and writing
   is the **bar topic**, never the library: take the kind's topic bar
   (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) and select the topics the
   component's type owns — the composition as a whole covers the bar,
   each component supplying its slice. Decide each conditional topic's
   applicability from the detection: a conditional topic the detected
   stack makes inapplicable is recorded **`n/a` with why** in the
   citations file — never silently absent, because the reviewer reads
   absence as a gap. A kind whose bar is still pending elicitation has no
   topic list to walk; its structure sketch bounds what is generated, and
   nothing here invents a bar for it.
3. **The topic loop — research, write, cite, per topic.** For each
   applicable topic, in order:
   - **Research** — one Context7 pass per topic, minimum: the topic's
     current APIs, configuration shape, idioms, the ecosystem's own
     conventions, against the detected versions and companions.
     Supplementary sources only where Context7's coverage of *this topic*
     is thin — and the thinness itself is recorded for the topic, which
     is what lets the reviewer accept a thin topic honestly instead of
     flagging it as a coverage gap.
   - **Write** — the topic's artifact, per the kind's structure and sized
     per the kind's depth bar. Instantiate the catalog as it lands in
     this topic — concrete idioms, not restated definitions — honoring
     each entry's **when-not-to-apply** section: where the stack's own
     idiom already embodies or supersedes a principle, the artifact says
     so instead of prescribing ceremony.
   - **Cite** — every claim about the technology cites its research
     source; every judgment cites its catalog entry. Citations land
     durably in `.claude/stackgen/citations/<component-slug>.yaml`,
     **keyed per topic**: the topic's sources, every supplement disclosed
     as such, a thinness note where research came up thin, and the `n/a`
     topics with their why. One citations file per component — which is
     what lets sync regenerate one component without churning the others.
4. **Assemble the component's pack shape**, per its type's slice of the
   kind's structure: the classification fields (`type`, `category`,
   `capability` — a vwf token or unset, never a minted one; the taxonomy's
   seam), the payload fields its type owns (a language component's
   languages **with emitted facts** — how an LSP is provided, the mise
   tool, the manifest; `n/a` where honest), the `harness` entries it
   satisfies, the conventions prose, and the artifacts its slice defines —
   skills, agents, rules, within the output vocabulary. **Never an
   executable** (hook scripts are pack-only), never MCP or LSP
   configuration.
5. **The reviewer gate.** Dispatch the `stackgen-skill-reviewer` agent per
   generated component — stateless: it gets the catalog paths, the
   declared kind and the component's classification, the detected stack,
   the generated artifacts, and the citation list; it returns `NO GAPS` or
   a numbered gap list. Loop generation on the gaps until clean — under
   the **convergence guard**: reviewer rounds are capped, **default 4**,
   mirroring vwf's execute-stage rule, because a reviewer and a generator
   can trade findings forever. It is a **gate**: when the cap is reached
   with gaps still open, stop looping and report the residual gaps to the
   user — a run that cannot come clean is never landed quietly, and never
   iterated indefinitely either.
6. **Materialize.** Hand the clean component to
   [the materializer](materializer.md) alongside the composition's
   pack-sourced components — its dry-run consent gate is where the user
   sees everything before it lands.

## Rules

- **Configure, not conjure.** Generated output wires and documents existing
  tools — it never implements servers, and it never invents a tool the
  ecosystem does not have. A capability with no real mechanism is `n/a`.
- **Judgment over API surface.** The conventions carry decisions (layout,
  placement, testing shape, failure modes); API reference stays in Context7,
  fetched by whoever codes against it later.
- **The minimalism bar applies to the output itself**: generate the entries
  the detected stack needs, not one skill per catalog entry by rote.
