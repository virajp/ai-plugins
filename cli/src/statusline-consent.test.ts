import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
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
import type { Context } from "./context.ts";
import {
  autoConfigureAllowed,
  resolveConsent,
  setAutoConfigure,
} from "./statusline-consent.ts";
import {
  claudeStatuslineConflict,
  installStatusline,
} from "./statusline.ts";

const repoRoot = join(import.meta.dirname, "..", "..");

let home: string;
let configDir: string;
let context: Context;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-consent-home-"));
  configDir = mkdtempSync(join(tmpdir(), "ai-plugins-consent-cfg-"));
  process.env["CLAUDE_CONFIG_DIR"] = configDir;
  context = {
    sourceRoot: repoRoot,
    home,
    cwd: home,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: () => {
      throw new Error("no commands here");
    },
  };
});
afterEach(() => {
  delete process.env["CLAUDE_CONFIG_DIR"];
  rmSync(home, { recursive: true, force: true });
  rmSync(configDir, { recursive: true, force: true });
});

const userConfig = () => join(home, ".config", "statusline.json");

function writeSettings(value: unknown): void {
  const file = join(configDir, "settings.json");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

describe("resolveConsent", () => {
  const question = {
    conflict: "somewhere → someone else's bar",
    explicit: false,
    remembered: false,
    interactive: false,
  };

  it("configures without asking when nothing is at stake", () => {
    // The common case by far, and the one that must never prompt: a fresh
    // machine, or one carrying nothing but our own earlier run.
    expect(resolveConsent({ ...question, conflict: undefined })).toBe(
      "configure",
    );
  });

  it("treats --statusline as the consent itself", () => {
    expect(resolveConsent({ ...question, explicit: true })).toBe("configure");
  });

  it("lets --statusline override a remembered refusal", () => {
    // Order matters: checking memory first would make a refusal permanent and
    // the flag a lie, since the flag is the documented way to undo it.
    expect(resolveConsent({ ...question, explicit: true, remembered: true }))
      .toBe("configure");
  });

  it("stays quiet when the user already declined", () => {
    expect(resolveConsent({ ...question, remembered: true })).toBe("skip");
  });

  it("asks when it can", () => {
    expect(resolveConsent({ ...question, interactive: true })).toBe("ask");
  });

  it("fails rather than guessing when it cannot ask", () => {
    // Under pnpx in a setup script or CI. Overwriting silently is the bug this
    // exists to fix; skipping silently would make an unattended install report
    // success while quietly leaving the bar unconfigured.
    expect(resolveConsent(question)).toBe("fail");
  });
});

describe("the remembered refusal", () => {
  it("reads as allowed when there is no config at all", () => {
    expect(autoConfigureAllowed(context)).toBe(true);
  });

  it("reads as allowed when the config is malformed", () => {
    // The safe direction: the worst case is being asked again, not silently
    // never configuring anything.
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(userConfig(), "{ not json");

    expect(autoConfigureAllowed(context)).toBe(true);
  });

  it("round-trips a refusal", () => {
    setAutoConfigure(context, false);

    expect(autoConfigureAllowed(context)).toBe(false);
  });

  it("removes the key rather than writing true, so absent stays the default", () => {
    setAutoConfigure(context, false);
    setAutoConfigure(context, true);

    expect(JSON.parse(readFileSync(userConfig(), "utf8")))
      .not
      .toHaveProperty("autoConfigure");
    expect(autoConfigureAllowed(context)).toBe(true);
  });

  it("keeps the user's own statusline settings", () => {
    // The same file holds their palette. A refusal that ate it would be a
    // worse outcome than the overwrite this gate exists to prevent.
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(
      userConfig(),
      JSON.stringify({ projectName: "mine", palette: { fg: [1, 2, 3] } }),
    );

    setAutoConfigure(context, false);

    const config = JSON.parse(readFileSync(userConfig(), "utf8")) as Record<
      string,
      unknown
    >;
    expect(config["projectName"]).toBe("mine");
    expect(config["palette"]).toEqual({ fg: [1, 2, 3] });
    expect(config["autoConfigure"]).toBe(false);
  });
});

describe("claudeStatuslineConflict", () => {
  it("finds nothing when there is no settings file", () => {
    expect(claudeStatuslineConflict(context)).toBeUndefined();
  });

  it("finds nothing when settings carry no statusLine", () => {
    writeSettings({ model: "opus" });

    expect(claudeStatuslineConflict(context)).toBeUndefined();
  });

  it("reports a bar belonging to someone else, and names it", () => {
    writeSettings({
      statusLine: { type: "command", command: "~/bin/my-own-bar" },
    });

    expect(claudeStatuslineConflict(context)).toContain("~/bin/my-own-bar");
  });

  it("does not report our own bar back to us", () => {
    // Ownership, not existence. Without this every repeat run would prompt
    // about the statusline it installed itself — the same trap the receipt
    // entries exist to avoid, in a different disguise.
    installStatusline(context);

    expect(existsSync(join(home, ".claude", "scripts", "statusline")))
      .toBe(true);
    expect(claudeStatuslineConflict(context)).toBeUndefined();
  });
});

describe("declining the bar", () => {
  it("installs the bar but leaves the settings alone", () => {
    writeSettings({
      statusLine: { type: "command", command: "~/bin/my-own-bar" },
    });

    installStatusline(context, false);

    // The files land: a declined machine is one `--statusline` from a working
    // bar, not back at the start.
    expect(existsSync(join(home, ".claude", "scripts", "statusline")))
      .toBe(true);
    expect(existsSync(join(home, ".claude", "hooks", "context-caps.js")))
      .toBe(true);
    // What was declined is untouched.
    const settings = JSON.parse(
      readFileSync(join(configDir, "settings.json"), "utf8"),
    ) as Record<string, { command?: string; }>;
    expect(settings["statusLine"]?.command).toBe("~/bin/my-own-bar");
    expect(settings["subagentStatusLine"]).toBeUndefined();
  });
});
