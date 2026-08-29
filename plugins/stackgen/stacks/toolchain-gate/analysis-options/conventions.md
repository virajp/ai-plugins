# analysis_options — conventions

The analyzer is the app's correctness gate, and it is language-specific — so it
belongs to the app bundle rather than to the repo gates, the same seam that puts
ESLint in the TypeScript bundle.

**Lint rules are enabled from a shared ruleset and narrowed deliberately.** A
rule disabled repo-wide because one file could not satisfy it is a rule the app
no longer has.

**Analyzer errors fail the build**, wired as one task the pipeline runs too.

Full judgment: the `analysis-options` skill.
