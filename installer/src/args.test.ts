import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parse,
  renderUsage,
} from "./args.ts";

describe("parse", () => {
  it("settles every value, so no consumer sees undefined", () => {
    const args = parse([]);

    expect(args.all).toBe(false);
    expect(args.user).toEqual([]);
    expect(args.project).toEqual([]);
    expect(args.uninstall).toBe(false);
    expect(args.statusline).toBe(false);
    expect(args.dryRun).toBe(false);
    expect(args.version).toBe(false);
    expect(args.help).toBe(false);
  });

  it("keeps every occurrence of a repeated flag", () => {
    // The citty regression this parser exists to prevent: its ArgType had no
    // array kind, so `--user vwf --user stackgen` installed only `stackgen`
    // and said nothing about the name it dropped.
    expect(parse(["--user", "vwf", "--user", "stackgen"]).user)
      .toEqual(["vwf", "stackgen"]);
    expect(parse(["--project", "vwf", "--project", "typescript"]).project)
      .toEqual(["vwf", "typescript"]);
  });

  it("parses --all and the two scoped flags together", () => {
    const args = parse(["--all", "--user", "typescript", "--project", "gcp"]);

    expect(args.all).toBe(true);
    expect(args.user).toEqual(["typescript"]);
    expect(args.project).toEqual(["gcp"]);
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

  it("names each retired flag", () => {
    // The whole point of `strict`: a user with a retired flag in a script
    // deserves to be told rather than to watch a run do something other than
    // what they asked.
    for (
      const flag of [
        "--platform",
        "--upgrade",
        "--force",
      ]
    ) {
      expect(() => parse([flag, "claude"]), flag).toThrow(new RegExp(flag));
    }
  });

  it("accepts --statusline rather than retiring it", () => {
    // A user who has not heard the statusline moved will reach for this flag,
    // and `strict` would answer them with "unknown option" and nowhere to go.
    // It parses so the run can point them at the package that has it now.
    expect(parse(["--statusline"]).statusline).toBe(true);
  });

  it("parses --statusline alongside a real install", () => {
    // The combination is the whole reason it is not a short-circuit: these
    // plugins still get installed, and the statusline notice prints after.
    const args = parse(["--all", "--statusline"]);

    expect(args.all).toBe(true);
    expect(args.statusline).toBe(true);
  });

  it("rejects a stray positional", () => {
    // There is nothing left to name on the command line: a bare word is a
    // mistake worth reporting rather than dropping.
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
        "--uninstall",
        "--statusline",
        "--dry-run",
        "--version",
        "--help",
      ]
    ) {
      expect(usage, flag).toContain(flag);
    }
  });

  it("documents no flag the parser would reject", () => {
    // The table is the source for both parsing and help, so this is really an
    // assertion that nothing was left in the prose after being removed from
    // `OPTIONS`.
    for (
      const flag of [
        "--platform",
        "--upgrade",
        "--force",
      ]
    ) {
      expect(renderUsage().includes(`  ${flag}`), flag).toBe(false);
    }
  });

  it("names the claude commands the install drives", () => {
    const usage = renderUsage();

    expect(usage).toContain(
      "claude plugin marketplace add virajp/claude-plugins",
    );
    expect(usage).toContain("claude plugin install vwf@virajp-plugins");
  });

  it("wraps to a readable width", () => {
    for (const line of renderUsage().split("\n")) {
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });
});
