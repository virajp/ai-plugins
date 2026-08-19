import {
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
import type {
  Context,
  ExecResult,
  RunOptions,
} from "./context.ts";
import type { InstallRequest } from "./install.ts";
import {
  executeInstall,
  planInstall,
  pluginsRequested,
  resolveRequest,
} from "./install.ts";

/**
 * Hermetic like the uninstall suite: a temp `CLAUDE_CONFIG_DIR`, a temp cwd
 * standing in for a repo, and a recording fake `Exec` — the planner is asserted
 * against fixture settings files, the executor against what it would have run.
 */
let tmp: string;
let configDir: string;
let repo: string;
let ran: {
  command: string;
  args: readonly string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}[];
let notes: string[];
let context: Context;
let options: RunOptions;
/** Overridden per test to make one command fail. */
let respond: (command: string, args: readonly string[]) => ExecResult;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ai-plugins-install-"));
  configDir = join(tmp, "claude-config");
  repo = join(tmp, "repo");
  for (const dir of [configDir, repo]) {
    mkdirSync(dir, { recursive: true });
  }
  process.env["CLAUDE_CONFIG_DIR"] = configDir;

  ran = [];
  notes = [];
  respond = () => ({ status: 0, stdout: "", stderr: "" });
  context = {
    sourceRoot: join(import.meta.dirname, "..", ".."),
    home: join(tmp, "home"),
    cwd: repo,
    now: "2026-01-01T00:00:00Z",
    log: message => notes.push(message),
    exec: (command, args, execOptions) => {
      ran.push({
        command,
        args,
        ...(execOptions?.cwd === undefined ? {} : { cwd: execOptions.cwd }),
        ...(execOptions?.env === undefined ? {} : { env: execOptions.env }),
      });
      return respond(command, args);
    },
  };
  options = { context, dryRun: false, receiptDir: join(tmp, "receipts") };
});
afterEach(() => {
  delete process.env["CLAUDE_CONFIG_DIR"];
  rmSync(tmp, { recursive: true, force: true });
});

function request(partial: Partial<InstallRequest>): InstallRequest {
  return { all: false, user: [], project: [], ...partial };
}

function writeUserSettings(settings: Record<string, unknown>): void {
  writeFileSync(join(configDir, "settings.json"), JSON.stringify(settings));
}

function writeProjectSettings(settings: Record<string, unknown>): void {
  mkdirSync(join(repo, ".claude"), { recursive: true });
  writeFileSync(
    join(repo, ".claude", "settings.json"),
    JSON.stringify(settings),
  );
}

describe("pluginsRequested", () => {
  it("is false only when nothing named a plugin", () => {
    expect(pluginsRequested(request({}))).toBe(false);
    expect(pluginsRequested(request({ all: true }))).toBe(true);
    expect(pluginsRequested(request({ user: ["vwf"] }))).toBe(true);
    expect(pluginsRequested(request({ project: ["vwf"] }))).toBe(true);
  });
});

describe("resolveRequest", () => {
  it("expands --all to the default set at user scope", () => {
    expect([...resolveRequest(request({ all: true }))]).toEqual([
      ["vwf", "user"],
    ]);
  });

  it("lets project win a name requested at both scopes", () => {
    // The narrower of the two: a project-scope request is the more specific
    // intent, and resolving twice would install the same plugin twice.
    const resolved = resolveRequest(
      request({ user: ["vwf", "typescript"], project: ["vwf"] }),
    );

    expect(resolved.get("vwf")).toBe("project");
    expect(resolved.get("typescript")).toBe("user");
  });

  it("dedupes a repeated name", () => {
    expect(resolveRequest(request({ user: ["vwf", "vwf"] })).size).toBe(1);
  });

  it("throws naming a malformed token", () => {
    expect(() => resolveRequest(request({ user: ["vwf@main"] })))
      .toThrow(/vwf@main/);
    expect(() => resolveRequest(request({ project: ["--statusline"] })))
      .toThrow(/--statusline/);
  });
});

describe("planInstall", () => {
  it("registers the marketplace first on a fresh machine, then installs", () => {
    const steps = planInstall(request({ user: ["vwf", "devtools"] }), options);

    expect(steps.map(s => s.id)).toEqual([
      "marketplace",
      "plugin:user:devtools",
      "plugin:user:vwf",
    ]);
    expect(steps[0]?.args).toEqual([
      "plugin",
      "marketplace",
      "add",
      "virajp/ai-plugins",
    ]);
    expect(steps[2]?.args).toEqual([
      "plugin",
      "install",
      "vwf@virajp-plugins",
      "--scope",
      "user",
    ]);
  });

  it("skips the marketplace step when it is already registered", () => {
    writeUserSettings({ extraKnownMarketplaces: { "virajp-plugins": {} } });

    const steps = planInstall(request({ user: ["vwf"] }), options);

    expect(steps.map(s => s.id)).toEqual(["plugin:user:vwf"]);
  });

  it("reports an installed plugin as already satisfied, never an update", () => {
    writeUserSettings({
      extraKnownMarketplaces: { "virajp-plugins": {} },
      enabledPlugins: { "vwf@virajp-plugins": true },
    });

    const steps = planInstall(request({ user: ["vwf"] }), options);

    expect(steps).toHaveLength(1);
    expect(steps[0]?.kind).toBe("already");
    expect(steps[0]?.note).toContain("claude plugin update");
  });

  it("checks a plugin at the scope it was requested for", () => {
    // A project-scope entry must not satisfy a user-scope request: the two are
    // different files, and Claude resolves them independently.
    writeUserSettings({ extraKnownMarketplaces: { "virajp-plugins": {} } });
    writeProjectSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });

    const steps = planInstall(request({ user: ["vwf"] }), options);

    expect(steps[0]?.kind).toBe("run");
  });

  it("hands project scope the working directory", () => {
    writeUserSettings({ extraKnownMarketplaces: { "virajp-plugins": {} } });

    const steps = planInstall(request({ project: ["vwf"] }), options);

    expect(steps[0]?.args).toEqual([
      "plugin",
      "install",
      "vwf@virajp-plugins",
      "--scope",
      "project",
    ]);
    expect(steps[0]?.cwd).toBe(repo);
  });
});

describe("executeInstall", () => {
  it("drives claude with the pinned config dir", () => {
    const outcomes = executeInstall(
      planInstall(request({ user: ["vwf"] }), options),
      options,
    );

    expect(outcomes.every(o => o.error === undefined)).toBe(true);
    expect(ran.map(r => r.command)).toEqual(["claude", "claude"]);
    expect(ran[0]?.args).toEqual([
      "plugin",
      "marketplace",
      "add",
      "virajp/ai-plugins",
    ]);
    expect(ran[1]?.args).toEqual([
      "plugin",
      "install",
      "vwf@virajp-plugins",
      "--scope",
      "user",
    ]);
    for (const call of ran) {
      expect(call.env?.["CLAUDE_CONFIG_DIR"]).toBe(configDir);
    }
  });

  it("runs project-scope installs from the working directory", () => {
    writeUserSettings({ extraKnownMarketplaces: { "virajp-plugins": {} } });

    executeInstall(
      planInstall(request({ project: ["vwf"] }), options),
      options,
    );

    expect(ran[0]?.cwd).toBe(repo);
  });

  it("never execs under --dry-run, and still describes every command", () => {
    const dryOptions = { ...options, dryRun: true };

    const outcomes = executeInstall(
      planInstall(request({ user: ["vwf"] }), dryOptions),
      dryOptions,
    );

    expect(ran).toHaveLength(0);
    expect(outcomes.map(o => o.actions[0]?.summary)).toEqual([
      "claude plugin marketplace add virajp/ai-plugins",
      "claude plugin install vwf@virajp-plugins --scope user",
    ]);
  });

  it("marks every plugin unattempted when the registration fails", () => {
    respond = (_command, args) =>
      args[1] === "marketplace"
        ? { status: 1, stdout: "", stderr: "no network" }
        : { status: 0, stdout: "", stderr: "" };

    const outcomes = executeInstall(
      planInstall(request({ user: ["vwf", "devtools"] }), options),
      options,
    );

    expect(outcomes[0]?.error).toContain("no network");
    expect(outcomes[1]?.error).toContain("not attempted");
    expect(outcomes[2]?.error).toContain("not attempted");
    // Only the registration ran; installs guaranteed to fail were not tried.
    expect(ran).toHaveLength(1);
  });

  it("keeps plugin failures independent of each other", () => {
    writeUserSettings({ extraKnownMarketplaces: { "virajp-plugins": {} } });
    respond = (_command, args) =>
      args[2] === "devtools@virajp-plugins"
        ? { status: 1, stdout: "", stderr: "unknown plugin" }
        : { status: 0, stdout: "", stderr: "" };

    const outcomes = executeInstall(
      planInstall(request({ user: ["devtools", "vwf"] }), options),
      options,
    );

    expect(outcomes[0]?.error).toContain("unknown plugin");
    expect(outcomes[1]?.error).toBeUndefined();
    expect(ran).toHaveLength(2);
  });

  it("reports an already-installed plugin as success and logs the note", () => {
    writeUserSettings({
      extraKnownMarketplaces: { "virajp-plugins": {} },
      enabledPlugins: { "vwf@virajp-plugins": true },
    });

    const outcomes = executeInstall(
      planInstall(request({ user: ["vwf"] }), options),
      options,
    );

    expect(outcomes).toEqual([{ name: "plugin:user:vwf", actions: [] }]);
    expect(ran).toHaveLength(0);
    expect(notes.join("\n")).toContain("already installed");
  });
});
