/**
 * The MemPalace checkpoint hook script, run for real through `/bin/sh`.
 *
 * This is the path three of the four targets take — Claude runs it directly,
 * Cursor and Oh-My-Pi through generated wrappers — so it carries most of the
 * behaviour. Only OpenCode uses the TypeScript module instead.
 *
 * Run rather than read: the script is POSIX sh with BSD-portable tooling, and
 * the portability guarantee is only worth anything if the system shell is what
 * executes it. Same reasoning as `typescript:test` for the npm-normalize hook.
 *
 * It lives here because `vitest.config.mts` collects only
 * `{schema,renderer,cli}/src/**\/*.test.ts` — beside the script it would never run.
 */
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
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

const script = join(
  import.meta.dirname,
  "..",
  "..",
  "templates",
  "vwf",
  "hooks",
  "mempalace-checkpoint.sh",
);

/** A throwaway XDG state dir, so counters never leak between tests or to $HOME. */
let state: string;

beforeEach(() => {
  state = mkdtempSync(join(tmpdir(), "ai-plugins-mempalace-"));
});
afterEach(() => {
  rmSync(state, { recursive: true, force: true });
});

function run(
  payload: Record<string, unknown>,
  { args = [] as string[], env = {} as Record<string, string> } = {},
): string {
  return execFileSync(script, args, {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: {
      PATH: process.env["PATH"] ?? "",
      HOME: state,
      XDG_STATE_HOME: state,
      ...env,
    },
  });
}

/** Drive the hook n times for one session and return every response. */
function stops(n: number, session = "s1", env?: Record<string, string>) {
  return Array.from(
    { length: n },
    () => run({ session_id: session }, env ? { env } : {}),
  );
}

describe("mempalace-checkpoint.sh", () => {
  it("says nothing for the first fourteen stops", () => {
    expect(stops(14).every(out => out.trim() === "")).toBe(true);
  });

  it("asks for a save on the fifteenth", () => {
    const out = stops(15).at(-1) ?? "";
    expect(JSON.parse(out)).toMatchObject({ decision: "block" });
    expect(out).toContain("MemPalace save checkpoint");
  });

  it("answers in the shape a stop hook may use, and only that", () => {
    // `hookSpecificOutput` belongs to `PreToolUse`. Emitting one here — as this
    // did — makes Claude reject the whole verdict for a missing
    // `hookEventName`, and the checkpoint silently never fires.
    const verdict = JSON.parse(stops(15).at(-1) ?? "{}") as Record<
      string,
      unknown
    >;
    expect(Object.keys(verdict).sort()).toEqual(["decision", "reason"]);
  });

  it("resets after saving, so it fires on a fixed interval", () => {
    const responses = stops(30);
    const spoke = responses
      .map((out, i) => (out.trim() === "" ? null : i + 1))
      .filter(n => n !== null);
    expect(spoke).toEqual([15, 30]);
  });

  it("counts each session separately", () => {
    stops(14, "session-a");
    // A different session starts from zero rather than inheriting the count.
    expect(stops(1, "session-b")[0]?.trim()).toBe("");
  });

  it("lets the stop through while a save is already in flight", () => {
    stops(14);
    // Without this guard the model could never finish: it would be told to
    // save, and the stop that follows the save would tell it to save again.
    const out = run({ session_id: "s1", stop_hook_active: true });
    expect(out.trim()).toBe("");
  });

  it("always speaks on compaction, whatever the count", () => {
    const out = run({ session_id: "s1" }, { args: ["--compact"] });
    expect(out).toContain("about to be compacted");
    expect(JSON.parse(out).decision).toBe("block");
  });

  it("resets the counter after a compaction save", () => {
    stops(14);
    run({ session_id: "s1" }, { args: ["--compact"] });
    expect(stops(1)[0]?.trim()).toBe("");
  });

  it("honours the environment opt-out", () => {
    const env = { MEMPALACE_HOOKS_AUTO_SAVE: "false" };
    expect(stops(20, "s1", env).every(out => out.trim() === "")).toBe(true);
  });

  it("respects a custom interval", () => {
    const env = { MEMPALACE_SAVE_INTERVAL: "3" };
    const responses = stops(3, "s1", env);
    expect(responses.at(-1)).toContain("MemPalace save checkpoint");
  });

  it("survives a payload with no session id", () => {
    // Falls back to a shared counter rather than failing — a hook that errors
    // is worse than one that batches.
    expect(() => run({})).not.toThrow();
  });

  it("emits valid JSON, so a wrapper can parse the verdict", () => {
    const out = stops(15).at(-1) ?? "";
    expect(() => JSON.parse(out) as unknown).not.toThrow();
  });
});
