import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type {
  Context,
  ExecResult,
} from "./context.ts";
import { setupGraphify } from "./graphify.ts";

let ran: string[][];
let logged: string[];
let context: Context;
/** Overridden per test to make one command fail. */
let respond: (command: string, args: readonly string[]) => ExecResult;

beforeEach(() => {
  ran = [];
  logged = [];
  respond = () => ({ status: 0, stdout: "", stderr: "" });
  context = {
    sourceRoot: "/src",
    home: "/home",
    cwd: "/cwd",
    now: "2026-01-01T00:00:00Z",
    log: (message: string) => {
      logged.push(message);
    },
    exec: (command, args) => {
      ran.push([command, ...args]);
      return respond(command, args);
    },
  };
});

const present = () => true;
const absent = () => false;

describe("setupGraphify", () => {
  it("installs for claude, then the hook", () => {
    // No target list any more: `--platform opencode` went with the OpenCode
    // support, and plugin installs are Claude's own business, so there is
    // nothing left for this to be conditional on.
    setupGraphify(context, present);

    expect(ran).toContainEqual(["graphify", "install", "--platform", "claude"]);
    expect(ran).toContainEqual(["graphify", "hook", "install"]);
  });

  it("soft-skips when graphify is not on PATH, and says so", () => {
    setupGraphify(context, absent);

    expect(ran).toEqual([]);
    // The `requires:` gate used to refuse first; with it gone, an absent
    // graphify is the ordinary case on a machine that only wants the statusline.
    expect(logged.join("\n")).toMatch(/blocking/);
  });

  it("skips only the hook outside a git work tree", () => {
    respond = command =>
      command === "git"
        ? { status: 128, stdout: "", stderr: "not a git repository" }
        : { status: 0, stdout: "", stderr: "" };

    setupGraphify(context, present);

    expect(ran).toContainEqual(["graphify", "install", "--platform", "claude"]);
    expect(ran).not.toContainEqual(["graphify", "hook", "install"]);
    expect(logged.join("\n")).toMatch(/post-commit hook/);
  });

  it("reports a failed install without throwing, and still tries the hook", () => {
    respond = (command, args) =>
      command === "graphify" && args[0] === "install"
        ? { status: 1, stdout: "", stderr: "boom" }
        : { status: 0, stdout: "", stderr: "" };

    expect(() => setupGraphify(context, present)).not.toThrow();
    expect(logged.join("\n")).toContain("boom");
    expect(ran).toContainEqual(["graphify", "hook", "install"]);
  });
});
