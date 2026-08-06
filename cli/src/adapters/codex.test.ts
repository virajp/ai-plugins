import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { codex } from "./codex.ts";
import type {
  AdapterContext,
  AdapterPlan,
  Exec,
} from "./types.ts";

/**
 * `exec` is injected rather than spawned, so these run without Codex installed
 * — which matters for CI, and mattered here the day the binary vanished from
 * the dev machine mid-session.
 *
 * The fake is not a stub returning 0: it maintains the same `config.toml` the
 * real CLI writes, because every "is this already installed?" guard in the
 * adapter reads that file back. A stub would pass while the guards were wrong.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let home: string;
let cwd: string;
let context: AdapterContext;
let ran: string[][];

const configPath = () => join(home, ".codex", "config.toml");

function readConfig(): string {
  return existsSync(configPath()) ? readFileSync(configPath(), "utf8") : "";
}

/** Mimics `codex plugin …`, maintaining config.toml the way the real CLI does. */
const fakeCodex: Exec = (command, args) => {
  ran.push([command, ...args]);
  const [, action, ...rest] = args;
  let text = readConfig();

  if (action === "marketplace" && rest[0] === "add") {
    if (text.includes("[marketplaces.virajp-plugins]")) {
      return { status: 1, stdout: "", stderr: "already exists" };
    }
    text += `[marketplaces.virajp-plugins]\nsource_type = "local"\n`;
  }
  else if (action === "marketplace" && rest[0] === "remove") {
    text = text.replace(
      /\[marketplaces\.virajp-plugins\]\nsource_type = "local"\n/,
      "",
    );
  }
  else if (action === "add") {
    text += `[plugins."${rest[0]}"]\nenabled = true\n`;
  }
  else if (action === "remove") {
    text = text.replace(
      new RegExp(`\\[plugins\\."${rest[0]}@[^"]+"\\]\nenabled = true\n`),
      "",
    );
  }

  mkdirSync(join(home, ".codex"), { recursive: true });
  writeFileSync(configPath(), text);
  return { status: 0, stdout: "", stderr: "" };
};

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-cx-home-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-cx-cwd-"));
  ran = [];
  // The adapter prefers CODEX_HOME; unset it so `home` is what it uses.
  delete process.env["CODEX_HOME"];
  context = {
    sourceRoot: repoRoot,
    home,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: fakeCodex,
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

const planFor = (user: string[], project: string[] = []): AdapterPlan => ({
  target: "codex",
  user,
  project,
  statusline: false,
});

describe("codex adapter", () => {
  it("registers the local marketplace, then installs each plugin", () => {
    codex.apply(context, planFor(["markdown", "mise"]));

    expect(ran.map(c => c.join(" "))).toEqual([
      `codex plugin marketplace add ${join(repoRoot, "dist", "codex")}`,
      "codex plugin add markdown@virajp-plugins",
      "codex plugin add mise@virajp-plugins",
    ]);
  });

  it("installs from the local dist tree, not over the network", () => {
    codex.apply(context, planFor(["markdown"]));

    const add = ran.find(c => c.includes("marketplace"));
    expect(add?.at(-1)).toBe(join(repoRoot, "dist", "codex"));
    expect(existsSync(join(repoRoot, "dist", "codex"))).toBe(true);
  });

  it("does not re-register a marketplace that is already configured", () => {
    mkdirSync(join(home, ".codex"), { recursive: true });
    writeFileSync(
      configPath(),
      `[marketplaces.virajp-plugins]\nsource_type = "local"\n`,
    );

    codex.apply(context, planFor(["markdown"]));

    // Re-adding is not merely redundant: it would record an undo that removes
    // a marketplace the user configured themselves.
    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
  });

  it("skips a plugin that is already installed", () => {
    codex.apply(context, planFor(["markdown"]));
    ran = [];

    codex.apply(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
  });

  it("redirects a project-scoped request to user scope, and says so", () => {
    const logged: string[] = [];
    codex.apply(
      { ...context, log: message => void logged.push(message) },
      planFor([], ["markdown"]),
    );

    expect(ran.some(c => c.join(" ").endsWith("markdown@virajp-plugins")))
      .toBe(true);
    expect(logged.join("\n")).toMatch(/user scope/);
    // `codex plugin add` has no --scope flag at all.
    expect(ran.flat()).not.toContain("--scope");
  });

  it("runs nothing on a dry run, but describes every command", () => {
    const actions = codex.plan(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
    expect(actions.map(a => a.summary)).toEqual([
      `codex plugin marketplace add ${join(repoRoot, "dist", "codex")}`,
      "codex plugin add markdown@virajp-plugins",
    ]);
  });

  it("reverts by running the CLI's own removals, in reverse", () => {
    const { receipt } = codex.apply(context, planFor(["markdown"]));
    ran = [];

    codex.revert(context, receipt);

    expect(ran.map(c => c.join(" "))).toEqual([
      "codex plugin remove markdown",
      "codex plugin marketplace remove virajp-plugins",
    ]);
    // The CLI owns a cache tree beside this file, so the config going empty is
    // the observable half of a removal it performed itself.
    expect(readConfig()).toBe("");
  });

  it("does not remove a marketplace it did not add", () => {
    mkdirSync(join(home, ".codex"), { recursive: true });
    writeFileSync(
      configPath(),
      `[marketplaces.virajp-plugins]\nsource_type = "local"\n`,
    );

    const { receipt } = codex.apply(context, planFor(["markdown"]));
    codex.revert(context, receipt);

    expect(readConfig()).toContain("[marketplaces.virajp-plugins]");
  });

  it("fails loudly when the CLI does", () => {
    context = {
      ...context,
      exec: () => ({ status: 1, stdout: "", stderr: "boom" }),
    };

    expect(() => codex.apply(context, planFor(["markdown"])))
      .toThrow(/failed \(1\): boom/);
  });
});
