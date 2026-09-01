import {
  readFileSync,
  readlinkSync,
} from "node:fs";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  buildManifest,
  DEV_MANIFEST_PATH,
  DEV_MARKETPLACE_DIR,
  DEV_PLUGINS_LINK,
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

const generatedDev = buildManifest(plugins, "dev");
const parsedDev = JSON.parse(generatedDev) as {
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

  it("fetches every plugin by git-subdir at a per-plugin tag", () => {
    // Not `./plugins/<name>`: a relative source resolves against the
    // marketplace root, so it always served the default branch and nothing
    // could be held back from a release. The pinned ref is what makes
    // releasing an act rather than a merge.
    for (const entry of parsed.plugins) {
      const name = entry["name"] as string;
      expect(entry["source"], name).toEqual({
        source: "git-subdir",
        url: "https://github.com/virajp/ai-plugins.git",
        path: `plugins/${name}`,
        ref: expect.any(String) as unknown,
      });
    }
  });

  it("derives each ref from the manifest version, so the generator stays pure", () => {
    // The whole reason no `sha` is emitted: resolving a tag to a commit would
    // need git, and `--check` has to work offline and in a fresh clone.
    for (const plugin of plugins) {
      const entry = parsed.plugins.find(e => e["name"] === plugin.dir);
      const source = entry?.["source"] as { ref?: string; };
      expect(source.ref, plugin.dir).toBe(
        `${plugin.dir}-v${plugin.manifest.version as string}`,
      );
    }
  });

  it("gives every ref a namespace, so none can match the installer's tags", () => {
    // GitHub tag globs match any character but `/`, so `release.yml`'s old
    // `v*` filter matched `vwf-v19.9.0` and fired the npm publish on a plugin
    // release. Both tag families are prefixed now; this is what keeps them so.
    for (const entry of parsed.plugins) {
      const ref = (entry["source"] as { ref: string; }).ref;
      expect(ref, entry["name"] as string).toMatch(
        /^[a-z][a-z0-9-]*-v\d+\.\d+\.\d+/,
      );
      expect(ref.startsWith("installer-v"), ref).toBe(false);
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

  it("defaults to the published projection", () => {
    // The default matters: every existing caller passes no mode, and a default
    // that flipped would publish local paths to users.
    expect(buildManifest(plugins)).toBe(buildManifest(plugins, "published"));
  });

  it("emits two-space JSON with a trailing newline", () => {
    // What dprint leaves this file as. Emitting anything else means the file is
    // reformatted on the next commit and `--check` fails on a file nobody
    // edited.
    expect(generated.endsWith("}\n")).toBe(true);
    expect(generated).toContain("\n  \"name\": \"virajp-plugins\"");
  });
});

describe("the local authoring manifest", () => {
  it("is byte-identical to the committed file", () => {
    expect(generatedDev).toBe(
      readFileSync(join(repoRoot, DEV_MANIFEST_PATH), "utf8"),
    );
  });

  it("resolves through the committed symlink", () => {
    // Every dev `source` is `./plugins/<name>`, which resolves against the
    // marketplace root. Without this link that is a path to nothing, and Claude
    // reports it as a plugin that simply is not there rather than as an error.
    expect(
      readlinkSync(join(repoRoot, DEV_MARKETPLACE_DIR, DEV_PLUGINS_LINK)),
    )
      .toBe("../plugins");
  });

  it("differs from the published manifest in `source` and nothing else", () => {
    // The one assertion that keeps this a second *view* rather than a second
    // source of truth. Strip `source` from both and they must be equal — so a
    // field added to one projection and forgotten in the other fails here.
    const strip = (entries: Record<string, unknown>[]) =>
      entries.map(({ source: _source, ...rest }) => rest);

    expect(strip(parsedDev.plugins)).toEqual(strip(parsed.plugins));
  });

  it("names every plugin by a repo-relative path, never a tag or an absolute one", () => {
    // Probed against the real CLI: an absolute path, a `{source: "directory"}`
    // or `{source: "local"}` object, and a parent-relative `../plugins/<name>`
    // are each rejected with `source: Invalid input`. A repo-relative path that
    // stays inside the marketplace root is the only form Claude accepts.
    for (const entry of parsedDev.plugins) {
      const source = entry["source"];
      expect(source, entry["name"] as string).toBe(
        `./${DEV_PLUGINS_LINK}/${entry["name"] as string}`,
      );
      expect(typeof source).toBe("string");
      expect(source as string).not.toContain("..");
      expect((source as string).startsWith("/")).toBe(false);
    }
  });

  it("declares the same marketplace name as the published one", () => {
    // Load-bearing. A plugin's `dependencies` edge names its marketplace by
    // name, so vwf installed from a differently-named dev marketplace would
    // send its `stackgen` edge back to the tagged marketplace and fail on a tag
    // that does not exist yet. Verified by real install: same name resolves the
    // dependency, and `+ 1 dependency: stackgen` is what proves it.
    expect(parsedDev["name"]).toBe(parsed["name"]);
  });

  it("says in its description that it is never published", () => {
    // The only place it can be said: the manifest is strict JSON with a
    // `$schema`, so there is no comment, and `name` is pinned by the rule above.
    expect(parsedDev["description"]).toMatch(/LOCAL AUTHORING ONLY/);
    expect(parsedDev["description"]).not.toBe(parsed["description"]);
  });

  it("is not the file users read", () => {
    // Cheap guard against the two paths ever being conflated in a refactor.
    expect(DEV_MANIFEST_PATH).not.toBe(MANIFEST_PATH);
    expect(DEV_MANIFEST_PATH.startsWith(DEV_MARKETPLACE_DIR)).toBe(true);
  });
});
