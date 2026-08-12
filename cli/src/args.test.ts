import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parse,
  renderUsage,
  statuslineFlag,
} from "./args.ts";

describe("repeatable flags", () => {
  it("collects every occurrence, not the last one", () => {
    // The bug this file exists for. citty's `ArgType` has no array kind, so
    // `--user vwf --user devtools` silently resolved to `devtools` alone and
    // installed one plugin where three were asked for.
    const args = parse([
      "--user",
      "vwf",
      "--user",
      "devtools",
      "--user",
      "andrej-karpathy-skills",
    ]);

    expect(args.user).toEqual(["vwf", "devtools", "andrej-karpathy-skills"]);
  });

  it("gives a single occurrence an array too, so callers never branch", () => {
    expect(parse(["--user", "vwf"]).user).toEqual(["vwf"]);
  });

  it("accepts the --flag=value spelling", () => {
    expect(parse(["--user=vwf", "--user=devtools"]).user)
      .toEqual(["vwf", "devtools"]);
  });

  it("repeats --project and --platform the same way", () => {
    const args = parse([
      "--project",
      "flutter",
      "--project",
      "typescript",
      "--platform",
      "claude",
      "--platform",
      "opencode",
    ]);

    expect(args.project).toEqual(["flutter", "typescript"]);
    expect(args.platform).toEqual(["claude", "opencode"]);
  });

  it("defaults each to an empty list rather than undefined", () => {
    const args = parse([]);

    expect(args.user).toEqual([]);
    expect(args.project).toEqual([]);
    expect(args.platform).toEqual([]);
  });

  it("keeps --user and --project apart", () => {
    const args = parse(["--user", "vwf", "--project", "flutter"]);

    expect(args.user).toEqual(["vwf"]);
    expect(args.project).toEqual(["flutter"]);
  });
});

describe("statuslineFlag", () => {
  it("stays undefined when neither is passed, so it can defer to --all", () => {
    expect(statuslineFlag(undefined, undefined)).toBeUndefined();
  });

  it("is true only for an explicit --statusline", () => {
    // Load-bearing twice: it is also the only consent to replace a statusline
    // this installer did not write.
    expect(statuslineFlag(true, undefined)).toBe(true);
  });

  it("is false for --no-statusline", () => {
    expect(statuslineFlag(undefined, true)).toBe(false);
  });

  it("lets refusal win the contradiction", () => {
    // Both at once is a contradiction; refusal is the answer that changes
    // nothing on the machine.
    expect(statuslineFlag(true, true)).toBe(false);
  });

  it("reaches the parsed args as one tri-state", () => {
    expect(parse([]).statusline).toBeUndefined();
    expect(parse(["--statusline"]).statusline).toBe(true);
    expect(parse(["--no-statusline"]).statusline).toBe(false);
  });
});

describe("parse", () => {
  it("settles every boolean, so no consumer sees undefined", () => {
    const args = parse([]);

    expect(args.all).toBe(false);
    expect(args.uninstall).toBe(false);
    expect(args.dryRun).toBe(false);
    expect(args.force).toBe(false);
    expect(args.version).toBe(false);
    expect(args.help).toBe(false);
  });

  it("maps --dry-run onto a camelCase field", () => {
    expect(parse(["--dry-run"]).dryRun).toBe(true);
  });

  it("takes -v and -h short forms", () => {
    expect(parse(["-v"]).version).toBe(true);
    expect(parse(["-h"]).help).toBe(true);
  });

  it("rejects an unknown flag, naming it", () => {
    // citty ignored these silently, so a retired flag looked like it worked.
    expect(() => parse(["--upgrade"])).toThrow(/--upgrade/);
  });

  it("rejects a stray positional", () => {
    // Plugin names are values of `--user`/`--project`; a bare one is a mistake
    // worth naming rather than dropping.
    expect(() => parse(["vwf"])).toThrow();
  });
});

describe("renderUsage", () => {
  it("documents every flag the parser accepts", () => {
    const usage = renderUsage();

    for (
      const flag of [
        "--all",
        "--user",
        "--project",
        "--platform",
        "--statusline",
        "--no-statusline",
        "--uninstall",
        "--dry-run",
        "--force",
        "--version",
        "--help",
      ]
    ) {
      expect(usage, flag).toContain(flag);
    }
  });

  it("marks the three repeatable flags as repeatable", () => {
    const usage = renderUsage();

    expect(usage.match(/\(repeatable\)/g)).toHaveLength(3);
  });

  it("wraps to a readable width", () => {
    for (const line of renderUsage().split("\n")) {
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });
});
