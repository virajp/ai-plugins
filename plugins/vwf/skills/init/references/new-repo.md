# The New-Repo Pipeline

Read this in mode **new** — a target with no configuration directory and no
task library. Nothing here reads or moves a source file, so it is safe on a
repository that has code but has never been shaped.

The five questions in SKILL.md are already answered. Present the whole plan
below, get **one** consent, then apply it in this order. The order is the
contract: a step that runs early because it happens to be cheap produces a
tree the next step has to undo.

## 1 — The repository itself

Create the repository where there is none — default branch **`main`** — and
create **`develop`** off it. Where a repository already exists, leave both
alone: an existing branch layout is a decision somebody made, and renaming it
is not this command's call.

Report what was created and what was already there. Nothing else in this
pipeline touches git history.

## 2 — The three baselines

Materialize the three unconditional bundles by their fixed slugs, through the
stack adapter (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`), invoking
`/<plugin>:<plugin>-stack-template <slug>` once per slug. Fetch them in the
**composition order the materializer documents** — the toolchain manager, then
the gates, then hygiene — because a later component's file wins where two
write the same path, and getting the order wrong silently lands the wrong
version of a shared file.

Each landing is the materializer's own consent line. **A decline is a
deferral, not a halt**: record what was skipped and name its unlock — re-run
`/vwf:init` with the write consented — then continue with the rest of the
pipeline. This is the same rule `/vwf:setup`'s tooling step follows, and it
matters most here, where a repo that has picked no stack is the normal case
rather than a fault.

## 3 — The secrets provider

Materialize the bundle whose slug the user picked at question 3, by that slug,
through the same adapter. **Last**, after the three baselines — a provider's
files are the most specific answer anything gives to the slot they overlay,
and the composition order puts them there.

A user who answered **none — decide later** gets nothing here. Record it as a
deferral whose unlock is a later `/vwf:init` run, and say plainly that the
slot the packs left for it will announce itself as unconfigured until then.

## 4 — The placeholders

Three, and no others: `<REPO_URL>`, `<YEAR>` and `<HOLDER>`. The hygiene
pack's conventions are authoritative for what each means; fill every
occurrence across every landed file, from:

| Placeholder  | Source                                                        |
| ------------ | ------------------------------------------------------------- |
| `<REPO_URL>` | the origin remote's web URL, no trailing slash                |
| `<YEAR>`     | the current year                                              |
| `<HOLDER>`   | `git config user.name`, confirmed in the plan before applying |

A placeholder whose source is missing — no origin remote, no configured name
— is **asked**, once, rather than guessed or left in place. A `<` surviving in
a landed file after this step is a bug, not a template.

## 5 — The ignore sections

Append one section per detected stack to the hygiene pack's sectioned ignore
file, per [fragments and sections](fragments-and-sections.md).

**The detected stack is what the materializer's lockfile records** — the
language, package-manager and app-framework components it lists — and nothing
else. On a repo that has picked no stack the lockfile names none, the step
appends nothing, and that is correct: the baseline sections cover what every
repo needs, and a section for a language nobody chose is a guess.

## 6 — The hook fragments

Merge every fragment the landed packs dropped into the gate config, per
[fragments and sections](fragments-and-sections.md). On a new repo this is the
first merge, so every fragment present is appended; the algorithm is the same
one a re-run uses.

## 7 — The project ids, and the three things they fill

Resolve the project ids, in this order of preference:

1. the **registry ids** in `.config/vwf.yaml`, where the file exists and names
   projects;
2. otherwise each **sub-project directory** name;
3. otherwise, for a single-project repo, the **repo's own name**.

That list is one list with **three** surfaces — the per-project task groups,
the bootstrap aggregator's **member flags**, and the **shell aliases** that
shorten them — so resolve it once and fill all three from it. A multi-repo
product's members come from the same detection `/vwf:setup` already does: the
registry's `members:` list, or the submodule names where the repo declares
them.

### The two marked positions

The toolchain pack ships the flag list and the alias list as **commented
templates in place**, each with a note saying the ids come from the registry
or the member directories — that is, from this list. Those comments are the
pack asking `init` for the one thing no pack can know, and filling them is not
authoring pack-owned content; it is answering the question the pack left open.

Write the real lines at those two positions, one per id in the resolved order,
copying the commented example's spelling exactly — the flag's own help text
shape, and the alias's own left-hand and right-hand shape — and leave the
surrounding comment in place as the record of where the list came from.

**A single-project repo has no members, so both positions stay exactly as
shipped.** There is no flag and no alias to write, the aggregator's
widen-the-scope flag is then a no-op that a caller passes without knowing the
repo's shape, and deleting either comment would cost the next run — after the
repo grows a second project — the template it fills.

### The `_default` slot

For each id, create one `_default` slot in the task library's per-project
group. **This is the one file `init` authors rather than copies**, and packs
cannot supply it: no pack can know a project's name. Copy the shape of a
marked slot the toolchain pack already landed — its marker comment, its
sourced helper, its always-exit-0 contract — and change what it prints. Do not
write the body from scratch; that shape belongs to the pack's conventions.
Set the exec bit, as every file in that tree carries one.

**What it prints is its own one-liner, not the shared unfilled-slot notice.**
That notice closes by telling the reader to pin the repo's stack and
materialize the packs that fill it, which is the right instruction for a slot
waiting on a stack and the wrong one here: a project that has no commands yet
is not a repo missing a stack, and sending the reader to pin one is sending
them to fix something that is not broken. So the slot keeps the marker — that
is what lists it among the repo's unfilled slots — prints **"no project tasks
yet"** through the pack's own print vocabulary, and exits 0.

## 8 — The readme stub and the licence

Per [readme and licence](readme-and-license.md). Both are placed here, after
the packs have landed, so a pack shipping either would have been caught by the
materializer's own root allowlist rather than silently overwritten.

## 9 — Bootstrap

Run the two bootstrap steps the toolchain pack documents, **in the pack's own
order** — the **trust** step first, then the task that makes every file in the
task library executable.

Both are documented in the pack's **task-library reference**, and reading it
is the step rather than a footnote to it:

- **The trust step** is its own section there, titled for the fact that
  matters — that it comes before everything else — and it names the repo
  `init` has just laid the payload into as one of the two cases it exists
  for. It carries the exact form to run and why the narrower form is wrong
  (the pack ships a config *split*, and the narrow form trusts one file of
  it), a table of what an untrusted config costs under each of the manager's
  two trust settings, and the pipeline and linked-worktree cases. The pack's
  **conventions** state the same doctrine in one paragraph, and its skill's
  bootstrap section restates it; the reference is where the detail is.
- **The executable-bit step** is in that same reference's task-file anatomy,
  which is also what explains the symptom: the manager runs a task file
  directly, so one without the bit fails as an *unknown task* rather than as
  a permission error.

**Why trust goes first, stated honestly**, because the reference's own table
is more interesting than "it would not work otherwise": under the manager's
stricter setting an untrusted config makes the second step fail outright,
while under the default it is silently auto-trusted and the step runs. What
breaks either way is **discovery** — listing the library at all — which is how
both a human and an agent find out the tasks exist, and what a later step in
this pipeline probes before deciding what to run. Neither column is a working
repo, so the order stands.

Read both there and run what they say, rather than re-implementing the steps
or re-spelling their commands here. A step those files do not document is a
step `init` does not invent.

Where the manager's own binary is not installed, this step **defers** with its
unlock — install the manager, re-run `/vwf:init` — and the run continues to
the report. Everything above it has already landed on disk.

## 10 — Offer the bootstrap aggregator

Offer, once, to run the task library's bootstrap aggregator now. It is the
step that installs the pinned tools, wires the gate hooks and reaches the
secrets provider, and on a fresh repository it is long — so it is an **offer**,
never automatic, and a decline needs no re-asking.

Whichever way it goes, name the task so a user who declined knows what to run.

## 11 — The report

The six-section report and the two next-step lines, exactly as SKILL.md
specifies. A new repo's report is mostly *files written*; *files moved* and
*tasks renamed* read `none`, which is the honest shape of a tree that had
nothing to reconcile.
