import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  dirname,
  join,
} from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { AdapterContext } from "./adapters/types.ts";
import {
  installStatusline,
  planStatusline,
  revertStatusline,
} from "./statusline.ts";

/**
 * Hermetic: a real install of the bundled `tools/statusline/` assets into a temp
 * `$HOME`. `CLAUDE_CONFIG_DIR` is pointed at a *separate* temp dir, so these
 * also pin the deliberate split — settings follow the config dir, the script and
 * the hook follow `$HOME`, because the commands written into settings name
 * `${HOME}` literally.
 */
const repoRoot = join(import.meta.dirname, "..", "..");

let home: string;
let configDir: string;
let logged: string[];
let context: AdapterContext;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-sl-home-"));
  configDir = mkdtempSync(join(tmpdir(), "ai-plugins-sl-cfg-"));
  logged = [];
  process.env["CLAUDE_CONFIG_DIR"] = configDir;
  context = {
    sourceRoot: repoRoot,
    home,
    cwd: home,
    now: "2026-01-01T00:00:00Z",
    log: message => {
      logged.push(message);
    },
    exec: () => {
      throw new Error(
        "the statusline installs no plugins and runs no commands",
      );
    },
  };
});
afterEach(() => {
  delete process.env["CLAUDE_CONFIG_DIR"];
  rmSync(home, { recursive: true, force: true });
  rmSync(configDir, { recursive: true, force: true });
});

const script = () => join(home, ".claude", "scripts", "statusline");
const hook = () => join(home, ".claude", "hooks", "context-caps.js");
const userConfig = () => join(home, ".config", "statusline.json");
const settingsFile = () => join(configDir, "settings.json");

function settings(): Record<string, any> {
  return JSON.parse(readFileSync(settingsFile(), "utf8")) as Record<
    string,
    any
  >;
}

function writeSettings(value: unknown): string {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  mkdirSync(dirname(settingsFile()), { recursive: true });
  writeFileSync(settingsFile(), text);
  return text;
}

describe("statusline install", () => {
  it("copies the script and the caps hook, executable", () => {
    installStatusline(context);

    expect(existsSync(script())).toBe(true);
    expect(existsSync(hook())).toBe(true);
    // Claude Code runs these directly; a non-executable copy fails silently.
    expect(statSync(script()).mode & 0o111).toBeTruthy();
    expect(statSync(hook()).mode & 0o111).toBeTruthy();
  });

  it("writes both bar keys, the usage env var and the hook entry", () => {
    installStatusline(context);
    const written = settings();

    expect(written["statusLine"].command).toBe(
      "${HOME}/.claude/scripts/statusline",
    );
    expect(written["subagentStatusLine"].command).toBe(
      "${HOME}/.claude/scripts/statusline",
    );
    expect(written["env"]["AI_PLUGINS_USAGE_DIR"]).toBe(
      "${HOME}/.claude/usage",
    );
    expect(written["hooks"]["PostToolUse"]).toHaveLength(1);
  });

  it("seeds the bundled defaults into ~/.config/statusline.json", () => {
    installStatusline(context);

    const seeded = JSON.parse(readFileSync(userConfig(), "utf8")) as Record<
      string,
      unknown
    >;
    const defaults = JSON.parse(
      readFileSync(
        join(repoRoot, "tools", "statusline", "statusline.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(Object.keys(seeded).sort()).toEqual(Object.keys(defaults).sort());
  });

  it("keeps user edits when re-seeding, and adds what is missing", () => {
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(userConfig(), JSON.stringify({ palette: { fg: "#abcdef" } }));

    installStatusline(context);

    const seeded = JSON.parse(readFileSync(userConfig(), "utf8")) as any;
    // The user's value wins; every default they did not set is filled in.
    expect(seeded.palette.fg).toBe("#abcdef");
    expect(Object.keys(seeded).length).toBeGreaterThan(1);
  });

  it("preserves foreign keys in settings.json", () => {
    writeSettings({ model: "opus", env: { FOO: "1" } });

    installStatusline(context);

    expect(settings()["model"]).toBe("opus");
    expect(settings()["env"]["FOO"]).toBe("1");
    expect(settings()["env"]["AI_PLUGINS_USAGE_DIR"]).toBeDefined();
  });

  it("appends the caps hook beside existing PostToolUse hooks", () => {
    writeSettings({
      hooks: {
        PostToolUse: [{ hooks: [{ type: "command", command: "true" }] }],
      },
    });

    installStatusline(context);

    const post = settings()["hooks"]["PostToolUse"];
    expect(post).toHaveLength(2);
    expect(post[0].hooks[0].command).toBe("true");
  });

  it("leaves a user's tuned padding alone", () => {
    // Identity is type + command; padding and refreshInterval are theirs.
    writeSettings({
      statusLine: {
        type: "command",
        command: "${HOME}/.claude/scripts/statusline",
        padding: 3,
      },
    });

    installStatusline(context);

    expect(settings()["statusLine"].padding).toBe(3);
  });

  it("replaces a foreign statusline, and says so", () => {
    writeSettings({ statusLine: { type: "command", command: "mybar" } });

    installStatusline(context);

    expect(settings()["statusLine"].command).toBe(
      "${HOME}/.claude/scripts/statusline",
    );
    expect(logged.join("\n")).toMatch(/replacing the `statusLine`/);
  });

  it("refuses a malformed settings file rather than clobbering it", () => {
    mkdirSync(dirname(settingsFile()), { recursive: true });
    writeFileSync(settingsFile(), "{ not json");

    expect(() => installStatusline(context)).toThrow(/malformed/);
    expect(readFileSync(settingsFile(), "utf8")).toBe("{ not json");
  });

  it("writes nothing under a dry run", () => {
    const actions = planStatusline(context);

    expect(actions.length).toBeGreaterThan(0);
    expect(existsSync(script())).toBe(false);
    expect(existsSync(settingsFile())).toBe(false);
    expect(existsSync(userConfig())).toBe(false);
  });

  it("is a byte-for-byte no-op the second time", () => {
    installStatusline(context);
    const first = readFileSync(settingsFile(), "utf8");

    installStatusline(context);

    expect(readFileSync(settingsFile(), "utf8")).toBe(first);
  });

  it("is a no-op the second time on a settings file it did not create", () => {
    writeSettings({
      model: "opus",
      hooks: {
        PostToolUse: [{ hooks: [{ type: "command", command: "true" }] }],
      },
    });
    installStatusline(context);
    const first = readFileSync(settingsFile(), "utf8");

    installStatusline(context);

    // The hook is matched by command, so the second run must not append a
    // second copy of it — which would run the caps check twice per tool call.
    expect(readFileSync(settingsFile(), "utf8")).toBe(first);
    expect(settings()["hooks"]["PostToolUse"]).toHaveLength(2);
  });
});

describe("statusline revert", () => {
  it("restores an existing settings file byte-identically", () => {
    const original = writeSettings({ model: "opus", env: { FOO: "1" } });

    revertStatusline(installStatusline(context).receipt);

    // Not a parsed-object comparison: a stray `"env": {}` left behind parses
    // equal to no `env` at all under a semantic check, and is still a diff.
    expect(readFileSync(settingsFile(), "utf8")).toBe(original);
  });

  it("removes a settings file it created", () => {
    revertStatusline(installStatusline(context).receipt);

    expect(existsSync(settingsFile())).toBe(false);
  });

  it("deletes the script and the hook, and leaves no directories behind", () => {
    revertStatusline(installStatusline(context).receipt);

    expect(existsSync(script())).toBe(false);
    expect(existsSync(hook())).toBe(false);
    expect(existsSync(join(home, ".claude", "scripts"))).toBe(false);
    expect(existsSync(join(home, ".claude", "hooks"))).toBe(false);
  });

  it("still deletes the script after a second install", () => {
    installStatusline(context);
    // The second install finds its own output already there. Recording that as
    // prior state would make this revert restore the script instead of removing
    // it — which is why the entry is recorded as a creation.
    revertStatusline(installStatusline(context).receipt);

    expect(existsSync(script())).toBe(false);
  });

  it("leaves ~/.config/statusline.json, which may hold user edits", () => {
    revertStatusline(installStatusline(context).receipt);

    expect(existsSync(userConfig())).toBe(true);
  });

  it("leaves another tool's PostToolUse hooks intact", () => {
    const original = writeSettings({
      hooks: {
        PostToolUse: [{ hooks: [{ type: "command", command: "true" }] }],
      },
    });

    revertStatusline(installStatusline(context).receipt);

    expect(readFileSync(settingsFile(), "utf8")).toBe(original);
  });
});
