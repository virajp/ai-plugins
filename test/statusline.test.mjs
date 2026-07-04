// Smoke tests for the statusline script (tools/statusline/statusline): it must
// render both surfaces and, for the main bar, mirror the usage figures that the
// context-caps hook reads. Hermetic — temp dirs under the OS tmpdir, no $HOME
// writes. Run via `node --test`.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
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
  after,
  test,
} from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "..", "tools", "statusline", "statusline");
const BUNDLED_CONFIG = join(
  HERE,
  "..",
  "tools",
  "statusline",
  "statusline.json",
);

const tmp = mkdtempSync(join(tmpdir(), "statusline-test-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

// Seed a hermetic fake HOME with the bundled default config at
// ~/.config/statusline.json — the ONLY place the script reads defaults from
// (never the file beside itself). Without this the render depends on whether
// the machine happens to have an installed ~/.config/statusline.json, which
// passes on a dev box but renders an empty main bar on a clean CI runner.
const fakeHome = join(tmp, "home");
mkdirSync(join(fakeHome, ".config"), { recursive: true });
copyFileSync(BUNDLED_CONFIG, join(fakeHome, ".config", "statusline.json"));

// Run the script with `payload` on stdin and `env` merged over the current env.
// HOME points at the seeded fake home so config resolution is deterministic;
// override it per call if a test needs a different home.
function runStatusline(payload, env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, HOME: fakeHome, ...env },
  });
}

test("main bar renders and mirrors usage for the caps hook", () => {
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

  const res = runStatusline(payload, { AI_PLUGINS_USAGE_DIR: usageDir });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.length > 0, "expected a non-empty status line");

  const usage = JSON.parse(
    readFileSync(join(usageDir, `${sessionId}.json`), "utf8"),
  );
  // The exact fields context-caps.js reads.
  for (
    const key of [
      "ctxPct",
      "fiveHourPct",
      "fiveHourResetsAt",
      "sevenDayPct",
      "sevenDayResetsAt",
    ]
  ) {
    assert.ok(key in usage, `usage file missing ${key}`);
  }
  assert.equal(usage.ctxPct, 26);
  assert.equal(usage.fiveHourPct, 7);
  assert.equal(usage.sevenDayPct, 1.0);
});

test("subagent panel renders a tasks payload", () => {
  const payload = {
    columns: 120,
    tasks: [
      {
        id: "t1",
        name: "reviewer",
        status: "running",
        description: "Auditing auth flow",
        tokenCount: 18234,
        startTime: 1774200000000,
      },
    ],
  };
  const res = runStatusline(payload);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.length > 0, "expected a non-empty subagent line");
  // One NDJSON {id, content} row per task.
  const row = JSON.parse(res.stdout.trim());
  assert.equal(row.id, "t1");
  assert.ok(row.content.length > 0);
});

// --- context-caps hook: per-repo execute_caps from .config/vwf.yaml ---

const CAPS_HOOK = join(HERE, "..", "tools", "statusline", "context-caps.js");

// Run the caps hook with a seeded usage file and an optional repo dir (cwd).
// Distinct session ids per call keep the per-session debounce out of the way.
function runCapsHook(sessionId, usage, cwd) {
  const usageDir = join(tmp, "caps-usage");
  mkdirSync(usageDir, { recursive: true });
  writeFileSync(join(usageDir, `${sessionId}.json`), JSON.stringify(usage));
  return spawnSync(process.execPath, [CAPS_HOOK], {
    input: JSON.stringify({ session_id: sessionId, cwd }),
    encoding: "utf8",
    env: { ...process.env, AI_PLUGINS_USAGE_DIR: usageDir },
  });
}

test("caps hook: silent under the default cap, fires above it", () => {
  const quiet = runCapsHook("caps-a", { ctxPct: 50 });
  assert.equal(quiet.status, 0, quiet.stderr);
  assert.equal(quiet.stdout, "", "no directive expected under the cap");

  const loud = runCapsHook("caps-b", { ctxPct: 70 });
  assert.equal(loud.status, 0, loud.stderr);
  assert.ok(loud.stdout.includes("cap 65%"), loud.stdout);
});

test("caps hook: repo config tightens the context cap", () => {
  const repo = join(tmp, "repo-tight");
  mkdirSync(join(repo, ".config"), { recursive: true });
  writeFileSync(
    join(repo, ".config", "vwf.yaml"),
    "pipeline:\n  execute_caps:\n    context: 40\n",
  );
  const res = runCapsHook("caps-c", { ctxPct: 50 }, repo);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("cap 40%"), res.stdout);
});

test("caps hook: legacy autopilot_caps key still tightens", () => {
  const repo = join(tmp, "repo-legacy");
  mkdirSync(join(repo, ".config"), { recursive: true });
  writeFileSync(
    join(repo, ".config", "vwf.yaml"),
    "pipeline:\n  autopilot_caps:\n    context: 40\n",
  );
  const res = runCapsHook("caps-e", { ctxPct: 50 }, repo);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("cap 40%"), res.stdout);
});

test("caps hook: repo config can never loosen a cap", () => {
  const repo = join(tmp, "repo-loose");
  mkdirSync(join(repo, ".config"), { recursive: true });
  writeFileSync(
    join(repo, ".config", "vwf.yaml"),
    "pipeline:\n  execute_caps:\n    context: 90\n",
  );
  const res = runCapsHook("caps-d", { ctxPct: 70 }, repo);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("cap 65%"), res.stdout);
});
