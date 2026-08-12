import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  readPluginIndex,
  resolvePlan,
} from "./plan.ts";
import type {
  PluginIndex,
  ResolveOptions,
} from "./plan.ts";

const repoRoot = join(import.meta.dirname, "..", "..");

const index: PluginIndex = {
  marketplace: "test-marketplace",
  defaultInstall: ["core"],
  plugins: [
    {
      name: "core",
      local: true,
      dependencies: ["dep"],
    },
    {
      name: "dep",
      local: true,
      dependencies: ["deep"],
    },
    {
      name: "deep",
      local: true,
      dependencies: [],
    },
    {
      name: "extra",
      local: true,
      dependencies: [],
    },
    {
      name: "remote",
      local: false,
      dependencies: [],
    },
  ],
};

const opts = (over: Partial<ResolveOptions> = {}): ResolveOptions => ({
  expandDependencies: true,
  localOnly: false,
  ...over,
});

describe("resolvePlan", () => {
  it("expands dependencies transitively", () => {
    const plan = resolvePlan(index, "opencode", { user: ["core"] }, opts());

    expect(plan.user).toEqual(["core", "deep", "dep"]);
  });

  it("leaves dependencies alone when the target's CLI expands them", () => {
    // Claude installs its own; naming them would record undos for plugins it
    // manages, and uninstalling one would remove a shared dependency.
    const plan = resolvePlan(
      index,
      "claude",
      { user: ["core"] },
      opts({ expandDependencies: false }),
    );

    expect(plan.user).toEqual(["core"]);
  });

  it("gives a dependency the scope of whatever pulled it in", () => {
    const plan = resolvePlan(index, "opencode", { project: ["core"] }, opts());

    expect(plan.project).toEqual(["core", "deep", "dep"]);
    expect(plan.user).toEqual([]);
  });

  it("--all installs the marketplace's defaultInstall set, at user scope", () => {
    const plan = resolvePlan(index, "opencode", { all: true }, opts());

    // `core` alone is listed; `deep`/`dep` follow as its dependencies.
    expect(plan.user).toEqual(["core", "deep", "dep"]);
    expect(plan.project).toEqual([]);
  });

  it("installs a plugin outside the default set when it is named", () => {
    const plan = resolvePlan(index, "opencode", { user: ["extra"] }, opts());

    expect(plan.user).toEqual(["extra"]);
  });

  it("installs any plugin at project scope on request, pinning nothing", () => {
    const plan = resolvePlan(index, "opencode", { project: ["extra"] }, opts());

    expect(plan.project).toEqual(["extra"]);
    expect(plan.user).toEqual([]);
  });

  it("resolves a name requested at both scopes once, narrowest wins", () => {
    const plan = resolvePlan(
      index,
      "opencode",
      { user: ["deep"], project: ["deep"] },
      opts(),
    );

    expect(plan.project).toEqual(["deep"]);
    expect(plan.user).toEqual([]);
  });

  it("skips a url-sourced plugin for targets that can only copy a bundle", () => {
    const logged: string[] = [];
    const plan = resolvePlan(
      index,
      "opencode",
      { user: ["remote"] },
      opts({ localOnly: true, log: m => void logged.push(m) }),
    );

    expect(plan.user).toEqual([]);
    expect(logged.join("\n")).toMatch(/installs from its own repo/);
  });

  it("reports the skip through onSkip when the caller aggregates", () => {
    const logged: string[] = [];
    const skipped: [string, string][] = [];
    const plan = resolvePlan(
      index,
      "opencode",
      { user: ["remote"] },
      opts({
        localOnly: true,
        log: m => void logged.push(m),
        onSkip: (plugin, target) => void skipped.push([plugin, target]),
      }),
    );

    expect(plan.user).toEqual([]);
    expect(skipped).toEqual([["remote", "opencode"]]);
    // Not both — the caller states it once for every target that skipped it.
    expect(logged).toEqual([]);
  });

  it("rejects an unknown name, so only this marketplace is installable", () => {
    // A qualified name is not a different source — it is simply not a name.
    expect(() =>
      resolvePlan(index, "opencode", { user: ["core@other"] }, opts())
    )
      .toThrow(/unknown plugin/);
  });
});

describe("readPluginIndex", () => {
  it("reads the index the build emits, with the real manifests in it", () => {
    const real = readPluginIndex(repoRoot);

    expect(real.marketplace).toBe("virajp-plugins");
    const vwf = real.plugins.find(p => p.name === "vwf");
    // Declared in templates/vwf/plugin.yaml, and the reason the CLI no longer
    // needs its own copy of the dependency list.
    expect(vwf?.dependencies).toContain("devtools");
    // The `--all` set, from templates/marketplace.yaml.
    expect(real.defaultInstall).toEqual([
      "vwf",
      "devtools",
      "andrej-karpathy-skills",
    ]);
  });
});
