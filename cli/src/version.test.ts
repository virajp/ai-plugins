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
  it("maps names to versions, keeping unversioned entries", () => {
    const versions = manifestVersions({
      plugins: [{ name: "vwf", version: "13.0.0" }, { name: "external" }],
    });

    expect(versions.get("vwf")).toBe("13.0.0");
    expect(versions.has("external")).toBe(true);
    expect(versions.get("external")).toBeUndefined();
  });
});

describe("renderVersionReport", () => {
  const report: VersionReport = {
    cli: "2.7.3",
    cliLatest: "2.8.0",
    plugins: [
      { name: "vwf", local: "13.0.0", remote: "13.1.0" },
      { name: "markdown", local: "1.0.0", remote: "1.0.0" },
      { name: "external" },
    ],
  };

  it("flags the CLI and each outdated plugin", () => {
    const text = renderVersionReport(report);

    expect(text).toContain("2.7.3  →  2.8.0  (update available)");
    expect(text).toContain("13.0.0  →  13.1.0  (update available)");
    expect(text).toContain("1.0.0  (latest)");
  });

  it("reports the statusline as bundled with the CLI", () => {
    expect(renderVersionReport(report)).toContain("statusline");
  });

  it("names a plugin carrying no version rather than dropping it", () => {
    expect(renderVersionReport(report)).toContain("external");
    expect(renderVersionReport(report)).toContain("unversioned");
  });

  it("marks a plugin this build has but main does not", () => {
    // Otherwise it renders as a bare version beside annotated neighbours, which
    // reads as a failed lookup rather than as the newest thing here.
    const text = renderVersionReport({
      cli: "2.7.3",
      cliLatest: "2.7.3",
      plugins: [{ name: "brand-new", local: "0.1.0" }],
    });

    expect(text).toContain("0.1.0  (not on main yet)");
  });

  it("does not claim that when the remote was never read", () => {
    const text = renderVersionReport({
      cli: "2.7.3",
      plugins: [{ name: "brand-new", local: "0.1.0" }],
      remoteError: "ENOTFOUND",
    });

    expect(text).not.toContain("not on main yet");
  });

  it("explains a missing remote half instead of implying everything is current", () => {
    const text = renderVersionReport({
      cli: "2.7.3",
      plugins: [{ name: "vwf", local: "13.0.0" }],
      remoteError: "getaddrinfo ENOTFOUND registry.npmjs.org",
    });

    expect(text).toContain("Could not check for updates");
    expect(text).not.toContain("latest");
  });
});

describe("buildVersionReport", () => {
  it("reads this checkout and the injected remote", async () => {
    const report = await buildVersionReport(
      repoRoot,
      async url =>
        (url.includes("registry.npmjs.org")
          ? { version: "99.0.0" }
          : { plugins: [{ name: "vwf", version: "99.0.0" }] }) as never,
    );

    expect(report.cliLatest).toBe("99.0.0");
    expect(report.remoteError).toBeUndefined();
    // Read from the committed manifest, so this pins the real wiring.
    const vwf = report.plugins.find(p => p.name === "vwf");
    expect(vwf?.local).toBeDefined();
    expect(vwf?.remote).toBe("99.0.0");
  });

  it("still reports local versions when the network is gone", async () => {
    const report = await buildVersionReport(repoRoot, () => {
      throw new Error("ENOTFOUND");
    });

    expect(report.remoteError).toBe("ENOTFOUND");
    expect(report.cliLatest).toBeUndefined();
    expect(report.plugins.length).toBeGreaterThan(0);
    expect(report.plugins.find(p => p.name === "vwf")?.local).toBeDefined();
  });
});
