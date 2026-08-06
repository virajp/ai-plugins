/**
 * Bundling the installer for publication.
 *
 * `cli/` is the TypeScript source; `bin/` is the built output, and `bin/` is
 * what npm ships. Two things make that split necessary rather than cosmetic:
 *
 * - **`@ai-plugins/schema` is a private workspace package.** It would not
 *   resolve from an installed tarball. Every import of it is `import type`, so
 *   the bundle erases it entirely — but only because something erases it.
 * - **Shipping `cli/src/*.ts` directly would need Node ≥ 22.18** (type stripping
 *   on by default). Bundling keeps `engines.node` where it is, so the CLI still
 *   runs wherever it used to.
 *
 * Runtime dependencies stay external: tsup treats `dependencies` as external by
 * default, and npm installs them beside the bundle. Anything the CLI imports at
 * runtime therefore has to be a real `dependency` in the root `package.json` —
 * a `devDependency` would be silently inlined instead, which works locally and
 * bloats the published bundle.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  // Named, so the output is `bin/ai-plugins.mjs` rather than `bin/index.mjs`.
  entry: { "ai-plugins": "cli/src/index.ts" },
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
