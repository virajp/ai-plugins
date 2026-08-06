import {
  describe,
  expect,
  it,
} from "vitest";
import {
  DEP_HINTS,
  missingTools,
  renderMissing,
  requiredTools,
} from "./deps.ts";
import type { PluginIndex } from "./plan.ts";
import { readPluginIndex } from "./plan.ts";

const repoRoot = new URL("../..", import.meta.url).pathname;

const index: PluginIndex = {
  marketplace: "test",
  plugins: [
    {
      name: "a",
      scope: "user",
      optIn: false,
      userOnly: false,
      local: true,
      dependencies: ["b"],
      requires: ["rtk"],
    },
    {
      name: "b",
      scope: "user",
      optIn: false,
      userOnly: false,
      local: true,
      dependencies: [],
      requires: ["pnpm"],
    },
    {
      name: "plain",
      scope: "user",
      optIn: false,
      userOnly: false,
      local: true,
      dependencies: [],
      requires: [],
    },
    {
      name: "legacy",
      scope: "user",
      optIn: false,
      userOnly: false,
      local: true,
      dependencies: [],
    },
  ],
};

describe("requiredTools", () => {
  it("rolls a plugin's dependencies' tools up into its own", () => {
    // The old installer did this by hand — vwf's entry listed context7's pnpm.
    expect(requiredTools(index, ["a"])).toEqual(["pnpm", "rtk"]);
  });

  it("returns nothing for a plugin that needs no external tool", () => {
    expect(requiredTools(index, ["plain"])).toEqual([]);
  });

  it("tolerates an index entry written before `requires` existed", () => {
    expect(requiredTools(index, ["legacy"])).toEqual([]);
  });

  it("terminates on a dependency cycle", () => {
    const cyclic: PluginIndex = {
      marketplace: "test",
      plugins: [
        {
          name: "x",
          scope: "user",
          optIn: false,
          userOnly: false,
          local: true,
          dependencies: ["y"],
          requires: ["mise"],
        },
        {
          name: "y",
          scope: "user",
          optIn: false,
          userOnly: false,
          local: true,
          dependencies: ["x"],
          requires: ["uv"],
        },
      ],
    };

    expect(requiredTools(cyclic, ["x"])).toEqual(["mise", "uv"]);
  });
});

describe("requiredTools against the committed index", () => {
  it("reproduces the installer's hand-rolled vwf tool set", () => {
    // This exact set was `PLUGIN_EXTRA_DEPS.vwf` in bin/claude.mjs, maintained
    // by hand. Deriving it must not quietly lose one.
    expect(requiredTools(readPluginIndex(repoRoot), ["vwf"]))
      .toEqual(["graphify", "mise", "pnpm", "rtk", "uv"]);
  });

  it("reproduces it for typescript and effect too", () => {
    const index = readPluginIndex(repoRoot);

    expect(requiredTools(index, ["typescript"])).toEqual(["mise", "pnpm"]);
    // effect declared no tools of its own; these arrive via typescript.
    expect(requiredTools(index, ["effect"])).toEqual(["mise", "pnpm"]);
  });
});

describe("missingTools", () => {
  it("reports only what is off PATH", () => {
    expect(missingTools(["a", "b"], tool => tool === "a")).toEqual(["b"]);
  });
});

describe("renderMissing", () => {
  it("names each tool and how to install it", () => {
    const text = renderMissing(["graphify", "rtk"]);

    expect(text).toContain("graphify, rtk");
    expect(text).toContain(DEP_HINTS["graphify"] as string);
    expect(text).toContain(DEP_HINTS["rtk"] as string);
  });

  it("still reports a tool it has no hint for", () => {
    // The hints describe this toolchain, not the plugins, so nothing keeps the
    // two lists in sync — an unknown tool must degrade, not vanish.
    const text = renderMissing(["never-heard-of-it"]);

    expect(text).toContain("never-heard-of-it");
    expect(text).toContain("no install hint on record");
  });
});
