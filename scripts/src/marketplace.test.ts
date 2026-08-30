import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  buildManifest,
  MANIFEST_PATH,
} from "./marketplace.ts";
import { readPlugins } from "./plugins.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const plugins = readPlugins(join(repoRoot, "plugins"));
const generated = buildManifest(plugins);
const parsed = JSON.parse(generated) as {
  plugins: Record<string, unknown>[];
  [key: string]: unknown;
};

describe("the generated marketplace manifest", () => {
  it("is byte-identical to the committed file", () => {
    // The same assertion `plugins:marketplace --check` makes, and the reason
    // this generator can exist at all: the manifest is generated AND committed,
    // so nothing else notices when the two diverge. Pinned here as well as in
    // the task, because the task only runs where mise does.
    expect(generated).toBe(readFileSync(join(repoRoot, MANIFEST_PATH), "utf8"));
  });

  it("reads every plugin in the tree", () => {
    expect(parsed.plugins.map(p => p["name"])).toEqual(plugins.map(p => p.dir));
  });

  it("carries the header constants that used to live in marketplace.yaml", () => {
    expect(parsed["name"]).toBe("virajp-plugins");
    expect(parsed["forceRemoveDeletedPlugins"]).toBe(true);
    // Empty, but present: Claude Code reads the key and the committed file has
    // always carried it, so dropping it would be a diff with no author.
    expect(parsed["metadata"]).toEqual({});
    expect(parsed["owner"]).toEqual({ name: "Viraj Patel" });
  });

  it("emits no displayName, which Claude ignores at load time", () => {
    // The renderer emitted it for years. `claude plugin validate` reports it as an
    // unknown field it ignores, and `--strict` — the mode its own help recommends
    // for CI — fails on it. So it named the marketplace to nobody. `name` is what
    // users see. This assertion is what stops it coming back.
    expect(parsed["displayName"]).toBeUndefined();
  });

  it("has no top-level repository", () => {
    // `templates/marketplace.yaml` declared one and the renderer never emitted
    // it. Reinstating it here would change the committed manifest rather than
    // reproduce it.
    expect(parsed["repository"]).toBeUndefined();
  });

  it("points every source at the plugin directory", () => {
    for (const entry of parsed.plugins) {
      expect(entry["source"]).toBe(`./plugins/${entry["name"] as string}`);
    }
  });

  it("stamps category and strict on every entry", () => {
    for (const entry of parsed.plugins) {
      expect(entry["category"], entry["name"] as string).toBe("development");
      expect(entry["strict"], entry["name"] as string).toBe(true);
    }
  });

  it("renames keywords to tags", () => {
    // The one field whose name differs between the two schemas, and the only
    // place the rename is applied — a plugin authoring `tags` in its manifest
    // would silently produce an entry with none.
    for (const plugin of plugins) {
      const entry = parsed.plugins.find(e => e["name"] === plugin.dir);
      expect(entry?.["tags"], plugin.dir).toEqual(plugin.manifest.keywords);
      expect(entry?.["keywords"], plugin.dir).toBeUndefined();
    }
  });

  it("does not copy the MCP or LSP server declarations across", () => {
    // Claude reads both from the installed bundle. A second copy in the
    // marketplace is a copy that drifts, and `design-tools`, `flutter` and
    // `typescript` are the three that would carry one.
    for (const entry of parsed.plugins) {
      expect(entry["mcpServers"], entry["name"] as string).toBeUndefined();
      expect(entry["lspServers"], entry["name"] as string).toBeUndefined();
    }
  });

  it("passes vwf's repository and dependencies through, and nobody else's", () => {
    const vwf = parsed.plugins.find(e => e["name"] === "vwf");
    expect(vwf?.["repository"]).toBe("https://github.com/virajp/ai-plugins");
    expect(vwf?.["dependencies"]).toEqual([
      { marketplace: "virajp-plugins", name: "devtools" },
      { marketplace: "virajp-plugins", name: "stackgen" },
    ]);

    for (const entry of parsed.plugins) {
      if (entry["name"] === "vwf") {
        continue;
      }
      expect(entry["repository"], entry["name"] as string).toBeUndefined();
      expect(entry["dependencies"], entry["name"] as string).toBeUndefined();
    }
  });

  it("sorts every entry's keys, so a field moving is not a diff", () => {
    for (const entry of parsed.plugins) {
      const keys = Object.keys(entry);
      expect(keys, entry["name"] as string).toEqual([...keys].sort());
    }
  });

  it("emits two-space JSON with a trailing newline", () => {
    // What dprint leaves this file as. Emitting anything else means the file is
    // reformatted on the next commit and `--check` fails on a file nobody
    // edited.
    expect(generated.endsWith("}\n")).toBe(true);
    expect(generated).toContain("\n  \"name\": \"virajp-plugins\"");
  });
});
