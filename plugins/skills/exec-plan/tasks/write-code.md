<purpose>
Stage 4a of exec-plan — Write Code. Implements the approved plan under strict
TDD, verifying 100% test coverage before handing off to code review.
</purpose>

<user-story>
As a developer executing an approved plan, I want code written test-first with
red-green-refactor discipline, so that every change is covered and faithful to
the spec.
</user-story>

<when-to-use>
- Stage 4a of exec-plan, after a spec & plan exists in `docs/superpowers/`
- The approved implementation plan is ready to be turned into code
- NOT auto-triggered
</when-to-use>

**Model:** Haiku · **Persona:** Senior Developer (strict TDD) — writes the
failing test first, always; red-green-refactor is non-negotiable; never
improvises features not in the spec; reads the architecture registry and
engineering docs to adopt the project's actual stack vocabulary.

<steps>

<step name="lsp_check" priority="first">
Step 0 — LSP Check

Identify the primary language(s) for this task from the spec and the
architecture registry's `stack` fields. Then check which LSP plugins are active:

```bash
claude plugin list --scope project
```

For each language in the stack, verify an LSP server is installed. If one is
missing, ask the user before proceeding:

> "No LSP server detected for `<language>`. Without it, type errors and import
> issues may not surface until runtime. Continue without LSP?"

**Wait for response.**

- **Yes** → continue to the implementation steps.
- **No** → halt. Open the plugin manager with `/plugin` and use the **Discover**
  tab to find the right LSP server, then install it:
  ```sh
  claude plugin install <lsp-name>@virajp-plugins
  # or, if unavailable there:
  claude plugin install <lsp-name>@claude-plugins-official
  ```

</step>

<step name="implement">
Process

1. Invoke `skills:git-workflow`.
2. Spawn `model: haiku` subagent with persona above.
3. Invoke `superpowers:test-driven-development` before any implementation code.
4. Implement per the plan following RED → GREEN → REFACTOR for every change.
5. Run the project's test suite (e.g. `mise run code:test` or the equivalent per
   `mise tasks`) and verify 100% coverage. Stage 4a does not complete with
   uncovered lines.
   </step>

<step name="approval_gate">
Approval Gate

Show the coverage report. Wait for explicit user approval before 4b.

**Wait for response.**
</step>

</steps>

<output>
Implemented code per the plan, written test-first with 100% test coverage, plus
a coverage report presented for approval before Stage 4b.
</output>

<acceptance-criteria>
- [ ] Primary language(s) identified from the spec and architecture registry `stack` fields
- [ ] LSP server presence verified per language; user asked before proceeding if missing
- [ ] `skills:git-workflow` invoked
- [ ] `model: haiku` subagent spawned with the strict-TDD persona
- [ ] `superpowers:test-driven-development` invoked before any implementation code
- [ ] Every change implemented following RED → GREEN → REFACTOR
- [ ] Project test suite run with 100% coverage; no uncovered lines
- [ ] Coverage report shown and explicit user approval obtained before 4b
</acceptance-criteria>
