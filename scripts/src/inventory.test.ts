import {
  readdirSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  BUNDLES_DIR,
  INVENTORY_PATH,
  readInventory,
  renderInventory,
  STACKS_DIR,
} from "./inventory.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const inventory = readInventory(repoRoot);
const generated = renderInventory(inventory);

describe("the generated stackgen inventory", () => {
  it("is byte-identical to the committed file", () => {
    // The same assertion `plugins:inventory --check` makes. Pinned here as well
    // as in the task because the task only runs where mise does, and a count
    // typed into prose is exactly the drift this file replaced.
    const committed = readFileSync(join(repoRoot, INVENTORY_PATH), "utf8");
    expect(committed).toBe(generated);
  });

  it("lists every pack.yaml in the tree, and nothing else", () => {
    const stacks = join(repoRoot, STACKS_DIR);
    const onDisk = readdirSync(stacks, { recursive: true, withFileTypes: true })
      .filter(e => e.isFile() && e.name === "pack.yaml")
      .length;
    expect(inventory.packs.length).toBe(onDisk);
    expect(generated).toContain(`**${onDisk} packs, `);
  });

  it("lists every bundle file", () => {
    const onDisk = readdirSync(join(repoRoot, BUNDLES_DIR))
      .filter(f => f.endsWith(".md"))
      .length;
    expect(inventory.bundles.length).toBe(onDisk);
  });

  it("only uses kinds that kinds.md defines", () => {
    // readInventory throws on an undefined kind; this pins the positive side —
    // every kind in the table has at least one pack or bundle, so a kind that
    // is defined but never authored against is visible as a zero row, not
    // silently dropped.
    const used = new Set([
      ...inventory.packs.map(p => p.kind),
      ...inventory.bundles.map(b => b.kind),
    ]);
    for (const kind of used) {
      expect(inventory.kinds).toContain(kind);
    }
    for (const kind of inventory.kinds) {
      expect(generated).toContain(`| \`${kind}\` | `);
    }
  });

  it("keeps a cell's pipes from splitting the row", () => {
    const rendered = renderInventory({
      kinds: ["k"],
      packs: [{
        type: "t",
        slug: "s",
        name: "a | b",
        summary: "line one\n  line two",
        version: "0.1.0",
        kind: "k",
        axis: "",
        category: "",
        capability: "",
      }],
      bundles: [],
    });
    expect(rendered).toContain("| a \\| b |");
    expect(rendered).toContain("| line one line two |");
  });
});
