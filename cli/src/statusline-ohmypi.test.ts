import {
  existsSync,
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
import { execCommand } from "./adapters/support.ts";
import type {
  AdapterContext,
  Exec,
} from "./adapters/types.ts";
import { executeStatuslineOhmypi } from "./executor.ts";
import {
  installStatuslineOhmypi,
  planStatuslineOhmypi,
  revertStatuslineOhmypi,
} from "./statusline-ohmypi.ts";

/**
 * Two layers, deliberately.
 *
 * Most of these run against a fake `omp` so they work without it installed and
 * pin the exact commands. The round-trip suite drives the **real** binary,
 * because the property it proves — uninstall leaves the config as it found it —
 * depends on how Oh-My-Pi's own writer behaves, which a fake would only assert
 * about itself.
 *
 * **Every test sets `PI_CODING_AGENT_DIR`**, which redirects `omp`'s config
 * wholesale. Without it a real-binary test writes the developer's own `~/.omp`.
 */
let agentDir: string;
let home: string;
let ran: string[][];
let context: AdapterContext;

/** What `omp config get` reports for a key nobody has set. */
const DEFAULTS: Record<string, string> = {
  "statusLine.preset": "default",
  "statusLine.leftSegments": "[]",
  "statusLine.rightSegments": "[]",
  "statusLine.segmentOptions": "{}",
};

/** Enough of `omp config` to exercise the read-then-set-then-undo shape. */
function fakeOmp(store: Record<string, string> = {}): Exec {
  return (command, args) => {
    ran.push([command, ...args]);
    const [, action, key, value] = args;
    if (action === "path") {
      return { status: 0, stdout: `${agentDir}\n`, stderr: "" };
    }
    if (action === "get") {
      const current = store[key ?? ""] ?? DEFAULTS[key ?? ""];
      return current === undefined
        ? { status: 1, stdout: "", stderr: `Unknown setting: ${key}` }
        : { status: 0, stdout: `${current}\n`, stderr: "" };
    }
    store[key ?? ""] = value ?? "";
    return { status: 0, stdout: "", stderr: "" };
  };
}

beforeEach(() => {
  agentDir = mkdtempSync(join(tmpdir(), "ai-plugins-omp-sl-agent-"));
  home = mkdtempSync(join(tmpdir(), "ai-plugins-omp-sl-home-"));
  ran = [];
  process.env["PI_CODING_AGENT_DIR"] = agentDir;
  context = {
    sourceRoot: join(import.meta.dirname, "..", ".."),
    home,
    cwd: home,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: fakeOmp(),
  };
});
afterEach(() => {
  delete process.env["PI_CODING_AGENT_DIR"];
  rmSync(agentDir, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

const configFile = () => join(agentDir, "config.yml");
const sets = () => ran.filter(c => c[1] === "config" && c[2] === "set");

describe("ohmypi statusline install", () => {
  it("sets the four keys, with the values that mirror the Claude bar", () => {
    installStatuslineOhmypi(context);

    expect(sets().map(c => c.slice(3).join(" "))).toEqual([
      "statusLine.preset custom",
      "statusLine.leftSegments [\"model\",\"path\",\"git\"]",
      "statusLine.rightSegments "
      + "[\"context_pct\",\"usage\",\"cost\",\"time_spent\"]",
      "statusLine.segmentOptions "
      + "{\"model\":{\"showThinkingLevel\":true},"
      + "\"path\":{\"abbreviate\":true,\"maxLength\":40,\"stripWorkPrefix\":true},"
      + "\"git\":{\"showBranch\":true,\"showStaged\":true,\"showUnstaged\":true,"
      + "\"showUntracked\":true}}",
    ]);
  });

  it("records an undo per key, restoring the value it read", () => {
    const { receipt } = installStatuslineOhmypi(context);

    const undos = receipt.entries.flatMap(e =>
      e.kind === "command" ? [e.undo.join(" ")] : []
    );
    expect(undos).toEqual([
      "config set statusLine.preset default",
      "config set statusLine.leftSegments []",
      "config set statusLine.rightSegments []",
      "config set statusLine.segmentOptions {}",
    ]);
  });

  it("records no undo for a value that was already what we want", () => {
    // Re-setting an identical value changes nothing, so an undo for it would
    // put back a choice the user had made themselves.
    context = { ...context, exec: fakeOmp({ "statusLine.preset": "custom" }) };

    const { receipt } = installStatuslineOhmypi(context);

    expect(sets().map(c => c[3])).not.toContain("statusLine.preset");
    expect(receipt.entries.filter(e => e.kind === "command")).toHaveLength(3);
  });

  it("files the config it caused omp to create, so revert removes it", () => {
    // `omp config reset` writes the default back rather than removing the key,
    // so undoing key by key would leave a config.yml where there was none.
    const { receipt } = installStatuslineOhmypi(context);

    expect(receipt.entries[0]).toEqual({
      kind: "file",
      path: configFile(),
    });
  });

  it("does not file a config.yml that already existed", () => {
    writeFileSync(configFile(), "appearance: \n  theme.dark: titanium\n");

    const { receipt } = installStatuslineOhmypi(context);

    expect(receipt.entries.some(e => e.kind === "file")).toBe(false);
  });

  it("points omp at the injected HOME", () => {
    let seen: NodeJS.ProcessEnv | undefined;
    context = {
      ...context,
      exec: (command, args, options) => {
        seen = options?.env;
        return fakeOmp()(command, args, options);
      },
    };

    installStatuslineOhmypi(context);

    expect(seen?.["HOME"]).toBe(home);
  });

  it("fails loudly when the CLI does", () => {
    context = {
      ...context,
      exec: () => ({ status: 1, stdout: "", stderr: "boom" }),
    };

    expect(() => installStatuslineOhmypi(context))
      .toThrow(/failed \(1\): boom/);
  });

  it("runs nothing on a dry run, but describes every command", () => {
    const actions = planStatuslineOhmypi(context);

    expect(sets()).toEqual([]);
    expect(existsSync(configFile())).toBe(false);
    expect(actions.map(a => a.summary)).toEqual([
      "omp config set statusLine.preset custom",
      "omp config set statusLine.leftSegments [\"model\",\"path\",\"git\"]",
      "omp config set statusLine.rightSegments "
      + "[\"context_pct\",\"usage\",\"cost\",\"time_spent\"]",
      "omp config set statusLine.segmentOptions "
      + "{\"model\":{\"showThinkingLevel\":true},"
      + "\"path\":{\"abbreviate\":true,\"maxLength\":40,\"stripWorkPrefix\":true},"
      + "\"git\":{\"showBranch\":true,\"showStaged\":true,\"showUnstaged\":true,"
      + "\"showUntracked\":true}}",
    ]);
  });
});

describe("ohmypi statusline revert", () => {
  it("undoes through omp itself, in reverse", () => {
    const { receipt } = installStatuslineOhmypi(context);
    ran = [];

    revertStatuslineOhmypi(context, receipt);

    expect(ran.map(c => c.slice(1).join(" "))).toEqual([
      "config set statusLine.segmentOptions {}",
      "config set statusLine.rightSegments []",
      "config set statusLine.leftSegments []",
      "config set statusLine.preset default",
    ]);
  });
});

describe("ohmypi statusline skip", () => {
  it("skips rather than failing when omp is not on PATH", () => {
    const path = process.env["PATH"];
    process.env["PATH"] = "";
    try {
      const outcome = executeStatuslineOhmypi({
        context,
        dryRun: false,
        receiptDir: join(home, "receipts"),
      });

      // A target whose tool is absent is reported and moved past, exactly as
      // the plugin targets are — never an error that fails the whole run.
      expect(outcome.skipped).toBe("not-installed");
      expect(outcome.error).toBeUndefined();
      expect(ran).toEqual([]);
    }
    finally {
      process.env["PATH"] = path;
    }
  });
});

/**
 * The real binary, against a redirected config dir.
 *
 * Skipped when `omp` is absent so CI without it still passes — the fake-driven
 * suites above are what run everywhere.
 */
const hasOmp = execCommand("omp", ["--version"]).status === 0;

/** Each of these spawns `omp` a dozen times; the default 5s is not enough. */
const REAL = 60_000;

describe.skipIf(!hasOmp)("ohmypi statusline round-trip (real omp)", () => {
  beforeEach(() => {
    context = { ...context, exec: execCommand };
  });

  it("writes the four keys into omp's own config.yml", () => {
    installStatuslineOhmypi(context);

    const written = readFileSync(configFile(), "utf8");
    expect(written).toContain("preset: custom");
    expect(written).toContain("- context_pct");
    expect(written).toContain("showThinkingLevel: true");
  }, REAL);

  it("leaves no config.yml behind when there was none", () => {
    // The file is created lazily on the first `set`, so this is the ordinary
    // case: byte-identity here means the file is gone again.
    expect(existsSync(configFile())).toBe(false);

    revertStatuslineOhmypi(context, installStatuslineOhmypi(context).receipt);

    expect(existsSync(configFile())).toBe(false);
  }, REAL);

  it("restores an existing config byte-identically", () => {
    // Every key we touch already carries a value here, which is the case the
    // value-level undo restores exactly. A key absent from an existing file
    // comes back as its explicit default instead — omp offers no key removal.
    // Note the missing final newline: that is how omp's own writer leaves it.
    const before = "appearance: \n"
      + "  theme.dark: titanium\n"
      + "statusLine: \n"
      + "  preset: minimal\n"
      + "  leftSegments: \n"
      + "    - model\n"
      + "  rightSegments: \n"
      + "    - cost\n"
      + "  segmentOptions: \n"
      + "    model: \n"
      + "      showThinkingLevel: false";
    writeFileSync(configFile(), before);

    revertStatuslineOhmypi(context, installStatuslineOhmypi(context).receipt);

    expect(readFileSync(configFile(), "utf8")).toBe(before);
  }, REAL);

  it("keeps a setting the user changed between install and uninstall", () => {
    // The reason the undo is key-level rather than a file restore. The key is
    // `colorBlindMode`, not `appearance.colorBlindMode` — `omp config list`
    // groups under `[appearance]`, but the bracket is a heading, not a prefix.
    writeFileSync(configFile(), "statusLine: \n  preset: minimal");
    const { receipt } = installStatuslineOhmypi(context);
    const set = execCommand(
      "omp",
      ["config", "set", "colorBlindMode", "true"],
      {
        env: { ...process.env, HOME: home },
      },
    );
    expect(set.status).toBe(0);

    revertStatuslineOhmypi(context, receipt);

    expect(readFileSync(configFile(), "utf8")).toContain(
      "colorBlindMode: true",
    );
  }, REAL);
});
