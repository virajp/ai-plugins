/**
 * Generates `plugins/stackgen/stacks/inventory.md` from the stacks tree.
 *
 * The inventory is a projection of three sources and nothing else:
 *
 *   plugins/stackgen/stacks/<type>/<slug>/pack.yaml   one row per pack
 *   plugins/stackgen/stacks/bundles/<slug>.md         one row per bundle
 *   plugins/stackgen/assets/kinds.md                  the closed kind vocabulary
 *
 * It exists because the pack, bundle and kind counts used to be typed into four
 * prose files by hand, and drifted — one said 36 packs while 38 shipped, and the
 * manifest listed nine kinds while eleven were defined. A hand-maintained list
 * would drift the same way with more lines to get wrong. The tree is the only
 * inventory that is true by construction, so this renders the tree.
 *
 * The output is committed on purpose, so a reader (and a user who installed the
 * plugin) gets the table without running anything. That is also the only reason
 * `--check` exists: a generated-and-committed file has no other staleness
 * guarantee. Pre-commit and `plugins.yml` run it, the same as the marketplace
 * manifest.
 *
 * `plugins/**` is excluded from dprint, so the table lands exactly as rendered.
 *
 * Two things fail the generation outright rather than rendering a wrong row: a
 * pack or bundle missing a field the format requires, and a `kind` no heading in
 * `kinds.md` defines — the vocabulary is closed, and an undefined kind is a
 * typo, not a new kind.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { firstDifference } from "./marketplace.ts";
import { frontmatterBlock } from "./plugins.ts";

export const STACKS_DIR = "plugins/stackgen/stacks";
export const BUNDLES_DIR = `${STACKS_DIR}/bundles`;
export const KINDS_PATH = "plugins/stackgen/assets/kinds.md";
export const INVENTORY_PATH = `${STACKS_DIR}/inventory.md`;

export interface Pack {
  readonly type: string;
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly version: string;
  readonly kind: string;
  readonly axis: string;
  readonly category: string;
  readonly capability: string;
}

export interface Bundle {
  readonly slug: string;
  readonly name: string;
  readonly kind: string;
  readonly axis: string;
  readonly components: readonly string[];
  readonly unconditional: boolean;
}

export interface Inventory {
  readonly kinds: readonly string[];
  readonly packs: readonly Pack[];
  readonly bundles: readonly Bundle[];
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function readInventory(repoRoot: string): Inventory {
  const kinds = readKinds(join(repoRoot, KINDS_PATH));
  const packs = readPacks(join(repoRoot, STACKS_DIR));
  const bundles = readBundles(join(repoRoot, BUNDLES_DIR));

  const defined = new Set(kinds);
  for (const pack of packs) {
    assertKind(defined, pack.kind, `${STACKS_DIR}/${pack.type}/${pack.slug}`);
  }
  for (const bundle of bundles) {
    assertKind(defined, bundle.kind, `${BUNDLES_DIR}/${bundle.slug}.md`);
  }

  return { kinds, packs, bundles };
}

/**
 * The kind vocabulary, in definition order.
 *
 * Each kind is a level-two heading of the form ``## `name` — …`` in `kinds.md`.
 * The reserved-kinds and reviewer sections are headings too, but carry no
 * backticked name, so the pattern skips them without a special case.
 */
function readKinds(kindsPath: string): string[] {
  const text = readFileSync(kindsPath, "utf8");
  const kinds: string[] = [];
  for (const line of text.split("\n")) {
    const match = /^## `([a-z-]+)` /.exec(line);
    if (match?.[1]) {
      kinds.push(match[1]);
    }
  }
  if (kinds.length === 0) {
    throw new Error(`${KINDS_PATH} defines no kinds — the heading shape moved`);
  }
  return kinds;
}

/** Every `<type>/<slug>/pack.yaml`, sorted by type then slug. */
function readPacks(stacksDir: string): Pack[] {
  const packs: Pack[] = [];
  for (const type of subdirs(stacksDir)) {
    if (type === "bundles") {
      continue;
    }
    for (const slug of subdirs(join(stacksDir, type))) {
      const path = join(stacksDir, type, slug, "pack.yaml");
      if (!existsSync(path)) {
        continue;
      }
      const rel = `${STACKS_DIR}/${type}/${slug}/pack.yaml`;
      const doc = record(parseYaml(readFileSync(path, "utf8")), rel);
      packs.push({
        type,
        slug,
        name: required(doc, "name", rel),
        summary: required(doc, "summary", rel),
        version: required(doc, "version", rel),
        kind: required(doc, "kind", rel),
        axis: optional(doc, "axis"),
        category: optional(doc, "category"),
        capability: optional(doc, "capability"),
      });
    }
  }
  return packs.sort((a, b) =>
    a.type.localeCompare(b.type) || a.slug.localeCompare(b.slug)
  );
}

/** Every `bundles/<slug>.md` frontmatter, sorted by slug. */
function readBundles(bundlesDir: string): Bundle[] {
  const bundles: Bundle[] = [];
  const files = readdirSync(bundlesDir)
    .filter(f => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    const rel = `${BUNDLES_DIR}/${file}`;
    const block = frontmatterBlock(
      readFileSync(join(bundlesDir, file), "utf8"),
    );
    if (block === null) {
      throw new Error(`${rel} has no frontmatter`);
    }
    const doc = record(parseYaml(block), rel);
    const components = doc["components"];
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error(`${rel} declares no components`);
    }
    bundles.push({
      slug: file.slice(0, -".md".length),
      name: required(doc, "name", rel),
      kind: required(doc, "kind", rel),
      axis: required(doc, "axis", rel),
      components: components.map(String),
      unconditional: doc["unconditional"] === true,
    });
  }
  return bundles;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderInventory(inventory: Inventory): string {
  const { kinds, packs, bundles } = inventory;
  const lines: string[] = [
    "<!-- Generated by scripts/src/inventory.ts — `mise run plugins:inventory`. Do not edit. -->",
    "",
    "# Inventory",
    "",
    "What this tree ships, rendered from the tree itself: every `<type>/<slug>/pack.yaml`",
    "under `stacks/`, every `bundles/<slug>.md` frontmatter, and the kind headings in",
    "`../assets/kinds.md`. The narrative — which wave landed what, and why — is",
    "[`readme.md`](readme.md); the shape of a pack is `../assets/pack-format.md`.",
    "",
    `**${packs.length} packs, ${bundles.length} bundles, ${kinds.length} kinds.**`,
    "",
    "## Kinds",
    "",
    "| Kind | Packs | Bundles |",
    "| ---- | ----: | ------: |",
  ];
  for (const kind of kinds) {
    const p = packs.filter(x => x.kind === kind).length;
    const b = bundles.filter(x => x.kind === kind).length;
    lines.push(`| \`${kind}\` | ${p} | ${b} |`);
  }

  lines.push(
    "",
    "## Packs",
    "",
    "| Component | Name | Kind | Axis | Category | Capability | Version | Summary |",
    "| --------- | ---- | ---- | ---- | -------- | ---------- | ------- | ------- |",
  );
  for (const p of packs) {
    lines.push(row([
      `\`${p.type}/${p.slug}\``,
      p.name,
      `\`${p.kind}\``,
      p.axis,
      p.category,
      p.capability,
      p.version,
      p.summary,
    ]));
  }

  lines.push(
    "",
    "## Bundles",
    "",
    "| Bundle | Name | Kind | Axis | Components | Unconditional |",
    "| ------ | ---- | ---- | ---- | ---------- | ------------- |",
  );
  for (const b of bundles) {
    lines.push(row([
      `\`${b.slug}\``,
      b.name,
      `\`${b.kind}\``,
      b.axis,
      b.components.map(c => `\`${c}\``).join(", "),
      b.unconditional ? "yes" : "",
    ]));
  }

  return `${lines.join("\n")}\n`;
}

/** One table row; a cell's pipes and newlines cannot be allowed to split it. */
function row(cells: readonly string[]): string {
  const safe = cells.map(c =>
    c.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|")
  );
  return `| ${safe.join(" | ")} |`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function subdirs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b));
}

function record(value: unknown, rel: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${rel} is not a YAML mapping`);
  }
  return value as Record<string, unknown>;
}

function required(
  doc: Record<string, unknown>,
  key: string,
  rel: string,
): string {
  const value = doc[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${rel} is missing \`${key}:\``);
  }
  return value.trim();
}

function optional(doc: Record<string, unknown>, key: string): string {
  const value = doc[key];
  return typeof value === "string" ? value.trim() : "";
}

function assertKind(defined: Set<string>, kind: string, rel: string): void {
  if (!defined.has(kind)) {
    throw new Error(
      `${rel} declares kind \`${kind}\`, which ${KINDS_PATH} does not define`,
    );
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const repoRoot = join(import.meta.dirname, "..", "..");
  const generated = renderInventory(readInventory(repoRoot));
  const target = join(repoRoot, INVENTORY_PATH);

  if (process.argv.includes("--check")) {
    const committed = existsSync(target) ? readFileSync(target, "utf8") : "";
    if (committed !== generated) {
      console.error(
        `${INVENTORY_PATH} is not what the stacks tree generates.\n`,
      );
      console.error(firstDifference(committed, generated));
      console.error(
        `\nRe-run 'mise run plugins:inventory' and stage the result.`,
      );
      process.exit(1);
    }
    console.log(`${INVENTORY_PATH} is up to date.`);
  }
  else {
    writeFileSync(target, generated);
    console.log(`wrote ${INVENTORY_PATH}`);
  }
}
