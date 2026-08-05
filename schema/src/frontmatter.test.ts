import {
  globSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import * as fm from "./frontmatter.ts";

describe("parse/emit", () => {
  it("round-trips a minimal document", () => {
    const src = "---\nname: x\n---\nbody\n";
    const doc = fm.parse(src)!;
    expect(doc.entries).toEqual([{ key: "name", raw: " x" }]);
    expect(doc.body).toBe("body\n");
    expect(fm.emit(doc)).toBe(src);
  });

  it("keeps folded scalars verbatim, including odd wrapping", () => {
    const src = "---\ndescription: one\n  —\n  two three\nname: x\n---\n";
    const doc = fm.parse(src)!;
    expect(fm.get(doc, "description")).toBe(" one\n  —\n  two three");
    expect(fm.emit(doc)).toBe(src);
  });

  it("unfolds a folded scalar for the semantic view", () => {
    const doc = fm.parse("---\ndescription: one\n  two\n---\n")!;
    expect(fm.scalar(doc, "description")).toBe("one two");
  });

  it("reads block and flow sequences", () => {
    const block = fm.parse("---\npaths:\n  - \"a/**\"\n  - b\n---\n")!;
    expect(fm.sequence(block, "paths")).toEqual(["a/**", "b"]);
    const flow = fm.parse("---\npaths: [a, 'b c']\n---\n")!;
    expect(fm.sequence(flow, "paths")).toEqual(["a", "b c"]);
  });

  it("returns null when there is no frontmatter", () => {
    expect(fm.parse("# just a heading\n")).toBeNull();
  });

  it("does not treat a `key:` inside the body as frontmatter", () => {
    // github-actions/workflow embeds a GitHub Actions YAML sample containing
    // `name: release` in its body. Only the block before the closing `---`
    // counts.
    const doc = fm.parse(
      "---\nname: workflow\n---\n```yaml\nname: release\n```\n",
    )!;
    expect(doc.entries.map(e => e.key)).toEqual(["name"]);
    expect(doc.body).toContain("name: release");
  });

  it("preserves key order under rename and omit", () => {
    const doc = fm.parse("---\na: 1\nb: 2\nc: 3\n---\n")!;
    const out = fm.omit(fm.rename(doc, "b", "bee"), "c");
    expect(out.entries.map(e => e.key)).toEqual(["a", "bee"]);
  });
});

/**
 * The byte-parity gate in miniature. If `emit(parse(x)) !== x` for any authored
 * file, no renderer can reproduce that file, and the whole templates→dist
 * approach loses its correctness proof. Run it over every real document rather
 * than a fixture, so new authoring styles are caught the day they land.
 */
describe("round-trips every authored document", () => {
  const root = join(import.meta.dirname, "..", "..");
  const files = [
    ...globSync("plugins/**/SKILL.md", { cwd: root }),
    ...globSync("plugins/*/agents/*.md", { cwd: root }),
  ]
    .sort();

  it("finds the documents", () => {
    expect(files.length).toBeGreaterThan(60);
  });

  it.each(files)("%s", relative => {
    const source = readFileSync(join(root, relative), "utf8");
    const doc = fm.parse(source);
    expect(doc, "should have frontmatter").not.toBeNull();
    expect(fm.emit(doc!)).toBe(source);
  });
});
