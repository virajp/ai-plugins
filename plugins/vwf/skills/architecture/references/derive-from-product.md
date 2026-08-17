# Deriving the Registry from the Product Contract

Read this at Step 2 when `docs/blueprint/registry.yaml` is absent and
`docs/blueprint/product.md` exists. It replaces the cold open of Step 3, not
Step 3 itself: whatever the product contract leaves underdetermined is elicited
exactly as before, and Steps 4–7 — approval gate, writer, sync-verify, commit —
are untouched.

**The pipeline order does not move.** `product` still runs before this command,
and `blueprint` still needs the registry. What changes is the *input*: the
structural questions are answered from a document the user already wrote and
approved, instead of from an interview that asks them again in different words.

## 1. Read the product contract first

Read `docs/blueprint/product.md` in full before proposing anything. Each
section carries a different structural signal:

| Section                 | What it derives                                                             |
| ----------------------- | --------------------------------------------------------------------------- |
| Problem                 | the system overview and its one-line purpose (3a)                           |
| Target users            | one surface per persona — the platforms, and through them the projects      |
| Goals & success metrics | the capabilities each surface must carry, and what has to be measurable     |
| Tiers & entitlements    | an operator plane where tiers are administered — `[service, webapp]` plus the `operator-rbac` capability |
| Slice priority          | which projects exist in the first cycle, and the order to walk them in      |
| Non-goals               | what **not** to propose — an excluded surface is not a project              |
| Risks & assumptions     | candidate cross-cutting decisions, and points to park rather than answer    |

`product.md` names no technology, project, or screen by construction, so it can
never hand you a project name or a stack pin. It hands you *surfaces and
consumers*; the names are still yours to propose and the user's to correct.

## 2. Derive in four passes

Work them in this order — each narrows the next.

**a. Surfaces, from how each user class touches the product.** Take the Target
users table one persona at a time and read its Core need against the *platforms
by evidence* rows in `topology-detection.md`, the recognition reference under
`/vwf:setup` — the same definitions detection reads backward,
read forward here. A persona
who consumes authored content while signed out names `site`; one who works in a
signed-in application in a browser names `webapp`; one who carries the product
with them names `mobile`, and `tablet` too where the need calls for larger
layouts; a persona that is *another program* names `service`; an administrator
names the operator plane above. **Never assume a screen platform** — it makes
the design system mandatory, so each one is confirmed explicitly, and a persona
described only as reaching the product "on the web" is ambiguous between `site`
and `webapp`: ask, never pick.

**b. Roles, from who consumes each surface's output.** Group the surfaces into
projects — several platforms on one codebase stay **one** project — and name
each project's role from the consumer-domain table in that same file. The
role is an index; the platforms are what everything downstream branches on.

**c. Topology and repo placement.** The project count and how the slices ship
name a topology from `${CLAUDE_PLUGIN_ROOT}/assets/topologies/`; propose one with its
reasoning and let the menu answer. An `iac` project is **always its own repo**,
so propose it as one — independent, or a member of the product parent — rather
than as a directory under the product root. If the user places it inside
another repo anyway, record what they chose and say plainly what it costs:
`/vwf:doctor` reports the arrangement on every run, blocking
until the decline is recorded under `enforcement:` and as a persistent
degradation after. Never restructure from here.

**d. Stack pins, through the existing menu.** Platforms and capabilities are
exactly what narrows the project, backing and deploy axes, so hand them to the
flow already written in [the stack menu](stack-menu.md) — this is not a second
menu and never a shortcut past it. The derivation narrows what is *offered*;
the user still picks, and the menu stays closed to what the installed plugins
ship.

## 3. Every proposal carries its evidence

Show each derived value beside the words that produced it — a short quote and
the section it came from:

```text
app · platforms [mobile, tablet]
  "Drivers work from the phone in their pocket, and dispatchers from a
   larger screen in the depot" — Target users
```

Without the quote the user cannot tell a reading from an invention, and an
invention is precisely this mode's risk: a proposal that sounds plausible,
traces to nothing, and is approved because it arrived alongside everything
else. A value with no line behind it is not a proposal — leave the field
unresolved and elicit it in Step 3 rather than filling it in.

## 4. Correct by MCQ, one decision per round

Present the whole proposal once as a readable outline (elicitation §6), then
take corrections **one at a time** — a derived proposal does not license
batching. Each round follows `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`: name the
scope in both the header and the question text (§3a), offer the derived value
as the recommendation with its quote as the rationale, and fill the remaining
options from the same closed list, plus Other. Walk the rounds in the pass
order above, so each confirmation narrows what the next one offers.

**Recall and the graph still apply, and usually return nothing.** Run Step 3's
recall and graph-first grounding as written; a product-first repo has no code
to ground against, so both skip silently and the product contract is the
grounding.

## 5. Where the derivation stops

The product contract is about outcomes, not shape, so it settles none of the
following — elicit these in Step 3 as always:

- `path`, `depends_on` and `doc_unit` for each project.
- Hosting and deployment (3a), and every cross-cutting decision plus the
  foundations checklist (3c).
- Any judgment call the definitions deliberately leave open — a shared package
  consumed from two sides, a surface a persona describes ambiguously.

**What is proposed here must survive the round trip.** `recommend` →
`scaffold` → `detect` is an identity, so propose only tokens from the closed
lists: a later detection run over what gets scaffolded has to come back with
the same ones.
