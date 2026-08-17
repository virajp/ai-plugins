/**
 * The statusline script and its caps hook, as shipped.
 *
 * These exercise `tools/statusline/` — the two standalone CommonJS files this
 * package installs but does not import — by running them as subprocesses, which
 * is how Claude Code invokes them. Ported from `test/statusline.test.mjs`; they
 * live beside the installer because `cli` is the package that ships them, and
 * because vitest collects from the workspace packages only.
 *
 * Hermetic: temp dirs under the OS tmpdir, a fake `$HOME`, no writes anywhere
 * real.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const assets = join(repoRoot, "tools", "statusline");
const SCRIPT = join(assets, "statusline");
const CAPS_HOOK = join(assets, "context-caps.js");

let tmp: string;
let fakeHome: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "statusline-script-"));
  // The script reads its defaults from `~/.config/statusline.json` and nowhere
  // else — never the file beside itself. Without seeding it the render depends
  // on whether the machine happens to have one installed, which passes on a dev
  // box and renders an empty bar on a clean CI runner.
  fakeHome = join(tmp, "home");
  mkdirSync(join(fakeHome, ".config"), { recursive: true });
  // Seeded with the bundled defaults, except spend.refreshMinutes is zeroed:
  // the defaults put `spend` in the layout, and a stale cache would spawn a
  // detached refresh child that reads the REAL keychain and hits the network —
  // the keychain is not scoped by $HOME, so the fake home alone can't fence it.
  const config = JSON.parse(
    readFileSync(join(assets, "statusline.json"), "utf8"),
  ) as { spend: { refreshMinutes: number; }; };
  config.spend.refreshMinutes = 0;
  writeFileSync(
    join(fakeHome, ".config", "statusline.json"),
    JSON.stringify(config),
  );
});
afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function runStatusline(payload: unknown, env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, HOME: fakeHome, ...env },
  });
}

/** Distinct session ids per call keep the hook's per-session debounce out of the way. */
function runCapsHook(sessionId: string, usage: unknown, cwd?: string) {
  const usageDir = join(tmp, "caps-usage");
  mkdirSync(usageDir, { recursive: true });
  writeFileSync(join(usageDir, `${sessionId}.json`), JSON.stringify(usage));
  return spawnSync(process.execPath, [CAPS_HOOK], {
    input: JSON.stringify({ session_id: sessionId, cwd }),
    encoding: "utf8",
    env: { ...process.env, AI_PLUGINS_USAGE_DIR: usageDir },
  });
}

describe("statusline script", () => {
  it("renders the main bar and mirrors usage for the caps hook", () => {
    const usageDir = join(tmp, "usage");
    const sessionId = "test-session-123";
    // Field shape mirrors the script's own documented example payload.
    const payload = {
      session_id: sessionId,
      model: { display_name: "Opus 4.8" },
      effort: { level: "high" },
      session_name: "users-and-groups",
      workspace: { current_dir: tmp },
      cost: { total_cost_usd: 46.51, total_duration_ms: 33540000 },
      context_window: {
        used_percentage: 26,
        context_window_size: 1000000,
        total_input_tokens: 259000,
      },
      rate_limits: {
        five_hour: { used_percentage: 7, resets_at: 1774200000 },
        seven_day: { used_percentage: 1.0, resets_at: 1774600000 },
      },
    };

    const result = runStatusline(payload, { AI_PLUGINS_USAGE_DIR: usageDir });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);

    const usage = JSON.parse(
      readFileSync(join(usageDir, `${sessionId}.json`), "utf8"),
    ) as Record<string, unknown>;
    // The exact fields context-caps.js reads. This file is the only contract
    // between the two, and nothing else would catch a rename.
    for (
      const key of [
        "ctxPct",
        "fiveHourPct",
        "fiveHourResetsAt",
        "sevenDayPct",
        "sevenDayResetsAt",
      ]
    ) {
      expect(usage, `usage file missing ${key}`).toHaveProperty(key);
    }
    expect(usage["ctxPct"]).toBe(26);
    expect(usage["fiveHourPct"]).toBe(7);
    expect(usage["sevenDayPct"]).toBe(1.0);
  });

  it("renders the spend segment from a fresh cache on an enterprise plan", () => {
    const cache = join(tmp, "spend-enterprise.json");
    writeFileSync(
      cache,
      JSON.stringify({
        ts: Date.now(),
        plan: "enterprise",
        data: {
          usedMinor: 7593,
          limitMinor: 15000,
          exponent: 2,
          percent: 51,
          enabled: true,
        },
      }),
    );

    const result = runStatusline({ model: { display_name: "Fable" } }, {
      AI_PLUGINS_SPEND_CACHE: cache,
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("$75.93/$150 (51%)");
  });

  it("hides the spend segment for non-enterprise plans unless show is always", () => {
    const cache = join(tmp, "spend-max.json");
    writeFileSync(
      cache,
      JSON.stringify({
        ts: Date.now(),
        plan: "max",
        data: {
          usedMinor: 0,
          limitMinor: 100,
          exponent: 2,
          percent: 0,
          enabled: true,
        },
      }),
    );

    const auto = runStatusline({ model: { display_name: "Fable" } }, {
      AI_PLUGINS_SPEND_CACHE: cache,
    });
    expect(auto.status, auto.stderr).toBe(0);
    expect(auto.stdout).not.toContain("$0/$1");

    // A repo-layer override flips it on: show "always" renders whatever plan
    // the cache carries. The .git/HEAD is what lets the script resolve the
    // repo root and pick up <root>/.config/statusline.json.
    const repo = join(tmp, "repo-spend");
    mkdirSync(join(repo, ".git"), { recursive: true });
    writeFileSync(join(repo, ".git", "HEAD"), "ref: refs/heads/main\n");
    mkdirSync(join(repo, ".config"), { recursive: true });
    writeFileSync(
      join(repo, ".config", "statusline.json"),
      JSON.stringify({ spend: { show: "always", refreshMinutes: 0 } }),
    );

    const always = runStatusline({
      model: { display_name: "Fable" },
      workspace: { current_dir: repo },
    }, { AI_PLUGINS_SPEND_CACHE: cache });
    expect(always.status, always.stderr).toBe(0);
    expect(always.stdout).toContain("$0/$1 (0%)");
  });

  it("renders the monthly segment for any plan from cached ledger months", () => {
    const now = new Date();
    const cur = now.toISOString().slice(0, 7);
    const prev = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15),
    )
      .toISOString()
      .slice(0, 7);
    const cache = join(tmp, "monthly-render.json");
    writeFileSync(
      cache,
      JSON.stringify({
        ts: Date.now(),
        plan: "max",
        monthly: {
          ts: Date.now(),
          months: { [cur]: 12.34, [prev]: 109.4 },
          files: {},
        },
      }),
    );

    const result = runStatusline({ model: { display_name: "Fable" } }, {
      AI_PLUGINS_SPEND_CACHE: cache,
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("$12.34 (prev $109)");
  });

  it("computes the monthly ledger from transcripts in the refresh child", () => {
    // A dedicated home: transcripts to price, a credentials file so the child
    // never consults the real keychain, and an unreachable endpoint override so
    // nothing leaves the machine. Pricing is seeded fresh in the cache, so the
    // LiteLLM fetch is skipped too.
    const home = join(tmp, "home-monthly");
    const proj = join(home, ".claude", "projects", "some-repo");
    mkdirSync(proj, { recursive: true });
    writeFileSync(
      join(home, ".claude", ".credentials.json"),
      JSON.stringify({
        claudeAiOauth: { accessToken: "bogus", subscriptionType: "max" },
      }),
    );

    const now = new Date();
    const curTs = now.toISOString();
    const prevTs = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15),
    )
      .toISOString();
    const entry = (ts: string, id: string, usage: Record<string, number>) =>
      JSON.stringify({
        type: "assistant",
        timestamp: ts,
        requestId: `req-${id}`,
        message: { id: `msg-${id}`, model: "claude-sonnet-5", usage },
      });
    // 1M input at $2/MTok = $2.00 this month; 100k output at $10/MTok = $1.00
    // last month. The repeated msg-a line is a multi-block message and must
    // count once.
    writeFileSync(
      join(proj, "s1.jsonl"),
      [
        entry(curTs, "a", { input_tokens: 1000000 }),
        entry(curTs, "a", { input_tokens: 1000000 }),
        entry(prevTs, "b", { output_tokens: 100000 }),
        "",
      ]
        .join("\n"),
    );

    const cache = join(tmp, "monthly-child.json");
    writeFileSync(
      cache,
      JSON.stringify({
        ts: 0,
        pricing: {
          ts: Date.now(),
          models: { "claude-sonnet-5": [2e-6, 1e-5, 2.5e-6, 2e-7] },
        },
      }),
    );

    const run = () =>
      spawnSync(process.execPath, [SCRIPT, "--refresh-spend"], {
        encoding: "utf8",
        env: {
          ...process.env,
          HOME: home,
          AI_PLUGINS_SPEND_CACHE: cache,
          AI_PLUGINS_SPEND_URL: "https://127.0.0.1:9/unreachable",
        },
      });

    const result = run();
    expect(result.status, result.stderr).toBe(0);
    const out = JSON.parse(readFileSync(cache, "utf8")) as {
      plan: string;
      failures: number;
      monthly: {
        months: Record<string, number>;
        files: Record<string, unknown>;
      };
    };
    expect(out.plan).toBe("max");
    expect(out.failures).toBe(1); // the endpoint was unreachable, and that must not block the ledger
    expect(out.monthly.months[curTs.slice(0, 7)]).toBeCloseTo(2.0, 5);
    expect(out.monthly.months[prevTs.slice(0, 7)]).toBeCloseTo(1.0, 5);
    expect(Object.keys(out.monthly.files)).toEqual(["some-repo/s1.jsonl"]);

    // A second run with unchanged files must not double-count. The child's
    // 60-second sibling guard would skip it entirely, so age the cache first.
    const aged = JSON.parse(readFileSync(cache, "utf8")) as { ts: number; };
    aged.ts = Date.now() - 120000;
    writeFileSync(cache, JSON.stringify(aged));
    const again = run();
    expect(again.status, again.stderr).toBe(0);
    const out2 = JSON.parse(readFileSync(cache, "utf8")) as {
      monthly: { months: Record<string, number>; };
    };
    expect(out2.monthly.months[curTs.slice(0, 7)]).toBeCloseTo(2.0, 5);
  });

  it("omits the spend segment when there is no cache", () => {
    const result = runStatusline({ model: { display_name: "Fable" } }, {
      AI_PLUGINS_SPEND_CACHE: join(tmp, "spend-absent.json"),
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).not.toContain("$");
  });

  it("renders the subagent panel from a tasks payload", () => {
    const result = runStatusline({
      columns: 120,
      tasks: [{
        id: "t1",
        name: "reviewer",
        status: "running",
        description: "Auditing auth flow",
        tokenCount: 18234,
        startTime: 1774200000000,
      }],
    });

    expect(result.status, result.stderr).toBe(0);
    // One NDJSON {id, content} row per task.
    const row = JSON.parse(result.stdout.trim()) as {
      id: string;
      content: string;
    };
    expect(row.id).toBe("t1");
    expect(row.content.length).toBeGreaterThan(0);
  });
});

describe("context-caps hook", () => {
  it("stays silent under the default cap and fires above it", () => {
    const quiet = runCapsHook("caps-a", { ctxPct: 50 });
    expect(quiet.status, quiet.stderr).toBe(0);
    expect(quiet.stdout).toBe("");

    const loud = runCapsHook("caps-b", { ctxPct: 70 });
    expect(loud.status, loud.stderr).toBe(0);
    expect(loud.stdout).toContain("cap 65%");
  });

  it("lets a repo config tighten the context cap", () => {
    const repo = join(tmp, "repo-tight");
    mkdirSync(join(repo, ".config"), { recursive: true });
    writeFileSync(
      join(repo, ".config", "vwf.yaml"),
      "pipeline:\n  execute_caps:\n    context: 40\n",
    );

    const result = runCapsHook("caps-c", { ctxPct: 50 }, repo);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("cap 40%");
  });

  it("still honours the legacy autopilot_caps key", () => {
    const repo = join(tmp, "repo-legacy");
    mkdirSync(join(repo, ".config"), { recursive: true });
    writeFileSync(
      join(repo, ".config", "vwf.yaml"),
      "pipeline:\n  autopilot_caps:\n    context: 40\n",
    );

    const result = runCapsHook("caps-e", { ctxPct: 50 }, repo);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("cap 40%");
  });

  it("never lets a repo config loosen a cap", () => {
    const repo = join(tmp, "repo-loose");
    mkdirSync(join(repo, ".config"), { recursive: true });
    writeFileSync(
      join(repo, ".config", "vwf.yaml"),
      "pipeline:\n  execute_caps:\n    context: 90\n",
    );

    const result = runCapsHook("caps-d", { ctxPct: 70 }, repo);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("cap 65%");
  });
});
