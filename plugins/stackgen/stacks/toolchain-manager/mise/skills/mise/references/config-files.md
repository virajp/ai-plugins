# The three mise config files

The annotated skeleton for each file in the `.config/` split. Read this before
writing or editing `mise.toml`, `mise.dev.toml` or `mise.ci.toml`. The rules
that decide **which** file a tool, setting or env value belongs in — and the
Node gpg rule — stay in the skill itself and are not repeated here.

These three files ship as this component's `config/` payload, so a materialized
repo already has them. This reference is what you author against when a repo
needs one the payload did not cover, or when you are editing one that landed.

## `mise.toml` — the common base

```toml
[settings]
activate_aggressive  = true     # let mise shims win on PATH
env_shell_expand     = true     # expand $VARS in [env]
gpg_verify           = true     # verify tool signatures (see CI exception below)
raw                  = true     # streams output
status.missing_tools = "always"

# Node settings — only when the project uses Node
node.compile        = false
npm.package_manager = "pnpm" # pnpm is the package manager

# Python settings — only when the project uses Python
pipx.uvx            = true
python.compile      = false
python.uv_venv_auto = "create|source"

[env]
# Only what is identical in every environment.
DISABLE_TELEMETRY = 1

[tools]
# Language RUNTIME only — the minimum to run/build the project anywhere
node = { version = "latest" }
pnpm = { version = "latest" }

[tasks.init]
# Mandatory — chmod the file-based tasks under .config/mise/tasks/ executable.
# Lives in the BASE (not dev) so tasks are runnable in every env, CI included.
description = "Initialize mise tasks"
hide        = true
run         = "find .config/mise/tasks/ -name '*' -type f -not -path '*/*.env' -exec chmod 755 {} \\;"
```

## `mise.dev.toml` — the developer laptop

```toml
[settings]
env_shell_expand     = true
status.missing_tools = "always"

[tools]
dprint     = { version = "latest" }
gitleaks   = { version = "latest" }
grype      = { version = "latest" }
pre-commit = { version = "latest" }
taplo      = { version = "latest" }

[shell_alias]
setup     = "mise run setup:all"
setup-all = "mise run setup:all --all"   # when the repo has submodules

[env]
PRE_COMMIT_HOME = "$HOME/.cache/pre-commit"

# Node-only, when the runtime is Node:
# NEXT_TELEMETRY_DISABLED = 1
# NODE_NO_WARNINGS        = 1
# _.path                  = { path = "node_modules/.bin", tools = true }

# Local/dev values for anything the app reads at runtime
LOG_LEVEL   = "trace"
RUNTIME_ENV = "development"
```

## `mise.ci.toml` — CI builds & deployed runtime

```toml
[settings]
# CI runs on Linux, where mise's bundled Node release-key gpg import can fail
# ("no valid OpenPGP data found"). Disable ONLY the Node signature check — the
# tarball is still SHA256-verified. Include this only for Node projects.
node.gpg_verify = false

[tools]
# Usually empty — CI reuses the runtime from mise.toml. Add a tool here only if
# the pipeline genuinely needs it and dev does not.

[env]
# Production VALUES for the same keys mise.dev.toml sets locally
LOG_LEVEL   = "warn"
RUNTIME_ENV = "production"
```
