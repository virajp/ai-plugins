#!/usr/bin/env node
/**
 * Generates `.claude-plugin/marketplace.json` from the 13 plugin manifests.
 *
 * The manifest lives at the **repo root**, not under `plugins/`: it is what
 * Claude Code reads when the marketplace is added from this repo. It is also
 * **committed**, so what a user installs is inspectable and diffable in review —
 * which is exactly why this needs a `--check` mode. A generated-and-committed
 * file has no other staleness guarantee; `--check` is the successor to the
 * retired `plugins:render-clean`, narrowed to the one file that is still
 * generated.
 *
 * Every `source` is a `git-subdir` fetch pinned to a per-plugin tag rather than
 * a `./plugins/<name>` path. A relative source resolves against the marketplace
 * root, so it served whatever the default branch held and no change could be
 * kept back from users; a pinned ref makes a release an explicit act, which is
 * what lets unreleased work live on `develop`. See `ref()` for the tag grammar.
 *
 * The projection stays a pure function of the 7 plugin manifests: the ref is
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
 *   node scripts/src/marketplace.ts            write the manifest
 *   node scripts/src/marketplace.ts --check    fail if the committed file differs
 */
import {
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { readPlugins } from "./plugins.ts";
import type { Plugin } from "./plugins.ts";

/** Where the generated manifest lands, relative to the repo root. */
export const MANIFEST_PATH = ".claude-plugin/marketplace.json";

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

export function buildManifest(plugins: readonly Plugin[]): string {
  return json({ ...HEADER, plugins: plugins.map(entry) });
}

function entry(plugin: Plugin): Record<string, unknown> {
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
  out["source"] = {
    source: "git-subdir",
    url: REPO_URL,
    path: `plugins/${plugin.dir}`,
    ref: ref(plugin),
  };
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
  const target = join(repoRoot, MANIFEST_PATH);
  const generated = buildManifest(readPlugins(join(repoRoot, "plugins")));

  if (process.argv.includes("--check")) {
    const committed = readFileSync(target, "utf8");
    if (committed !== generated) {
      console.error(
        `${MANIFEST_PATH} is not what the plugin manifests generate.\n`,
      );
      console.error(firstDifference(committed, generated));
      console.error(
        `\nRe-run 'mise run plugins:marketplace' and stage the result.`,
      );
      process.exit(1);
    }
    console.log(`${MANIFEST_PATH} is up to date.`);
  }
  else {
    writeFileSync(target, generated);
    console.log(`wrote ${MANIFEST_PATH}`);
  }
}

/**
 * The first line that differs, with its neighbours.
 *
 * A full diff would need a dependency, and this file is one flat list of
 * entries — the first divergence names the plugin whose manifest moved, which is
 * the whole question a failing gate has to answer.
 */
function firstDifference(committed: string, generated: string): string {
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
