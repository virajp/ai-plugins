import {
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
import { resolveStatuslineConsent } from "./index.ts";

/**
 * What is left of this file after the narrowing is one function.
 *
 * It used to cover `selectAdapters`, `buildJobs`, `statuslineSelected`,
 * `wantsStatusline` and `revertsStatusline` — every one of them a question about
 * *which of four targets* a run reaches, and there is one target. The consent
 * resolution is the piece with behaviour left in it, and it keeps its own
 * temp-directory install so the remembered-refusal file is real rather than
 * stubbed.
 */
let home: string;
let configDir: string;
let logged: string[];
let context: Context;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-idx-home-"));
  configDir = mkdtempSync(join(tmpdir(), "ai-plugins-idx-cfg-"));
  logged = [];
  process.env["CLAUDE_CONFIG_DIR"] = configDir;
  context = {
    sourceRoot: join(import.meta.dirname, "..", ".."),
    home,
    cwd: home,
    now: "2026-01-01T00:00:00Z",
    log: (message: string) => {
      logged.push(message);
    },
    exec: () => {
      throw new Error("consent resolution runs no commands");
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

describe("resolveStatuslineConsent", () => {
  it("grants without asking when nothing of the user's is at stake", async () => {
    expect(await resolveStatuslineConsent(context, true, false)).toBe(true);
  });

  it("grants a dry run without touching the remembered flag", async () => {
    // A dry run describes the most complete thing an answered run would do, and
    // writes nothing — including the refusal file.
    expect(await resolveStatuslineConsent(context, true, true)).toBe(true);
    expect(() => readFileSync(userConfig(), "utf8")).toThrow();
  });

  it("clears a refusal remembered by an older version", async () => {
    // The reachable half of this gate now that `--all` is gone: nothing but
    // `--statusline` can ask for an install, so the ask branches never fire, but
    // a machine still carrying `autoConfigure: false` from a version where
    // `--all` installed the bar has to be able to change its mind.
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(
      userConfig(),
      `${JSON.stringify({ autoConfigure: false })}\n`,
    );
    writeSettings({
      statusLine: { type: "command", command: "~/bin/my-own-bar" },
    });

    expect(await resolveStatuslineConsent(context, true, false)).toBe(true);
    expect(JSON.parse(readFileSync(userConfig(), "utf8")))
      .not
      .toHaveProperty("autoConfigure");
  });

  it("keeps the user's other statusline settings when clearing", async () => {
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(
      userConfig(),
      `${JSON.stringify({ autoConfigure: false, projectName: "mine" })}\n`,
    );

    await resolveStatuslineConsent(context, true, false);

    expect(JSON.parse(readFileSync(userConfig(), "utf8")))
      .toEqual({ projectName: "mine" });
  });

  it("skips without asking when a refusal stands and the flag is absent", async () => {
    mkdirSync(dirname(userConfig()), { recursive: true });
    writeFileSync(
      userConfig(),
      `${JSON.stringify({ autoConfigure: false })}\n`,
    );
    writeSettings({
      statusLine: { type: "command", command: "~/bin/my-own-bar" },
    });

    expect(await resolveStatuslineConsent(context, false, false)).toBe(false);
    expect(logged.join("\n")).toContain("--statusline");
  });

  it("refuses rather than guessing when it cannot ask", async () => {
    // `undefined` is the refusal the caller turns into a non-zero exit. Under
    // vitest stdin is not a TTY, which is exactly the unattended case.
    writeSettings({
      statusLine: { type: "command", command: "~/bin/my-own-bar" },
    });

    expect(await resolveStatuslineConsent(context, false, false))
      .toBeUndefined();
  });

  it("does not treat our own bar as a conflict", async () => {
    // Ownership, not existence: on the second run what is sitting there is the
    // first run's output, and asking about it would prompt on every re-run.
    writeSettings({
      statusLine: {
        type: "command",
        command: "${HOME}/.claude/scripts/statusline",
      },
    });

    expect(await resolveStatuslineConsent(context, false, false)).toBe(true);
  });
});
