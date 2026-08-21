import {
  describe,
  expect,
  it,
} from "vitest";
import {
  appendToJsonArray,
  hasComments as jsonHasComments,
  readJsonc,
  removeFromJsonArray,
  setJsonPath,
} from "./json.ts";
/**
 * These files belong to the user, not to us. Every assertion here is really the
 * same one: an edit must disturb what it names and nothing else — comments,
 * key order, quoting and indentation all survive, because the alternative is
 * silently rewriting somebody's hand-maintained config.
 *
 * The fixture keeps a `statusLine` key even though this CLI installs no
 * statusline: it is Claude Code's own key, and it is the exact `configKey` a
 * v5.2.0 receipt names. Restoring that key byte-for-byte is what `--uninstall`
 * still has to do on an upgrading machine, so it is the right thing to be
 * pinning here rather than a made-up one.
 */

describe("jsonc", () => {
  const source = `{
  // The user's own comment, which a rewrite would drop.
  "theme": "dark",
  "statusLine": {
    "type": "command",
    "command": "~/.claude/scripts/statusline"
  },
  "env": { "EXISTING": "untouched" }
}
`;

  it("preserves comments, key order and foreign keys through an edit", () => {
    const out = setJsonPath(source, ["env", "AI_PLUGINS_USAGE_DIR"], "/tmp/u");

    expect(out).toContain("// The user's own comment");
    expect(out).toContain("\"EXISTING\": \"untouched\"");
    // Key order is positional, not alphabetical: `theme` still leads.
    expect(out.indexOf("\"theme\"")).toBeLessThan(
      out.indexOf("\"statusLine\""),
    );

    const parsed = readJsonc<Record<string, any>>(out);
    expect(parsed?.env.AI_PLUGINS_USAGE_DIR).toBe("/tmp/u");
    expect(parsed?.env.EXISTING).toBe("untouched");
  });

  it("removes a key without touching its neighbours", () => {
    const out = setJsonPath(source, ["statusLine"], undefined);
    expect(readJsonc<Record<string, any>>(out)?.statusLine).toBeUndefined();
    expect(out).toContain("// The user's own comment");
    expect(out).toContain("\"theme\": \"dark\"");
  });

  it("appends to an array idempotently, keeping foreign entries", () => {
    const text = `{ "skills": { "paths": ["~/mine"] } }`;
    const once = appendToJsonArray(text, ["skills", "paths"], ["~/ours"]);
    const twice = appendToJsonArray(once, ["skills", "paths"], ["~/ours"]);

    expect(readJsonc<any>(once).skills.paths).toEqual(["~/mine", "~/ours"]);
    // A second install must be a no-op, byte for byte.
    expect(twice).toBe(once);
  });

  it("removes only our own array entries", () => {
    const text = `{ "skills": { "paths": ["~/mine", "~/ours"] } }`;
    const out = removeFromJsonArray(text, ["skills", "paths"], ["~/ours"]);
    expect(readJsonc<any>(out).skills.paths).toEqual(["~/mine"]);
  });

  it("is byte-identical after adding a key and removing it again", () => {
    // This is the uninstall guarantee, and it is subtler than it looks: passing
    // `formattingOptions` makes `modify` run a formatting pass that expands a
    // *neighbouring* inline object — touching only `statusLine` was enough to
    // reflow `"env": { … }` onto four lines. Omitting the options keeps the
    // edit a minimal splice. Do not "tidy up" by reinstating a default here.
    const added = setJsonPath(source, ["subagentStatusLine"], {
      type: "command",
    });
    expect(added).not.toBe(source);
    expect(setJsonPath(added, ["subagentStatusLine"], undefined)).toBe(source);
  });

  it("still formats sensibly when creating a document from nothing", () => {
    // The one case with no existing formatting to preserve.
    const out = setJsonPath("", ["mcp", "context7"], { command: "pnpm" });
    expect(readJsonc<any>(out).mcp.context7.command).toBe("pnpm");
    expect(out).toContain("\n");
  });

  it("detects comments, so a lossy rewrite can be confirmed first", () => {
    expect(jsonHasComments(source)).toBe(true);
    expect(jsonHasComments(`{ "a": 1 }`)).toBe(false);
  });

  it("treats a malformed document as absent rather than throwing", () => {
    expect(readJsonc("{ this is not json")).toBeUndefined();
  });
});
