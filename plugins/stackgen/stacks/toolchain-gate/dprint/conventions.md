# dprint — format authority

**One formatter for the whole repository, configured once at the root.** A
second formatter is not a preference, it is a fight: two tools with different
opinions rewrite each other's output on alternate commits.

**Formatting only.** The linter carries zero formatting rules, and this
separation is the point — a rule that can be satisfied by a formatter should
never be able to fail a lint run. Correctness is the linter's; layout is here.

**Plugins are pinned by explicit version.** A floating plugin reference means
the repo formats differently on a machine that resolved it later, and the diff
lands on whoever commits next rather than on whoever upgraded.

**`excludes` covers every generated tree.** A generated file that gets
reformatted produces a diff nobody authored and a check nobody can make pass
without regenerating. Templated markdown is the exclusion that surprises people:
formatting a template rewrites the placeholders it exists to carry.

**`exec` is the escape hatch** for languages dprint has no plugin for — it
shells out to that language's own formatter, keeping one entry point even where
dprint itself cannot format.

**Wired as one task name**, and CI runs that same task. See the hook-runner
component for the parity rule this depends on.
