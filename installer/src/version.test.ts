import {
  describe,
  expect,
  it,
} from "vitest";
import type { VersionReport } from "./version.ts";
import {
  buildVersionReport,
  cmpPre,
  cmpVer,
  manifestVersions,
  renderVersionReport,
  updateNote,
} from "./version.ts";

const repoRoot = new URL("../..", import.meta.url).pathname;

describe("cmpVer", () => {
  it("orders core versions", () => {
    expect(cmpVer("1.2.3", "1.2.0")).toBe(1);
    expect(cmpVer("1.2.0", "1.2.3")).toBe(-1);
    expect(cmpVer("2.0.0", "1.9.9")).toBe(1);
    expect(cmpVer("1.2.0", "1.2.0")).toBe(0);
  });

  it("tolerates a leading v and missing segments", () => {
    expect(cmpVer("v1.2.0", "1.2.0")).toBe(0);
    expect(cmpVer("1.2", "1.2.0")).toBe(0);
    expect(cmpVer("v2.0.0", "1.0.0")).toBe(1);
  });

  it("ranks a release above its prerelease", () => {
    expect(cmpVer("1.2.0", "1.2.0-rc.1")).toBe(1);
    expect(cmpVer("1.2.0-rc.1", "1.2.0")).toBe(-1);
  });

  it("compares two prereleases segment by segment", () => {
    expect(cmpVer("1.2.0-rc.2", "1.2.0-rc.1")).toBe(1);
    expect(cmpVer("1.2.0-rc.1", "1.2.0-rc.1")).toBe(0);
    // A shorter run of segments is smaller.
    expect(cmpVer("1.2.0-rc", "1.2.0-rc.1")).toBe(-1);
  });

  it("does not throw on malformed input", () => {
    // Versions arrive from the network, so a bad one must compare rather than
    // crash. Non-numeric core segments read as 0.
    expect(cmpVer("abc", "1.0.0")).toBe(-1);
    expect(cmpVer("abc", "0.0.0")).toBe(0);
    expect(cmpVer("", "")).toBe(0);
  });
});

describe("cmpPre", () => {
  it("compares numeric segments numerically, others lexically", () => {
    expect(cmpPre("rc.1", "rc.2")).toBe(-1);
    // Numeric, not lexical — the whole reason this is not a string compare.
    expect(cmpPre("rc.10", "rc.2")).toBe(1);
    expect(cmpPre("rc.1", "rc.1")).toBe(0);
    expect(cmpPre("alpha", "beta")).toBe(-1);
    expect(cmpPre("rc", "rc.1")).toBe(-1);
    // Mixed segments fall back to lexical, where "a" > "1".
    expect(cmpPre("a", "1")).toBe(1);
  });
});

describe("updateNote", () => {
  it("flags a newer version and confirms a current one", () => {
    expect(updateNote("1.0.0", "1.1.0")).toContain("update available");
    expect(updateNote("1.1.0", "1.1.0")).toContain("latest");
    // Older remote than local — a dev build ahead of `main` is not an update.
    expect(updateNote("1.2.0", "1.1.0")).toContain("latest");
  });

  it("says nothing when there is nothing to compare against", () => {
    expect(updateNote("1.0.0", undefined)).toBe("");
  });
});

describe("manifestVersions", () => {
  it("keeps every entry, versioned or not, in the manifest's own order", () => {
    expect(
      manifestVersions({
        plugins: [{ name: "vwf", version: "13.0.0" }, { name: "external" }],
      }),
    )
      .toEqual([{ name: "vwf", version: "13.0.0" }, { name: "external" }]);
  });
});

describe("renderVersionReport", () => {
  const report: VersionReport = {
    cli: "2.7.3",
    cliLatest: "2.8.0",
    plugins: [{ name: "vwf", version: "13.1.0" }, { name: "external" }],
  };

  it("flags the CLI itself", () => {
    expect(renderVersionReport(report))
      .toContain("2.7.3  →  2.8.0  (update available)");
  });

  it("lists what main offers, and how to install it", () => {
    const text = renderVersionReport(report);

    expect(text).toContain("Plugins available on main");
    expect(text).toContain("vwf");
    expect(text).toContain("13.1.0");
    // A local-versus-remote diff is not available any more: plugin content left
    // the npm package, so there is no local manifest to compare against.
    expect(text).not.toContain("not on main yet");
    expect(text).toContain("claude plugin install");
  });

  it("names an entry carrying no version rather than dropping it", () => {
    expect(renderVersionReport(report)).toContain("external");
    expect(renderVersionReport(report)).toContain("unversioned");
  });

  it("explains a missing remote half rather than listing nothing", () => {
    // The whole report is the remote half now, so this is also the only path
    // where `plugins` is empty — and `Math.max()` over nothing is `-Infinity`,
    // which `padEnd` throws on. Rendering at all is half the assertion.
    const text = renderVersionReport({
      cli: "2.7.3",
      plugins: [],
      remoteError: "getaddrinfo ENOTFOUND raw.githubusercontent.com",
    });

    expect(text).toContain("Could not list the plugins on main");
    expect(text).toContain("2.7.3");
  });
});

describe("buildVersionReport", () => {
  it("reads npm and GitHub through separate fetchers", async () => {
    // The separation is the point rather than a convenience: the GitHub call
    // carries `$GITHUB_API_TOKEN` and the npm one must never see it.
    const asked: string[] = [];
    const report = await buildVersionReport({
      sourceRoot: repoRoot,
      fetchNpm: async url => {
        asked.push(`npm ${url}`);
        return { version: "99.0.0" } as never;
      },
      fetchGithub: async url => {
        asked.push(`github ${url}`);
        return { plugins: [{ name: "vwf", version: "99.0.0" }] } as never;
      },
    });

    expect(asked[0]).toBe(
      "npm https://registry.npmjs.org/@askviraj/ai-plugins/latest",
    );
    expect(asked[1]).toContain("github https://raw.githubusercontent.com/");
    expect(report.cliLatest).toBe("99.0.0");
    expect(report.plugins).toEqual([{ name: "vwf", version: "99.0.0" }]);
    expect(report.remoteError).toBeUndefined();
  });

  it("still reports this CLI's own version when the network is gone", async () => {
    const report = await buildVersionReport({
      sourceRoot: repoRoot,
      fetchNpm: () => {
        throw new Error("ENOTFOUND");
      },
      fetchGithub: () => {
        throw new Error("ENOTFOUND");
      },
    });

    expect(report.remoteError).toBe("ENOTFOUND");
    expect(report.cliLatest).toBeUndefined();
    expect(report.plugins).toEqual([]);
    // Read from this checkout's package.json, so this pins the real wiring.
    expect(report.cli).toMatch(/^\d+\.\d+\.\d+/);
  });
});
