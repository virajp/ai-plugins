# Bootstrapping the Environment Catalog (§6)

Read this at §6 **only** when the registry declares integrations or a
secrets-manager `config` — the `2 → 3` trigger. A repo with neither never grows
an `environment.md`, and this step does not run.

Scaffold `docs/blueprint/environment.md` from the environment template and
**populate it from the repo's existing usage** — scan config schemas,
`.env`/`.env.example`, mise env values, and CI secrets/variables for the
variable *names* and infer purpose/issuer/consumer/required/classification per
the blueprint-authoring **environment-catalog** reference. Record names only —
**never copy a value**.

If a secrets/env-var catalog already lived in `conventions.md#config` (or
elsewhere), move those rows here and leave `#config` with the injection
mechanism alone.
