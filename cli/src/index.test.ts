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
  selectAdapters,
  statuslineSelected,
  toList,
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

describe("toList", () => {
  it("normalises citty's three shapes into one", () => {
    // citty documents no `multiple:` kind: repeated flags come back as an
    // array, a single one as a string, an absent one as undefined.
    expect(toList(["a", "b"])).toEqual(["a", "b"]);
    expect(toList("a")).toEqual(["a"]);
    expect(toList(undefined)).toEqual([]);
    expect(toList("")).toEqual([]);
  });
});

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
    expect(jobs[1]?.[1].user).toContain("mempalace");
  });

  it("skips url-sourced plugins only for the copy-based target", () => {
    const jobs = buildJobs(
      [fake("opencode", true), fake("ohmypi", true)],
      { user: ["mempalace"] },
      repoRoot,
      () => {},
    );

    // OpenCode installs by copying a rendered bundle, and a url-sourced plugin
    // has none.
    expect(jobs[0]?.[1].user).toEqual([]);
    expect(jobs[1]?.[1].user).toEqual(["mempalace"]);
  });
});

describe("statuslineSelected", () => {
  const claudeOnly = [fake("claude", true)];
  const openCodeOnly = [fake("opencode", true)];

  it("installs when Claude Code is among the targets", () => {
    expect(statuslineSelected(true, true, claudeOnly, () => {})).toBe(true);
  });

  it("skips a target set without Claude Code", () => {
    // It is a Claude Code feature; there is nothing to install elsewhere.
    expect(statuslineSelected(true, false, openCodeOnly, () => {})).toBe(false);
  });

  it("notes the skip only when the flag was explicit", () => {
    const noted: string[] = [];
    statuslineSelected(true, false, openCodeOnly, m => noted.push(m));
    expect(noted).toEqual([]);

    statuslineSelected(true, true, openCodeOnly, m => noted.push(m));
    expect(noted[0]).toMatch(/Claude Code/);
  });

  it("says nothing at all when it was not wanted", () => {
    const noted: string[] = [];
    expect(statuslineSelected(false, true, claudeOnly, m => noted.push(m)))
      .toBe(false);
    expect(noted).toEqual([]);
  });
});
