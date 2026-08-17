import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  dirname,
  join,
} from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { VersionReport } from "./version.ts";
import {
  buildVersionReport,
  cmpPre,
  cmpVer,
  describeStatusline,
  manifestVersions,
  readInstalledStatusline,
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

/**
 * The statusline's own version, which is the point of this whole block.
 *
 * `--version` used to print the running package's number here and call it
 * "bundled with the CLI" — under `pnpx` that is whatever was just downloaded, so
 * the copy actually installed at `~/.claude/scripts/statusline` was invisible and
 * a stale bar could not be diagnosed at all.
 */
describe("readInstalledStatusline", () => {
  let home: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "ai-plugins-ver-"));
  });
  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
  });

  const install = (): string => {
    const script = join(home, ".claude", "scripts", "statusline");
    mkdirSync(dirname(script), { recursive: true });
    writeFileSync(script, "#!/usr/bin/env node\n");
    return script;
  };

  it("reports nothing installed when the script is not there", () => {
    expect(readInstalledStatusline(home, () => "4.0.0")).toEqual({
      state: "absent",
    });
  });

  it("takes a bare version as the answer", () => {
    install();

    expect(readInstalledStatusline(home, () => "4.3.3\n")).toEqual({
      state: "known",
      version: "4.3.3",
    });
  });

  it("degrades to unknown when the script rendered a bar instead", () => {
    // Exactly what every install predating the flag does: it ignores an
    // unrecognised argument and renders. So the check is on the SHAPE of the
    // answer, never on the exit code, which is 0 either way.
    install();

    const rendered = "\u001b[38;2;69;133;136m ⚡ Claude ";
    expect(readInstalledStatusline(home, () => rendered)).toEqual({
      state: "unknown",
    });
  });

  it("degrades to unknown when the script could not be run at all", () => {
    install();

    expect(readInstalledStatusline(home, () => undefined)).toEqual({
      state: "unknown",
    });
  });

  it("runs the script that the install actually writes", () => {
    // The path comes from `statusline.ts` rather than a second copy: `COMMAND`
    // names it literally in the settings this installer writes, so a divergence
    // would have `--version` report on a file Claude never runs.
    const script = install();
    const seen: string[] = [];
    readInstalledStatusline(home, path => {
      seen.push(path);
      return "1.0.0";
    });

    expect(seen).toEqual([script]);
  });
});

describe("describeStatusline", () => {
  const base = { cli: "4.3.3", statuslineBundled: "4.3.3", plugins: [] };

  it("says nothing is installed, and how to install it", () => {
    expect(
      describeStatusline({ ...base, statuslineInstalled: { state: "absent" } }),
    )
      .toContain("--statusline");
  });

  it("names the version on disk when it is behind", () => {
    const text = describeStatusline({
      ...base,
      statuslineInstalled: { state: "known", version: "4.1.0" },
    });

    expect(text).toContain("4.1.0  →  4.3.3");
  });

  it("confirms a current bar without telling the user to re-run", () => {
    const text = describeStatusline({
      ...base,
      statuslineInstalled: { state: "known", version: "4.3.3" },
    });

    expect(text).toBe("4.3.3  (latest)");
  });

  it("does not call a NEWER installed bar out of date", () => {
    // A maintainer running the CLI from a checkout older than what they last
    // installed. Reporting an update available would send them backwards.
    const text = describeStatusline({
      ...base,
      statuslineInstalled: { state: "known", version: "5.0.0" },
    });

    expect(text).toBe("5.0.0  (latest)");
  });

  it("explains an install too old to answer", () => {
    expect(
      describeStatusline({
        ...base,
        statuslineInstalled: { state: "unknown" },
      }),
    )
      .toContain("predates self-reporting");
  });
});

describe("renderVersionReport", () => {
  const report: VersionReport = {
    cli: "2.7.3",
    cliLatest: "2.8.0",
    statuslineBundled: "2.7.3",
    statuslineInstalled: { state: "known", version: "2.7.0" },
    plugins: [{ name: "vwf", version: "13.1.0" }, { name: "external" }],
  };

  it("flags the CLI itself", () => {
    expect(renderVersionReport(report))
      .toContain("2.7.3  →  2.8.0  (update available)");
  });

  it("reports the statusline installed on disk, not the bundled number", () => {
    expect(renderVersionReport(report)).toContain("2.7.0  →  2.7.3 here");
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
    const text = renderVersionReport({
      cli: "2.7.3",
      statuslineBundled: "2.7.3",
      statuslineInstalled: { state: "absent" },
      plugins: [],
      remoteError: "getaddrinfo ENOTFOUND raw.githubusercontent.com",
    });

    expect(text).toContain("Could not list the plugins on main");
    // The statusline half is still reported: it is read from disk, not network.
    expect(text).toContain("statusline");
  });
});

describe("buildVersionReport", () => {
  it("reads npm and GitHub through separate fetchers", async () => {
    // The separation is the point rather than a convenience: the GitHub call
    // carries `$GITHUB_API_TOKEN` and the npm one must never see it.
    const asked: string[] = [];
    const report = await buildVersionReport({
      sourceRoot: repoRoot,
      home: "/nowhere",
      fetchNpm: async url => {
        asked.push(`npm ${url}`);
        return { version: "99.0.0" } as never;
      },
      fetchGithub: async url => {
        asked.push(`github ${url}`);
        return { plugins: [{ name: "vwf", version: "99.0.0" }] } as never;
      },
      runStatusline: () => undefined,
    });

    expect(asked[0]).toBe(
      "npm https://registry.npmjs.org/@askviraj/ai-plugins/latest",
    );
    expect(asked[1]).toContain("github https://raw.githubusercontent.com/");
    expect(report.cliLatest).toBe("99.0.0");
    expect(report.plugins).toEqual([{ name: "vwf", version: "99.0.0" }]);
    expect(report.remoteError).toBeUndefined();
  });

  it("still reports what is on this machine when the network is gone", async () => {
    const report = await buildVersionReport({
      sourceRoot: repoRoot,
      home: "/nowhere",
      fetchNpm: () => {
        throw new Error("ENOTFOUND");
      },
      fetchGithub: () => {
        throw new Error("ENOTFOUND");
      },
      runStatusline: () => undefined,
    });

    expect(report.remoteError).toBe("ENOTFOUND");
    expect(report.cliLatest).toBeUndefined();
    // Read from this checkout's package.json, so this pins the real wiring.
    expect(report.cli).toMatch(/^\d+\.\d+\.\d+/);
    expect(report.statuslineBundled).toBe(report.cli);
  });
});
