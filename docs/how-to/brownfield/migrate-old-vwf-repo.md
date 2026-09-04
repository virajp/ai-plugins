# Catch a repo up after a vwf upgrade

You upgraded vwf, and a repo you blueprinted a while ago is still written
against the format that shipped back then. Nothing is broken — the tree is
*correct for the format it was written in*, and wrong only for this one. The
whole job is one command and a handful of confirmations.

The worked example is **Jotter**, a notes app blueprinted several vwf releases
ago: one repo, one project, ungrouped and unnumbered flow folders, entities
written as single files. Its `.config/vwf.yaml` still carries the stamps it was
written under, which is what makes this a migration rather than an onboarding.
At the end Jotter's documentation sits where the current format puts it, that
config carries both current stamps, and the repo has been checked against it.

Mechanics — modes, halt conditions, config keys — live in the
[vwf plugin manual](../../plugins/vwf.md). If you have not run the workflow end
to end, [start a product from an empty repo](../greenfield/single-repo.md) is
the spine this guide re-enters partway through.

## The journey

### 1. The nudge arrives during normal work

You do not go looking for this. vwf installs once at user level, so an upgrade
does not re-run itself per repo — instead each workflow command opens with a
cheap format check, and that is what reaches Jotter. The next `/vwf:plan` there
names the repo's format, the one vwf now ships, and `/vwf:setup` as the way to
reconcile them. (The upgrade itself is
`claude plugin marketplace update virajp-plugins` then
`claude plugin update vwf` — the [installer CLI](../../installer/usage.md) never
updates a plugin it has already installed.)

The nudge is not a halt. The command carries on if the docs it needs are
present, and stops only when the old tree lacks something the current format
introduced. [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)

### 2. Run `/vwf:setup`

```text
/vwf:setup
```

Step 0 reads `.config/vwf.yaml` and compares both of its stamps against the ones
vwf now ships. Jotter's config parses and its stamps are behind, so the mode
resolves directly to `migrate` — once, with nothing later in the run re-deriving
it. [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)

What follows is **state-based reconciliation**: setup diffs the tree against
what the current format *is* — the doc templates, the conformant example bundle,
the authoring bars, the config doctrine — and converges on it, rather than
replaying one step per version between Jotter's stamp and today's. How far
behind Jotter sits therefore does not change the run, and there is no version
history for you to look up.

Most of the diff is mechanical, precisely because an older tree names things
correctly for its own format. Jotter's flat, unnumbered flow folders are the
retired spelling of the grouped and numbered ones; its single-file entity docs
are the retired spelling of a folder holding the prose beside the data model;
the `Serves:` line on each of those entities is the retired spelling of
`Used by:`. Each resolves through vwf's lineage table and lands in the plan as a
move, never as a question. The root `.graphifyignore` is part of the current
shape too: Jotter has none, so the standard excludes land in the plan as one
entry like any other.

### 3. Confirm the spellings that fan out

A few retired names map to more than one current name, and vwf picks none of
them silently. It reads the directory for evidence, proposes the mapping that
evidence supports while quoting it, and confirms by MCQ — one decision per
round.

Jotter hits two:

- Its one project is typed `web`, which today could be a content site or a UI
  that publishes its own API. setup quotes the API contract the project already
  ships, proposes the latter, and Jotter confirms.
- Its config names a `test` environment, and the current vocabulary has no
  single partner for that word. setup proposes rather than rewrites; Jotter
  answers `staging`.

### 4. Approve the plan, then let the spine run

Everything above arrives as one dry-run plan — every file created, moved and
updated — and nothing is written until you approve it. Jotter approves. setup
works in its own worktree, moves with `git mv` so history survives, never
deletes, and merges rather than overwrites.

Then the shared spine runs in an order that is itself the point: validate the
reconciled bundle, write `.config/vwf.yaml` with both current stamps, run
[`/vwf:doctor`](../../plugins/vwf.md#commands) against the config just written,
then commit behind one approval gate. A stamp written before the validation
would describe a tree nobody checked. Jotter's doctor run comes back with
nothing blocking, so the run commits, then offers to build the code-intelligence
graph — accept it, since setup is the only command that builds one. It ends by
printing the chain forward, and starts none of it.
[`/vwf:setup`](../../plugins/vwf.md#vwfsetup)

Jotter now has its documentation under `docs/blueprint/` in the current shape,
both stamps current in `.config/vwf.yaml`, and one commit recording the whole
reconciliation.

### 5. If it stops partway, run it again

There is no resume flag and no progress key: re-running setup **is** the resume
mechanism. Step 0 re-resolves the mode from what is on disk, so an interrupted
Jotter picks up what is left and produces a smaller plan, and a finished one
resolves to `current`, reports both stamps, and exits.

## Decision points

There are almost none, and that is the feature. A migration you have to research
is a migration people postpone, so vwf reconciles against the current format
itself rather than asking you to reason about the distance from yours. What is
genuinely yours to answer is below.

### The spellings that fan out

An old name with exactly one current spelling is a rename, and setup applies it.
An old name with several is put to you with the evidence quoted, because the
wrong answer here can be invisible forever — a project typed to the wrong role
still behaves identically today and misroutes every slice planned against it
later. Answer these from the code, not from what the directory used to be
called.

### The consent gate

The dry-run plan covers every write, and it is the one that matters; two lighter
approvals follow it — the summary before the commit, and the graph-build offer
after. Read the moves rather than skimming them: a move is where an old tree's
shape becomes the current one, and it is also the only place a link you care
about can change. Nothing structural is hiding in there — setup writes and moves
documentation and config, and never a source file.

That last rule has a consequence worth expecting: a repo whose code sits
somewhere the current topology would not put it ends the run as a written
recommendation, not a change. Acting on it is a separate, later decision of
yours. [Structure](../../plugins/vwf.md#structure)

## When things halt

Each of these is a genuine stop, and each is explained where it is enforced.

- **An unparseable `.config/vwf.yaml` halts Step 0**, with the parse error
  verbatim; it is never onboarded over, since it records decisions nothing else
  does. [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)
- **A blocking `/vwf:doctor` finding halts the run and reverts the stamp**, so
  no stamped-but-unrunnable config survives.
  [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)
- **A missing graphify CLI or graph is blocking**, and an old repo predates
  both. [Code intelligence](../../plugins/vwf.md#code-intelligence)
- **A stack pin no installed plugin defines is blocking** — the likeliest reason
  an old repo halts here, since free-text pins have been retired and a language
  nothing claims counts as unknown.
  [Stack templates](../../plugins/vwf.md#stack-templates)
- **A workflow command halts before you ever reach setup** when the operation
  needs an artifact the old format lacks — a blueprint sweep reaching a flow
  with screens and no design system is the common one.
  [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint)
