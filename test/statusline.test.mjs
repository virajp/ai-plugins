// Smoke tests for the statusline script (tools/statusline/statusline): it must
// render both surfaces and, for the main bar, mirror the usage figures that the
// context-caps hook reads. Hermetic — temp dirs under the OS tmpdir, no $HOME
// writes. Run via `node --test`.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
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

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "tools",
  "statusline",
  "statusline",
);

const tmp = mkdtempSync(join(tmpdir(), "statusline-test-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

// Run the script with `payload` on stdin and `env` merged over the current env.
function runStatusline(payload, env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, ...env },
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
