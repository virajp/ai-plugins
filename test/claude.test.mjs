// Unit tests for the Claude Code plan resolution (bin/claude.mjs → resolvePlan):
// which plugins a flag set selects, at which scope, and whether the statusline
// rides along. Pure — no filesystem, network, or claude CLI. The one spawned
// case only exercises oclif's parsing of --no-statusline. Run via `node --test`.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  dirname,
  join,
} from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ClaudeCode,
  USER_SCOPED,
} from "../bin/claude.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "bin", "installer.mjs");

// resolvePlan only reaches io on its rejection paths; fail loudly if it does.
const io = {
  log: () => {},
  error: msg => {
    throw new Error(msg);
  },
};
const plan = flags => new ClaudeCode(io).resolvePlan(flags);

// --statusline is tri-state once oclif's allowNo is in play: true (asked for),
// false (--no-statusline), undefined (unmentioned). Only the last defers to
// --all, which means "the whole toolkit".
test("--all implies the statusline", () => {
  const p = plan({ all: true });
  assert.equal(p.statusLine, true);
  assert.equal(p.subagentStatusLine, true);
  assert.deepEqual(p.plugins.map(x => x.name), USER_SCOPED);
});

test("--all --no-statusline installs plugins only", () => {
  const p = plan({ all: true, statusline: false });
  assert.equal(p.statusLine, false);
  assert.equal(p.subagentStatusLine, false);
  assert.equal(p.plugins.length, USER_SCOPED.length);
});

test("a named install does not pull the statusline in", () => {
  const p = plan({ user: ["vwf"] });
  assert.equal(p.statusLine, false);
  assert.deepEqual(p.plugins, [{ name: "vwf", scope: "user" }]);
});

test("--statusline alone selects both keys and no plugins", () => {
  const p = plan({ statusline: true });
  assert.equal(p.statusLine, true);
  assert.equal(p.subagentStatusLine, true);
  assert.deepEqual(p.plugins, []);
});

test("--user --statusline selects both", () => {
  const p = plan({ user: ["markdown"], statusline: true });
  assert.equal(p.statusLine, true);
  assert.deepEqual(p.plugins, [{ name: "markdown", scope: "user" }]);
});

// --no-statusline must parse (allowNo) and, on its own, select nothing — so the
// CLI exits non-zero with "Nothing to do" rather than an unknown-flag error.
// --platform is explicit because a CI runner has neither binary on PATH, and
// auto-detection would error out before the selection check is ever reached.
test("--no-statusline parses and selects nothing", () => {
  const res = spawnSync("node", [
    CLI,
    "--platform",
    "claude",
    "--no-statusline",
  ], {
    encoding: "utf8",
  });
  const out = `${res.stdout}${res.stderr}`;
  assert.notEqual(res.status, 0);
  assert.match(out, /Nothing to do/);
});
