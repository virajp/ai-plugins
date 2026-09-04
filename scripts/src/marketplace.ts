#!/usr/bin/env node
/**
 * Generates the marketplace manifests from the plugin manifests.
 *
 * There are **two**, both projections of the same plugin manifests, differing in
 * exactly one field per entry — `source`:
 *
 * - `.claude-plugin/marketplace.json` — **published**. Every `source` is a
 *   `git-subdir` fetch pinned to a per-plugin tag. This is what users read from
 *   `main`.
 * - `.dev-marketplace/.claude-plugin/marketplace.json` — **local authoring
 *   only**, never published and **gitignored**. Every `source` is a
 *   repo-relative path into `.dev-marketplace/plugins/`, the staged copies of
 *   the authored tree that `plugins:local` writes under `X.Y.Z+N` versions, so
 *   the authoring machine runs the working tree rather than the last release.
 *
 * Both are written and checked together on purpose. A `--dev` flag was the
 * planned shape and is one more thing to forget; a dev manifest that goes stale
 * fails as a plugin quietly serving yesterday's tree, which is the failure this
 * whole file exists to prevent. Only the published one is *committed*, so
 * `--check` treats an absent dev manifest as not applicable and a present-but-
 * stale one as a failure — see `MANIFESTS`.
 *
 * **Both declare the same marketplace `name`.** That is load-bearing rather than
 * sloppy: a plugin's `dependencies` edge names its marketplace by name, so vwf
 * installed from a differently-named dev marketplace would send its `stackgen`
 * edge back to the tagged one and fail on a tag that does not exist yet. The
 * consequence is that a machine registers one or the other, never both.
 *
 * The published manifest lives at the **repo root**, not under `plugins/`: it is
 * what Claude Code reads when the marketplace is added from this repo. It is
 * **committed**, so what users install is inspectable and diffable in review —
 * which is exactly why this needs a `--check` mode. A generated-and-committed
 * file has no other staleness guarantee; `--check` is the successor to the
 * retired `plugins:render-clean`.
 *
 * **The published projection pins a tag; the dev one deliberately does not.** A
 * relative source resolves against the marketplace root, so it serves whatever
 * is *there* rather than a pinned ref. For the published manifest that was the
 * bug — nothing could be held back from users — and the pinned ref is what makes
 * a release an act rather than a merge. For `.dev-marketplace/`, which no user
 * registers, serving whatever is there is the entire point. See `ref()` for the
 * tag grammar and `source()` for the fork.
 *
 * The projection stays a pure function of the plugin manifests: the ref is
 * *derived* from each manifest's `version`, so no git call and no network are
 * needed to generate or to `--check`. That is why `sha` is not emitted, unlike
 * the official marketplace — resolving a tag to a commit is exactly the
 * impurity this avoids. The cost is that a ref can name a tag that does not
 * exist yet, which `plugins.yml` asserts against on the release branch.
 *
 * The projection is one-directional and lossy on purpose. `mcpServers` and
 * `lspServers` live in the plugin manifest and are deliberately NOT copied
 * across: Claude reads them from the installed bundle, and a second copy in the
 * marketplace is a copy that can drift.
 *
 * Usage:
 *   node scripts/src/marketplace.ts            write both manifests
 *   node scripts/src/marketplace.ts --check    fail if either committed file differs
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import { readPlugins } from "./plugins.ts";
import type { Plugin } from "./plugins.ts";

/** Where the published manifest lands, relative to the repo root. */
export const MANIFEST_PATH = ".claude-plugin/marketplace.json";

/** The local authoring marketplace's root, relative to the repo root. */
export const DEV_MARKETPLACE_DIR = ".dev-marketplace";

/** Where the local authoring manifest lands, relative to the repo root. */
export const DEV_MANIFEST_PATH =
  `${DEV_MARKETPLACE_DIR}/.claude-plugin/marketplace.json`;

/**
 * The directory a dev `source` resolves into, relative to `DEV_MARKETPLACE_DIR`.
 *
 * It holds a **staged copy** of each plugin, written by `plugins:local` with the
 * version rewritten to `X.Y.Z+N` — the build number Claude's `update` needs to
 * see a change, kept out of the tracked tree. It has to sit inside the
 * marketplace root because Claude rejects every other way of naming a local
 * tree: an absolute path, a `{source: "directory"|"local", path}` object, and a
 * parent-relative `../plugins/<name>` are all `source: Invalid input`. It has to
 * be a copy rather than a symlink because the version Claude compares is the
 * plugin's own `plugin.json`, not the marketplace entry's — measured both ways.
 */
export const DEV_PLUGINS_DIR = "plugins";

/**
 * Which projection to emit.
 *
 * The only things it varies are each entry's `source` and the header's
 * `description`. Anything else that diverged would make the dev manifest a
 * second source of truth rather than a second view of one.
 */
export type Mode = "published" | "dev";

/**
 * Every manifest this generator owns, in write order.
 *
 * `tracked` is what `--check` keys off. The published manifest is committed, so
 * a divergence is a staleness bug and must fail. `.dev-marketplace/` is
 * **gitignored** — it is the authoring machine's, generated locally, and a
 * second committed file declaring the marketplace name `virajp-plugins` is a
 * footgun on the published branch. So on a fresh clone, and in CI, the dev
 * manifest is legitimately absent: `--check` reports it as not applicable
 * rather than failing. Present but stale is still a failure, because that is a
 * real bug on a machine that uses it.
 */
export const MANIFESTS: readonly {
  mode: Mode;
  path: string;
  tracked: boolean;
}[] = [
  { mode: "published", path: MANIFEST_PATH, tracked: true },
  { mode: "dev", path: DEV_MANIFEST_PATH, tracked: false },
];

/**
 * The marketplace header.
 *
 * These were `templates/marketplace.yaml` until the Claude-first cutover, and
 * they are constants now because that file described a marketplace *and* a
 * default-install list, and only the header half survived — the list is the
 * CLI's, and the header has exactly one consumer. A one-key YAML file read by
 * one generator is a file, not a configuration surface.
 *
 * `repository` is absent on purpose: `marketplace.yaml` carried one and the
 * renderer never emitted it, so adding it here would change the committed
 * manifest rather than reproduce it.
 *
 * **`displayName` is absent, and that is a correction rather than an omission.**
 * The renderer emitted it for years and `claude plugin validate` reports it as an
 * unknown field Claude *ignores at load time* — so it named the marketplace to
 * nobody, and `--strict` (the mode Claude's own help recommends for CI) failed on
 * it. `name` is what users see. Do not restore it without checking `validate`
 * first; that is what `plugins:check` now does.
 */
const HEADER = {
  $schema: "https://json.schemastore.org/claude-code-marketplace.json",
  description: "Opinionated Plugins for Claude Code & Antigravity",
  forceRemoveDeletedPlugins: true,
  metadata: {},
  name: "virajp-plugins",
  owner: { name: "Viraj Patel" },
} as const;

/**
 * The one header field the dev projection overrides.
 *
 * `description` is the only place this can be said. The manifest is strict JSON
 * with a `$schema`, so there is no comment, and `name` is pinned by the
 * dependency-resolution rule above. Anyone who opens the file, or lists the
 * marketplace after adding it, reads this line.
 */
const DEV_DESCRIPTION =
  "LOCAL AUTHORING ONLY — serves this working tree, never published. "
  + "Users read .claude-plugin/marketplace.json from main instead.";

/**
 * Per-entry values every plugin shares.
 *
 * All 13 agreed on both, so neither earns a manifest field — a key that is
 * identical everywhere records nothing and drifts by omission the first time
 * someone forgets it. When a plugin genuinely needs a different `category`,
 * that is the moment to read it from the manifest.
 */
const CATEGORY = "development";
const STRICT = true;

/**
 * The repository every entry is fetched from.
 *
 * `git-subdir` sparse-clones one `path` at one `ref` (`--filter=tree:0`), so an
 * entry names the whole fetch rather than a location inside whatever checkout
 * Claude happens to have. That is the point: a `./plugins/<name>` source
 * resolves against the marketplace root, which means it always served the
 * default branch and there was no way to hold a plugin back from a release.
 */
const REPO_URL = "https://github.com/virajp/ai-plugins.git";

/**
 * The git tag one plugin release is pinned to.
 *
 * Namespaced by plugin name so each plugin releases on its own cadence — an
 * entry's `ref` moves only when that plugin's version bumps, leaving the other
 * six entries byte-identical, so `claude plugin update` sees a change for one
 * plugin alone.
 *
 * The namespace is also what keeps these clear of the installer CLI's tags.
 * GitHub's tag globs match any character but `/`, so a `v*` filter would match
 * `vwf-v19.9.0` — which is why `release.yml` now filters `installer-v*` and
 * every tag in this repo carries a prefix saying what it releases.
 */
function ref(plugin: Plugin): string {
  const version = plugin.manifest.version;
  if (typeof version !== "string" || version === "") {
    // `checkManifest` already rejects this, so reaching it means the generator
    // ran on an unchecked tree. Failing here rather than emitting a
    // ref-less entry is deliberate: `git-subdir` treats a missing `ref` as the
    // default branch, so the bad manifest would produce a *working* entry that
    // silently tracks main — the exact accidental-resolution trap the version
    // field already carries.
    throw new Error(
      `${plugin.dir}: plugin.json declares no version, so there is no tag to `
        + `pin to. Run 'mise run plugins:check'.`,
    );
  }
  return `${plugin.dir}-v${version}`;
}

export function buildManifest(
  plugins: readonly Plugin[],
  mode: Mode = "published",
): string {
  const header = mode === "dev"
    ? { ...HEADER, description: DEV_DESCRIPTION }
    : HEADER;
  return json({ ...header, plugins: plugins.map(p => entry(p, mode)) });
}

/**
 * How one entry names the bytes to install.
 *
 * `git-subdir` sparse-clones one `path` at one `ref`, so a published entry
 * names the whole fetch rather than a location inside whatever checkout Claude
 * happens to have — which is what lets a release be an act rather than a merge.
 *
 * The dev form is the thing that mode deliberately gave up: a repo-relative
 * path resolves against the marketplace root, so it always serves whatever is
 * *there* rather than a pinned ref. For a published manifest that is the bug;
 * for `.dev-marketplace/`, which no user ever registers, it is the entire point.
 */
function source(plugin: Plugin, mode: Mode): unknown {
  if (mode === "dev") {
    return `./${DEV_PLUGINS_DIR}/${plugin.dir}`;
  }
  return {
    source: "git-subdir",
    url: REPO_URL,
    path: `plugins/${plugin.dir}`,
    ref: ref(plugin),
  };
}

function entry(plugin: Plugin, mode: Mode): Record<string, unknown> {
  const m = plugin.manifest;
  const out: Record<string, unknown> = { name: m.name };

  if (m.author !== undefined) {
    out["author"] = m.author;
  }
  out["category"] = CATEGORY;
  if (Array.isArray(m.dependencies) && m.dependencies.length > 0) {
    out["dependencies"] = m.dependencies;
  }
  if (m.description !== undefined) {
    out["description"] = m.description;
  }
  if (m.repository !== undefined) {
    out["repository"] = m.repository;
  }
  // The directory, not the manifest name — the path is what has to resolve.
  // `check.ts` asserts the two agree, so this is not a place to prefer one.
  out["source"] = source(plugin, mode);
  out["strict"] = STRICT;
  if (Array.isArray(m.keywords) && m.keywords.length > 0) {
    out["tags"] = m.keywords;
  }
  if (m.version !== undefined) {
    out["version"] = m.version;
  }

  return sortKeys(out);
}

/**
 * Entry keys are alphabetical; the header's are written in order.
 *
 * The header happens to read alphabetically too, but it is a literal — sorting
 * it would make `plugins` sort into the middle of the file and put a 700-line
 * array between `owner` and nothing.
 */
function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
}

/**
 * Two-space JSON with a trailing newline — what dprint leaves this file as.
 *
 * dprint formats `.claude-plugin/` (it is not in the `excludes` list), so a
 * generator emitting anything else would be reformatted on the next commit and
 * `--check` would fail on a file nobody edited.
 */
function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const repoRoot = join(import.meta.dirname, "..", "..");
  const plugins = readPlugins(join(repoRoot, "plugins"));
  const check = process.argv.includes("--check");

  for (const { mode, path, tracked } of MANIFESTS) {
    const target = join(repoRoot, path);
    const generated = buildManifest(plugins, mode);

    if (check) {
      if (!tracked && !existsSync(target)) {
        console.log(`${path} is absent — not generated on this machine.`);
        continue;
      }
      const committed = readFileSync(target, "utf8");
      if (committed !== generated) {
        console.error(`${path} is not what the plugin manifests generate.\n`);
        console.error(firstDifference(committed, generated));
        console.error(
          `\nRe-run 'mise run plugins:marketplace' and stage the result.`,
        );
        process.exit(1);
      }
      console.log(`${path} is up to date.`);
    }
    else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, generated);
      console.log(`wrote ${path}`);
    }
  }

  if (check) {
    checkDevPluginsDir(repoRoot);
  }
  else {
    writeDevPluginsDir(repoRoot);
  }
}

/**
 * Whether this machine has generated the dev marketplace at all.
 *
 * `.dev-marketplace/` is gitignored, so "absent" is the normal state in CI and
 * in a fresh clone — not a fault. Only a *partial* tree is, which is what the
 * link check below distinguishes.
 */
function devMarketplaceExists(repoRoot: string): boolean {
  return existsSync(join(repoRoot, DEV_MANIFEST_PATH));
}

/**
 * The directory every dev `source` resolves into.
 *
 * `plugins:local` fills it; this only makes sure it is a real directory. Until
 * 2026-09-03 it was a symlink to `../plugins`, which served the working tree
 * but under the tracked version — so `update` never saw an edit. A symlink
 * found here is that retired shape and is replaced, since the staged copies
 * cannot be written through it without rewriting the tracked manifests.
 */
function writeDevPluginsDir(repoRoot: string): void {
  const dir = join(repoRoot, DEV_MARKETPLACE_DIR, DEV_PLUGINS_DIR);
  if (isSymlink(dir)) {
    rmSync(dir);
    console.log(
      `replaced the ${DEV_MARKETPLACE_DIR}/${DEV_PLUGINS_DIR} symlink — run `
        + `'mise run plugins:local' to stage the plugins`,
    );
  }
  mkdirSync(dir, { recursive: true });
}

function checkDevPluginsDir(repoRoot: string): void {
  const rel = `${DEV_MARKETPLACE_DIR}/${DEV_PLUGINS_DIR}`;
  if (!devMarketplaceExists(repoRoot)) {
    console.log(`${rel} is absent — not generated on this machine.`);
    return;
  }
  if (isSymlink(join(repoRoot, DEV_MARKETPLACE_DIR, DEV_PLUGINS_DIR))) {
    console.error(
      `${rel} is a symlink — the retired shape, under which 'claude plugin `
        + `update' never sees an edit.\n\nRe-run 'mise run plugins:marketplace', `
        + `then 'mise run plugins:local'.`,
    );
    process.exit(1);
  }
  console.log(`${rel} is a staging directory.`);
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  }
  catch {
    return false;
  }
}

/**
 * The first line that differs, with its neighbours.
 *
 * A full diff would need a dependency, and this file is one flat list of
 * entries — the first divergence names the plugin whose manifest moved, which is
 * the whole question a failing gate has to answer.
 */
export function firstDifference(committed: string, generated: string): string {
  const a = committed.split("\n");
  const b = generated.split("\n");

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) {
      continue;
    }
    const at = i + 1;
    return [
      `first difference at line ${at}:`,
      `  committed:  ${a[i] ?? "<end of file>"}`,
      `  generated:  ${b[i] ?? "<end of file>"}`,
    ]
      .join("\n");
  }
  // Unreachable while the two strings differ, but a line-wise walk cannot prove
  // that to the type checker and a silent empty message would be worse.
  return "the two differ only in trailing whitespace";
}
