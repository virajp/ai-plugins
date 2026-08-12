import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Adapter,
  AdapterContext,
} from "./adapters/types.ts";
import {
  ADAPTERS,
  buildJobs,
  revertsStatusline,
  selectAdapters,
  statuslineSelected,
  wantsStatusline,
} from "./index.ts";

const context = {
  sourceRoot: "/src",
  home: "/home",
  cwd: "/cwd",
  now: "2026-01-01T00:00:00Z",
  log: () => {},
  exec: () => ({ status: 0, stdout: "", stderr: "" }),
} satisfies AdapterContext;

const repoRoot = new URL("../..", import.meta.url).pathname;

function fake(id: string, detected: boolean): Adapter {
  return {
    id: id as Adapter["id"],
    displayName: id,
    scopes: ["user", "project"],
    detect: () => detected,
    configPaths: () => [],
    plan: () => [],
    apply: () => ({
      receipt: { version: 2, installedAt: "", entries: [] },
      actions: [],
    }),
    verify: () => [],
    revert: () => {},
  };
}

describe("wantsStatusline", () => {
  it("defers to --all when the flag is absent", () => {
    // `--all` means the whole toolkit, so it implies the bar.
    expect(wantsStatusline(undefined, true)).toBe(true);
    expect(wantsStatusline(undefined, false)).toBe(false);
  });

  it("lets an explicit flag win either way", () => {
    expect(wantsStatusline(true, false)).toBe(true);
    // --no-statusline refuses it even under --all, which is the whole reason
    // the flag carries no default.
    expect(wantsStatusline(false, true)).toBe(false);
  });
});

describe("selectAdapters", () => {
  it("defaults to every tool actually present", () => {
    const adapters = [fake("claude", true), fake("cursor", false)];

    expect(selectAdapters([], context, adapters).map(a => a.id))
      .toEqual(["claude"]);
  });

  it("takes named platforms regardless of detection", () => {
    // Pairs with the executor's `force`: naming a target is a deliberate act.
    const adapters = [fake("claude", true), fake("cursor", false)];

    expect(selectAdapters(["cursor"], context, adapters).map(a => a.id))
      .toEqual(["cursor"]);
  });

  it("rejects an unknown platform by name", () => {
    expect(() => selectAdapters(["nope"], context, [fake("claude", true)]))
      .toThrow(/unknown platform/);
  });

  it("ships every target", () => {
    expect([...ADAPTERS].map(a => a.id).sort()).toEqual([
      "claude",
      "cursor",
      "ohmypi",
      "opencode",
    ]);
  });
});

describe("buildJobs", () => {
  it("expands dependencies for every target except Claude", () => {
    // Claude's CLI installs its own; expanding here would record undos for
    // plugins it manages.
    const jobs = buildJobs(
      [fake("claude", true), fake("ohmypi", true)],
      { user: ["vwf"] },
      repoRoot,
      () => {},
    );

    expect(jobs[0]?.[1].user).toEqual(["vwf"]);
    expect(jobs[1]?.[1].user).toContain("devtools");
  });

  it("keeps a url-sourced plugin for Claude alone", () => {
    // This test used to assert the opposite for ohmypi, and that is exactly
    // how the bug shipped: `--all` requested andrej-karpathy-skills on every
    // marketplace target, and it failed on two of them. Only Claude's
    // marketplace accepts a `{source: "url"}` entry and fetches it. Cursor's
    // manifest is generated from local plugins only; Oh-My-Pi's takes a URL
    // string, parses it, and then silently drops the entry — `omp plugin
    // discover` listed 13 of 14 with nothing saying why; OpenCode has no
    // marketplace at all and copies a rendered bundle that does not exist.
    const jobs = buildJobs(
      [
        fake("claude", true),
        fake("cursor", true),
        fake("ohmypi", true),
        fake("opencode", true),
      ],
      { user: ["andrej-karpathy-skills"] },
      repoRoot,
      () => {},
    );

    expect(jobs[0]?.[1].user).toEqual(["andrej-karpathy-skills"]);
    for (const job of jobs.slice(1)) {
      expect(job[1].user, job[0].id).toEqual([]);
    }
  });

  it("states a skipped plugin once, naming every target that skipped it", () => {
    // One fact, not three: the same sentence per target reads as three
    // separate problems.
    const notes: string[] = [];
    buildJobs(
      [fake("cursor", true), fake("ohmypi", true), fake("opencode", true)],
      { user: ["andrej-karpathy-skills"] },
      repoRoot,
      message => notes.push(message),
    );

    const skips = notes.filter(n => n.includes("andrej-karpathy-skills"));
    expect(skips).toHaveLength(1);
    expect(skips[0]).toContain("cursor, ohmypi and opencode");
  });
});

describe("statuslineSelected", () => {
  const claudeOnly = [fake("claude", true)];
  const ohmypiOnly = [fake("ohmypi", true)];
  const openCodeOnly = [fake("opencode", true)];
  const cursorOnly = [fake("cursor", true)];

  it("resolves per target: three installs of the same information", () => {
    // A script bar for Claude, `omp config` for Oh-My-Pi, a TUI plugin for
    // OpenCode — so a run targeting all three gets all three.
    expect(statuslineSelected(true, true, claudeOnly, () => {}))
      .toEqual({ claude: true, ohmypi: false, opencode: false });
    expect(statuslineSelected(true, true, ohmypiOnly, () => {}))
      .toEqual({ claude: false, ohmypi: true, opencode: false });
    expect(statuslineSelected(true, true, openCodeOnly, () => {}))
      .toEqual({ claude: false, ohmypi: false, opencode: true });
    expect(
      statuslineSelected(
        true,
        true,
        [...claudeOnly, ...ohmypiOnly, ...openCodeOnly],
        () => {},
      ),
    )
      .toEqual({ claude: true, ohmypi: true, opencode: true });
  });

  it("skips a target set with no status surface at all", () => {
    // Cursor is the last one exposing none, so there is nothing to install.
    expect(statuslineSelected(true, false, cursorOnly, () => {}))
      .toEqual({ claude: false, ohmypi: false, opencode: false });
  });

  it("notes the skip only when the flag was explicit", () => {
    const noted: string[] = [];
    statuslineSelected(true, false, cursorOnly, m => noted.push(m));
    expect(noted).toEqual([]);

    statuslineSelected(true, true, cursorOnly, m => noted.push(m));
    expect(noted[0]).toMatch(/Cursor/);
  });

  it("says nothing when one of the three surfaces is reachable", () => {
    const noted: string[] = [];
    statuslineSelected(true, true, ohmypiOnly, m => noted.push(m));
    expect(noted).toEqual([]);
  });

  it("says nothing at all when it was not wanted", () => {
    const noted: string[] = [];
    expect(statuslineSelected(false, true, claudeOnly, m => noted.push(m)))
      .toEqual({ claude: false, ohmypi: false, opencode: false });
    expect(noted).toEqual([]);
  });
});

describe("revertsStatusline", () => {
  // The install-side default is `--all`; there is no `--all` on the way out, so
  // a plain `--uninstall` used to leave every statusline surface installed.
  it("undoes a surface this tool installed, with no flag given", () => {
    expect(revertsStatusline(true, false, false, () => true)).toBe(true);
  });

  it("leaves a surface alone when nothing installed it", () => {
    expect(revertsStatusline(true, false, false, () => false)).toBe(false);
  });

  it("refuses outright on --no-statusline, receipt or not", () => {
    expect(revertsStatusline(true, true, true, () => true)).toBe(false);
  });

  it("never strips a surface the run does not target", () => {
    // `--uninstall --platform claude` must not remove the Oh-My-Pi bar.
    expect(revertsStatusline(false, true, false, () => true)).toBe(false);
  });

  it("does not consult the receipt when the flag already asked", () => {
    let asked = false;
    revertsStatusline(true, true, false, () => {
      asked = true;
      return false;
    });
    expect(asked).toBe(false);
  });
});
