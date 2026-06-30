# Contract vs Realization

The blueprint holds the **contract**. `plan` holds the **realization**. A
decision belongs in the blueprint only if it passes **both** tests:

1. **Two-reasonable-answers test** — does the decision have more than one
   defensible answer? If exactly one idiomatic answer follows from the blueprint
   - conventions, it is mechanical → leave it to `execute`.
2. **Code-independence test** — would this fact still be true if the codebase
   were rewritten from scratch in a different language or framework? If it
   depends on what the code looks like today, it is realization → leave it to
   `plan`.

| Dimension    | Blueprint (contract)                                 | Plan / execute (realization)    |
| ------------ | ---------------------------------------------------- | ------------------------------- |
| Data         | a field is unique, optional, an enum of {…}          | column type, index, migration   |
| API          | endpoint, error cases, idempotency, auth role        | handler file, middleware wiring |
| Relationship | order *owns* line-items; cascade on delete           | FK vs join table, ORM mapping   |
| Flow         | checkout is eventually consistent; compensates       | saga library, queue choice      |
| Concurrency  | concurrent edits resolve by optimistic version       | the lock column, retry code     |
| UI / UX      | edit happens in a modal; destructive actions confirm | which Dialog component, CSS     |
| NFR          | a list page returns ≤50 items by default             | the pagination helper           |

**Never put in a blueprint (drift bait):** file paths, class/function names,
library or framework names, "reuse module X", framework APIs, exact
colors/spacing/pixels. The moment a blueprint sentence names *how the current
code is built*, it goes stale and becomes the drift the workflow exists to
catch.

When a decision is genuinely open, **do not guess** — record it under **Open
Questions** and surface it to the user. A blueprint with honest open questions
is sound; a blueprint with silent assumptions is not.
