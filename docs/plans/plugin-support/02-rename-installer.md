# WS2: `bin/ai-plugins.mjs` → `bin/installer.mjs`

After WS1 the CLI does three things — installs plugins, wires graphify, and
uninstalls what the toolkit left. It is an installer, and the build output
should say so.

Small and mechanical, but it touches the publish path, so it ships in the same
release as WS1 and is verified against the built artifact rather than the
source.

## The rename is file-only

The `bin` **key** in `package.json` stays `ai-plugins`. That key is the command
name users invoke, and npm's Trusted Publisher is bound to the package, not the
artifact filename. So `pnpx @askviraj/ai-plugins --all` keeps working unchanged,
`pnpx -p @askviraj/ai-plugins ai-plugins` keeps resolving, and every doc that
names the command stays correct.

```jsonc
// package.json
"bin": { "ai-plugins": "./bin/installer.mjs" }
```

## Edits

- **`tsup.config.ts`** — `entry: { installer: "cli/src/index.ts" }`. The comment
  above it explains why the entry is named rather than defaulted; update the
  filename it cites.
- **`package.json`** — the `bin` map above.
- **`.config/mise/tasks/i/build`** — the `[[ ! -f bin/ai-plugins.mjs ]]` guard
  and the `node bin/ai-plugins.mjs --help` smoke test.
- **`.config/mise/tasks/i/test`** — the `CLI=(node bin/ai-plugins.mjs)` array.
- **`cli/src/index.ts`** — the module header names `bin/ai-plugins.mjs` as the
  built form, and `packageRoot`'s doc comment cites it as the second depth this
  code runs from (the reason it walks up for `package.json` instead of counting
  `..` segments).
- **Docs** — `CLAUDE.md`'s path table, `docs/cli/internals.md`,
  `.claude/skills/installer-cli/references/packaging.md`.

`bin/` is gitignored and tsup runs with `clean: true`, so nothing needs deleting
— the old name disappears on the next build.

## Verification

- `mise run i:build` — tsup emits `bin/installer.mjs`,
  `node bin/installer.mjs
  --help` runs, `pnpm pack --dry-run` lists it.
- `grep -rn "ai-plugins.mjs" --exclude-dir=node_modules .` returns nothing.
- The published tarball still exposes `ai-plugins` as the command: check
  `pnpm pack --dry-run` output names the bin, and confirm against a local
  `npm i -g ./<tarball>` before the release.
