# U4 — The sunset stub for `@askviraj/ai-plugins`

- **Wave:** 1
- **Depends on:** —
- **Owns:** `sunset/**` (new directory: `package.json`, `ai-plugins.mjs`,
  `readme.md`)
- **Model:** inherit
- **Read first:** root `package.json` (for `license`, `author`, the `engines`
  shape to mirror) — read only, do not edit.
- **Lazy-load:** `installer/src/index.ts` lines ~118-130
  (`reportStatuslineMoved`, the existing stderr-then-nonzero precedent, for tone
  only)

## Ruling

Quoted from index.md:

> 3 — Sunset stub form: A standalone package under `sunset/`: `package.json`,
> one dependency-free `ai-plugins.mjs`, a `readme.md` saying the package moved.
> Not a workspace member, no build. Rejected: a runtime branch in the real
> installer; a throwaway dir outside the repo.

> 4 — Sunset stub version: `7.0.0` of `@askviraj/ai-plugins`. Rejected: `6.1.0`.

> 5 — Stub behaviour: Ignores every argument; writes the pointer to stderr,
> nothing to stdout; exits `1`. Rejected: exit 0; honouring `--help`.

> 6 — Stub publish path: Manual `npm publish` by the user from `sunset/`, after
> the new package's first release is live, plus `npm deprecate`.

The user's words: "sunset the `@askviraj/ai-plugins` but not remove it but
replace the installer with a stderr pointing the user to the new package for
installation or anything else".

## Edits

1. **`sunset/package.json`** — exactly these fields, sorted the way
   `sort-package-json` would leave them: `name` `@askviraj/ai-plugins`;
   `version` `7.0.0`; `description` "Sunset. This package moved to
   @virajp.dev/claude-plugins."; `license` and `author` copied from the root;
   `repository` `github:virajp/claude-plugins`; `type` `module`; `bin`
   `{ "ai-plugins": "./ai-plugins.mjs" }`; `files`
   `["ai-plugins.mjs", "readme.md"]`; `engines` `{ "node": ">=18" }`. No
   `private`, no dependencies, no scripts.
2. **`sunset/ai-plugins.mjs`** — `#!/usr/bin/env node` shebang; imports nothing
   but `node:process`; writes this to **stderr** and exits `1` regardless of
   arguments:

   ```text
   @askviraj/ai-plugins has moved to @virajp.dev/claude-plugins.

     pnpx @virajp.dev/claude-plugins --all      # install the plugins
     pnpx @virajp.dev/claude-plugins --help     # everything else

   Repo: https://github.com/virajp/claude-plugins
   This package installs nothing and will not be updated again.
   ```

   File mode executable (`chmod +x`). Nothing on stdout.
3. **`sunset/readme.md`** — a short page, since npmjs.com renders it as the
   package page: the title, one paragraph saying the package moved to
   `@virajp.dev/claude-plugins` at `https://github.com/virajp/claude-plugins`,
   the two `pnpx` lines above in a fenced block, and one sentence that running
   this package only prints that pointer. Follow the repo's documentation style:
   sentence-case headings, fenced code blocks with a language, no emoji.

## Verification

- `node sunset/ai-plugins.mjs --all >/tmp/out 2>/tmp/err; echo $?` prints `1`;
  `/tmp/out` is empty; `/tmp/err` contains `@virajp.dev/claude-plugins` and
  `github.com/virajp/claude-plugins`.
- `cd sunset && npm pack --dry-run` lists exactly `package.json`,
  `ai-plugins.mjs`, `readme.md` and reports the name
  `@askviraj/ai-plugins@7.0.0`.
- `pnpm install --frozen-lockfile` at the root still succeeds — `sunset/` is not
  a workspace member and the lockfile is unchanged.
- `mise run plugins:check` — green (the checker does not walk `sunset/`).

## Guardrails

- Do not add `sunset` to `pnpm-workspace.yaml`, and do not create a lockfile or
  `node_modules` inside it.
- Do not run `npm publish` or `npm deprecate` — those are the user's manual
  steps after landing (index.md, *Post-landing manual sequence*).
- Do not touch `installer/**` or root `package.json`.
- The `readme.md` and `package.json` under `sunset/` will be dprint-formatted by
  pre-commit; that is fine.
- Do not write the `.mjs` through a shell heredoc — `cat` is aliased on this
  machine and the npm-normalize hook rewrites `npm` after a pipe. Use the Write
  tool.

## Commit

`feat(sunset): publishable stub that points @askviraj/ai-plugins at the new package`
— written by the orchestrator after the wave gate, not by the unit.
