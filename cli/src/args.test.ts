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

describe("statuslineFlag", () => {
  it("stays undefined when neither is passed", () => {
    // It used to defer to `--all` here. With `--all` retired, unset means the
    // run said nothing about the bar — which on an install run is a request for
    // the help text rather than an install.
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

  it("names each flag retired with the plugin installs", () => {
    // The whole point of `strict`. Five flags went at once, and a user with one
    // of them in a script deserves to be told rather than to watch a run do
    // something other than what they asked.
    for (const flag of ["--all", "--user", "--project", "--platform"]) {
      expect(() => parse([flag, "vwf"]), flag).toThrow(new RegExp(flag));
    }
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

  it("documents no flag the parser would reject", () => {
    // The table is the source for both parsing and help, so this is really an
    // assertion that nothing was left in the prose after being removed from
    // `OPTIONS`.
    for (const flag of ["--all", "--user", "--project", "--platform"]) {
      expect(renderUsage().includes(`  ${flag}`), flag).toBe(false);
    }
  });

  it("says how plugins are installed, since this CLI no longer does", () => {
    const usage = renderUsage();

    expect(usage).toContain("claude plugin marketplace add virajp/ai-plugins");
    expect(usage).toContain("claude plugin install vwf@virajp-plugins");
  });

  it("wraps to a readable width", () => {
    for (const line of renderUsage().split("\n")) {
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });
});
