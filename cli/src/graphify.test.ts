import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type {
  AdapterContext,
  ExecResult,
} from "./adapters/types.ts";
import { setupGraphify } from "./graphify.ts";

let ran: string[][];
let logged: string[];
let context: AdapterContext;
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
    log: message => {
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
  it("installs for each supported target, then the hook", () => {
    setupGraphify(context, ["claude", "opencode"], present);

    expect(ran).toContainEqual(["graphify", "install", "--platform", "claude"]);
    expect(ran).toContainEqual([
      "graphify",
      "install",
      "--platform",
      "opencode",
    ]);
    expect(ran).toContainEqual(["graphify", "hook", "install"]);
  });

  it("does nothing for targets graphify does not support", () => {
    // Codex, Cursor and Oh-My-Pi are not graphify platforms.
    setupGraphify(context, ["codex", "cursor", "ohmypi"], present);

    expect(ran).toEqual([]);
  });

  it("soft-skips when graphify is not on PATH, and says so", () => {
    setupGraphify(context, ["claude"], absent);

    expect(ran).toEqual([]);
    // The dependency gate normally refuses first, so reaching here means it was
    // bypassed — failing the run would undo an install that already succeeded.
    expect(logged.join("\n")).toMatch(/blocking/);
  });

  it("skips only the hook outside a git work tree", () => {
    respond = command =>
      command === "git"
        ? { status: 128, stdout: "", stderr: "not a git repository" }
        : { status: 0, stdout: "", stderr: "" };

    setupGraphify(context, ["claude"], present);

    expect(ran).toContainEqual(["graphify", "install", "--platform", "claude"]);
    expect(ran).not.toContainEqual(["graphify", "hook", "install"]);
    expect(logged.join("\n")).toMatch(/post-commit hook/);
  });

  it("reports a failed install without throwing", () => {
    respond = (command, args) =>
      command === "graphify" && args[0] === "install"
        ? { status: 1, stdout: "", stderr: "boom" }
        : { status: 0, stdout: "", stderr: "" };

    expect(() => setupGraphify(context, ["claude"], present)).not.toThrow();
    expect(logged.join("\n")).toContain("boom");
  });
});
