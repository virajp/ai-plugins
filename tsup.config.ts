/**
 * Bundling the installer for publication.
 *
 * `installer/` is the TypeScript source; `bin/` is the built output, and `bin/` is
 * what npm ships. The split is necessary rather than cosmetic: **shipping
 * `installer/src/*.ts` directly would need Node ≥ 22.18** (type stripping on by
 * default), and bundling keeps `engines.node` where it is, so the CLI still runs
 * wherever it used to.
 *
 * It used to carry a second reason — `@ai-plugins/schema` was a private
 * workspace package that would not resolve from an installed tarball, and the
 * bundle erased it because every import of it was `import type`. That package
 * went with the renderer, and `installer/` now imports nothing outside itself and its
 * three runtime dependencies.
 *
 * Runtime dependencies stay external: tsup treats `dependencies` as external by
 * default, and npm installs them beside the bundle. Anything the CLI imports at
 * runtime therefore has to be a real `dependency` in the root `package.json` —
 * a `devDependency` would be silently inlined instead, which works locally and
 * bloats the published bundle.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  // Named, so the output is `bin/installer.mjs` rather than `bin/index.mjs`.
  // The name is the artifact's, not the command's: `package.json`'s `bin` KEY
  // stays `ai-plugins`, which is what users invoke and what npm's Trusted
  // Publisher is bound to.
  entry: { installer: "installer/src/index.ts" },
  outDir: "bin",
  format: ["esm"],
  // Matches `engines.node`. The bundle is what makes that floor holdable.
  target: "node18",
  // `.mjs`, because the root package is `type: commonjs` — the ESM/CJS split
  // here is carried per file extension, not by a package-wide `type`.
  outExtension: () => ({ js: ".mjs" }),
  // The entry's hashbang comes through, and tsup marks the output executable.
  splitting: false,
  sourcemap: false,
  // Safe: `bin/` holds nothing but this build.
  clean: true,
});
