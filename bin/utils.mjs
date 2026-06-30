/**
 * Tool-agnostic utilities shared across the CLI: colored output, an HTTP-JSON
 * fetch, semver comparison, PATH/git probes, a deep merge, an interactive
 * confirm, and the labeled command/step runners. Nothing here knows about any
 * particular AI coding tool — that lives in the per-tool modules (e.g. claude.mjs).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  delimiter,
  join,
} from "node:path";
import * as readline from "node:readline/promises";

// Semantic ANSI colors for human-facing output: green = success/up-to-date,
// yellow = notices/updates-available/skips, red = failures. Disabled when stdout
// is not a TTY (piped/CI) or NO_COLOR is set, so logs stay clean there.
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = code => s => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : `${s}`);
const green = paint("32");
const yellow = paint("33");
const red = paint("31");

// Fetch and parse JSON over HTTP with a bounded timeout. Throws on any failure
// (network down, non-2xx, bad JSON) so callers can hard-error per the offline
// policy.
async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "askviraj-ai-plugins" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.json();
  }
  finally {
    clearTimeout(timer);
  }
}

// Compare semver-ish versions: 1 if a>b, -1 if a<b, 0 if equal. Tolerates a
// leading "v" and a prerelease suffix — a release outranks its prerelease
// (1.2.0 > 1.2.0-rc.1), and prereleases compare dot-segment by segment.
function cmpVer(a, b) {
  const parse = v => {
    const [core, pre = ""] = String(v).replace(/^v/, "").split("-");
    return { nums: core.split(".").map(n => parseInt(n, 10) || 0), pre };
  };
  const va = parse(a);
  const vb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (va.nums[i] || 0) - (vb.nums[i] || 0);
    if (d !== 0) {
      return d > 0 ? 1 : -1;
    }
  }
  if (va.pre === vb.pre) {
    return 0;
  }
  if (!va.pre) {
    return 1; // 1.2.0 > 1.2.0-rc.1
  }
  if (!vb.pre) {
    return -1;
  }
  return cmpPre(va.pre, vb.pre);
}

// Compare two prerelease strings dot-segment by segment: numeric when both
// segments are numeric, lexical otherwise; a shorter run of segments is smaller.
function cmpPre(a, b) {
  const sa = a.split(".");
  const sb = b.split(".");
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const x = sa[i];
    const y = sb[i];
    if (x === undefined) {
      return -1;
    }
    if (y === undefined) {
      return 1;
    }
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) {
      const d = parseInt(x, 10) - parseInt(y, 10);
      if (d !== 0) {
        return d > 0 ? 1 : -1;
      }
    }
    else if (x !== y) {
      return x > y ? 1 : -1;
    }
  }
  return 0;
}

// " → X (update available)" (yellow) when latest beats current, else
// " (latest)" (green).
function updateNote(current, latest) {
  return latest && cmpVer(latest, current) > 0
    ? yellow(`  →  ${latest}  (update available)`)
    : green("  (latest)");
}

// True if `bin` is an executable found on PATH.
function hasBin(bin) {
  return (process.env.PATH || "")
    .split(delimiter)
    .some(dir => dir && existsSync(join(dir, bin)));
}

// True when the current directory is inside a git work tree. Gates
// `graphify hook install`, which attaches a git post-commit hook.
function inGitRepo() {
  const res = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return res.status === 0 && res.stdout.trim() === "true";
}

const isObject = v => v != null && typeof v === "object" && !Array.isArray(v);

// Keys that must never be merged from user-controlled JSON — assigning them
// (e.g. out["__proto__"] = …) would tamper with the prototype chain.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// Deep-merge: objects merge key-by-key; arrays and scalars from `override` win.
// Called as deepMerge(defaults, existing) so existing user values are preserved
// and only missing keys are filled from the defaults. Skips prototype-tampering
// keys defensively (the override may be an attacker-influenced config file).
function deepMerge(base, override) {
  if (!isObject(base) || !isObject(override)) {
    return override === undefined ? base : override;
  }
  const out = { ...base };
  for (const key of Object.keys(override)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }
    out[key] = isObject(base[key]) && isObject(override[key])
      ? deepMerge(base[key], override[key])
      : override[key];
  }
  return out;
}

async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = (await rl.question(`${message} [y/N] `))
      .trim()
      .toLowerCase();
    return answer === "y" || answer === "yes";
  }
  finally {
    rl.close();
  }
}

// Run an external command quietly under a one-line status: prints
// "<label> … ✅" on success, or "<label> … ❌" followed by the captured command
// output on failure. Output is surfaced ONLY on error — success stays a single
// tidy line. Returns true on exit 0. `io` provides log()/error() (the oclif
// command), so this stays tool-agnostic.
//
// With `soft: true` a non-zero exit is treated as a skip (yellow note), not a
// failure — for best-effort steps like refreshing a marketplace we don't own,
// whose only common failure is "not registered".
function runCommand(io, label, cmd, args, { soft = false } = {}) {
  process.stdout.write(`${label} ... `);
  const res = spawnSync(cmd, args, { encoding: "utf8" });
  if (res.error) {
    io.log(red("❌"));
    io.error(`Failed to run ${cmd}: ${res.error.message}`);
  }
  if (res.status === 0) {
    io.log(green("✅ OK"));
    return true;
  }
  const out = `${res.stdout || ""}${res.stderr || ""}`.trim();
  if (soft) {
    io.log(yellow("skipped"));
    return false;
  }
  io.log(red("❌ FAILED"));
  if (out) {
    io.log(out);
  }
  return false;
}

// Run a local (file/config) step under the same one-line status as runCommand:
// "<label> … ✅ OK" on success, or "<label> … ❌" on failure, letting the thrown
// error propagate so oclif prints it. `fn` may be sync or async.
async function step(io, label, fn) {
  process.stdout.write(`${label} ... `);
  try {
    await fn();
    io.log(green("✅ OK"));
  }
  catch (e) {
    io.log(red("❌ FAILED"));
    throw e;
  }
}

export {
  cmpPre,
  cmpVer,
  confirm,
  deepMerge,
  fetchJson,
  green,
  hasBin,
  inGitRepo,
  isObject,
  red,
  runCommand,
  step,
  updateNote,
  yellow,
};
