# The wave review (§4 step 3)

Read this when a wave's units have all returned and before its gate. The
mechanical gate proves the tree still validates; the review proves the units did
what their files said, and nothing else. Both are needed — a unit that edits the
wrong file, drops a passage, or resolves a ruling differently from its quote
passes every checker this repo has.

## The reviewer

One `general-purpose` subagent per wave, `name: "R<wave>"`, read-only —
instructed to edit nothing. Its prompt carries the wave's unit files, the diff
of the wave (`git diff <last green commit>..HEAD` inside the worktree — the
reviewer runs it, the orchestrator does not read it), and index.md's Assumed
decisions and Shared-file rule. It returns exactly:

    FINDINGS: <n>
    <path>:<line> [<unit>] <rule> — <one line>     (one per finding)
    CONTRACT: clean | <unit> touched <path> outside Owns
    RULINGS: clean | <unit> departed from decision #<n>: <how>

The rules it reviews against, in order:

1. **Scope** — every changed path is in exactly one unit's Owns list.
2. **Rulings** — each unit's edit matches its quoted ruling, not a paraphrase of
   it.
3. **Completeness** — every numbered edit in the unit file landed; nothing the
   unit file did not name was added.
4. **Tree traps** — `plugins/**/*.md` fold width kept by hand, strict-YAML
   frontmatter intact, a byte-copied payload still byte-identical, no `npm`
   after a pipe, no `cat >` heredoc residue.
5. **Docs** — a passage the diff falsifies that the unit did not report as
   `DOCS FALSIFIED:`.

It reviews prose and structure with the same weight as code: for this repo, a
skill that quietly lost a rule is the defect.

## The loop

- A `CONTRACT:` or `RULINGS:` line that is not clean is fixed first and always:
  re-dispatch the named unit with the line appended to its prompt. These are
  never left as residue.
- Other findings loop to the owning unit with the finding lines appended, then
  the reviewer runs again. **At most two rounds.** A round counts once even when
  several units were re-dispatched.
- **Convergence guard.** Before a second round, compare its findings with the
  first, matching on `path:line` and rule. The loop is not converging when the
  count did not strictly decrease or a resolved finding resurfaced. Stop there.
- Findings still open when the loop ends are recorded as `contested` in the run
  log with the rounds tried, and the wave proceeds to its gate. They are listed
  in the final report; they do not block, because the plan and its rulings are
  the contract and a reviewer's residual is an opinion about it.

Every round is a run-log row: `R<wave>`, the model, the round, `findings(n)` or
`pass`, and the finding lines condensed into Detail.
