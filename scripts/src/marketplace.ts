#!/usr/bin/env node
/**
 * Generates `.claude-plugin/marketplace.json` from the 13 plugin manifests.
 *
 * The manifest lives at the **repo root**, not under `plugins/`: it is what
 * Claude Code reads when the marketplace is added from this repo, and every
 * `source` inside it is root-relative. It is also **committed**, so what a user
 * installs is inspectable and diffable in review — which is exactly why this
 * needs a `--check` mode. A generated-and-committed file has no other staleness
 * guarantee; `--check` is the successor to the retired `plugins:render-clean`,
 * narrowed to the one file that is still generated.
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
  out["source"] = `./plugins/${plugin.dir}`;
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
