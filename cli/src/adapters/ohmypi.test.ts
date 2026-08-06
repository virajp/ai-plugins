import {
  existsSync,
  mkdirSync,
  mkdtempSync,
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
import { ohmypi } from "./ohmypi.ts";
import type {
  AdapterContext,
  AdapterPlan,
  Exec,
} from "./types.ts";

/**
 * `exec` is injected, so these run without `omp` installed. The fake maintains
 * the real `marketplaces.json`, because the adapter reads it back to decide
 * whether registration is needed — and `omp` *errors* on a duplicate rather
 * than ignoring it, so getting that guard wrong is a failed install.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let home: string;
let cwd: string;
let context: AdapterContext;
let ran: string[][];
let env: (NodeJS.ProcessEnv | undefined)[];

const registryPath = () => join(home, ".omp", "marketplaces.json");

const fakeOmp: Exec = (command, args, options) => {
  ran.push([command, ...args]);
  env.push(options?.env);
  const [, action, ...rest] = args;

  if (action === "marketplace" && rest[0] === "add") {
    if (existsSync(registryPath())) {
      return { status: 1, stdout: "", stderr: "Marketplace already exists" };
    }
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({
        version: 1,
        marketplaces: [{ name: "virajp-plugins", sourceType: "local" }],
      }),
    );
  }
  else if (action === "marketplace" && rest[0] === "remove") {
    rmSync(registryPath(), { force: true });
  }
  return { status: 0, stdout: "", stderr: "" };
};

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-omp-home-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-omp-cwd-"));
  ran = [];
  env = [];
  context = {
    sourceRoot: repoRoot,
    home,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: fakeOmp,
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

const planFor = (user: string[], project: string[] = []): AdapterPlan => ({
  target: "ohmypi",
  user,
  project,
});

describe("ohmypi adapter", () => {
  it("registers the local marketplace, then installs each plugin", () => {
    ohmypi.apply(context, planFor(["markdown"]));

    expect(ran.map(c => c.join(" "))).toEqual([
      `omp plugin marketplace add ${join(repoRoot, "dist", "ohmypi")}`,
      "omp plugin install markdown@virajp-plugins --scope user",
    ]);
  });

  it("always uses the <name>@<marketplace> form, so --scope is honoured", () => {
    // With a bare name `omp` warns and ignores --scope, installing at the
    // default scope instead — a silently wrong install, not an error.
    ohmypi.apply(context, planFor([], ["markdown"]));

    const install = ran.find(c => c.includes("install"));
    expect(install?.[3]).toBe("markdown@virajp-plugins");
    expect(install?.slice(-2)).toEqual(["--scope", "project"]);
  });

  it("installs both scopes in one run, without redirecting either", () => {
    // Unlike Cursor and Codex, Oh-My-Pi supports both scopes natively.
    ohmypi.apply(context, planFor(["markdown"], ["mise"]));

    const installs = ran.filter(c => c.includes("install")).map(c =>
      c.slice(-3).join(" ")
    );
    expect(installs).toEqual([
      "markdown@virajp-plugins --scope user",
      "mise@virajp-plugins --scope project",
    ]);
  });

  it("points the CLI at the injected HOME and cwd", () => {
    // Otherwise a test — or a project-scoped install — lands in the developer's
    // own ~/.omp.
    ohmypi.apply(context, planFor(["markdown"]));

    expect(env[0]?.["HOME"]).toBe(home);
  });

  it("does not re-register a marketplace that is already configured", () => {
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({ marketplaces: [{ name: "virajp-plugins" }] }),
    );

    ohmypi.apply(context, planFor(["markdown"]));

    // Re-adding is a hard error in omp, so this guard is load-bearing.
    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
  });

  it("runs nothing on a dry run, but describes every command", () => {
    const actions = ohmypi.plan(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
    expect(actions.map(a => a.summary)).toEqual([
      `omp plugin marketplace add ${join(repoRoot, "dist", "ohmypi")}`,
      "omp plugin install markdown@virajp-plugins --scope user",
    ]);
  });

  it("reverts by running the CLI's own removals, in reverse", () => {
    const { receipt } = ohmypi.apply(context, planFor(["markdown"]));
    ran = [];

    ohmypi.revert(context, receipt);

    expect(ran.map(c => c.join(" "))).toEqual([
      "omp plugin uninstall markdown --scope user",
      "omp plugin marketplace remove virajp-plugins",
    ]);
  });

  it("does not remove a marketplace it did not add", () => {
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({ marketplaces: [{ name: "virajp-plugins" }] }),
    );

    const { receipt } = ohmypi.apply(context, planFor(["markdown"]));
    ohmypi.revert(context, receipt);

    expect(existsSync(registryPath())).toBe(true);
  });

  it("fails loudly when the CLI does", () => {
    context = {
      ...context,
      exec: () => ({ status: 1, stdout: "", stderr: "boom" }),
    };

    expect(() => ohmypi.apply(context, planFor(["markdown"])))
      .toThrow(/failed \(1\): boom/);
  });
});
