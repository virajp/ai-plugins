// Integration tests for the OpenCode install target (bin/opencode.mjs), driven
// through the CLI entrypoint the way a user runs it. Hermetic — a temp fake
// HOME, and AI_PLUGINS_SOURCE_DIR pointed at this checkout so no network or
// tarball is involved. Run via `node --test`.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
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
const REPO = join(HERE, "..");
const CLI = join(REPO, "bin", "installer.mjs");

const tmp = mkdtempSync(join(tmpdir(), "opencode-test-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

const fakeHome = join(tmp, "home");
const configDir = join(fakeHome, ".config", "opencode");

// Run the CLI against the fake HOME with the local checkout as plugin source.
function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    cwd: REPO,
    env: {
      ...process.env,
      HOME: fakeHome,
      AI_PLUGINS_SOURCE_DIR: REPO,
      NO_COLOR: "1",
    },
  });
}

const readConfig = () =>
  JSON.parse(readFileSync(join(configDir, "opencode.json"), "utf8"));

test("install renders skills, rewrites plugin root, and wires config", () => {
  const res = runCli([
    "--platform",
    "opencode",
    "--user",
    "vwf",
    "--user",
    "context7",
  ]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  // Skills + assets landed under ai-plugins/vwf.
  const vwfDir = join(configDir, "ai-plugins", "vwf");
  assert.ok(existsSync(join(vwfDir, "skills", "blueprint", "SKILL.md")));
  assert.ok(existsSync(join(vwfDir, "assets", "templates", "entity.md")));
  assert.ok(existsSync(join(vwfDir, ".version")));
  // Claude-only surfaces are not rendered.
  assert.ok(!existsSync(join(vwfDir, "agents")));
  assert.ok(!existsSync(join(vwfDir, "hooks")));

  // Every ${CLAUDE_PLUGIN_ROOT} was expanded to the installed absolute path.
  const leftover = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      }
      else if (
        entry.name.endsWith(".md")
        && readFileSync(p, "utf8").includes("${CLAUDE_PLUGIN_ROOT}")
      ) {
        leftover.push(p);
      }
    }
  };
  walk(vwfDir);
  assert.deepEqual(leftover, [], "unrewritten ${CLAUDE_PLUGIN_ROOT} refs");
  const blueprint = readFileSync(
    join(vwfDir, "skills", "blueprint", "SKILL.md"),
    "utf8",
  );
  assert.ok(blueprint.includes(vwfDir), "rewritten refs point at install dir");

  // Command wrappers exist exactly for the disable-model-invocation skills.
  const wrappers = readdirSync(join(configDir, "command")).filter(f =>
    f.startsWith("vwf-")
  );
  assert.equal(wrappers.length, 14);
  assert.ok(wrappers.includes("vwf-blueprint.md"));
  // Doctrine skills get no wrapper.
  assert.ok(!wrappers.includes("vwf-blueprint-authoring.md"));
  const wrapper = readFileSync(
    join(configDir, "command", "vwf-blueprint.md"),
    "utf8",
  );
  assert.ok(wrapper.includes("$ARGUMENTS"));
  assert.ok(wrapper.startsWith("---\ndescription:"));

  // opencode.json: skills.paths + context7 MCP, with the schema set.
  const config = readConfig();
  assert.equal(config.$schema, "https://opencode.ai/config.json");
  assert.deepEqual(config.skills.paths, ["~/.config/opencode/ai-plugins"]);
  assert.deepEqual(config.mcp.context7, {
    type: "local",
    command: ["pnpm", "dlx", "@upstash/context7-mcp"],
  });
});

test("reinstall is idempotent and preserves foreign config keys", () => {
  // Plant a foreign key + a user skills path; re-run the same install.
  const config = readConfig();
  config.theme = "custom";
  config.skills.paths.push("~/my-skills");
  writeFileSync(
    join(configDir, "opencode.json"),
    JSON.stringify(config, null, 2),
  );

  const res = runCli(["--platform", "opencode", "--user", "vwf"]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  const after2 = readConfig();
  assert.equal(after2.theme, "custom");
  assert.deepEqual(after2.skills.paths, [
    "~/.config/opencode/ai-plugins",
    "~/my-skills",
  ]);
  // No duplicate ai-plugins path was appended.
  assert.equal(
    after2.skills.paths.filter(p => p.includes("ai-plugins")).length,
    1,
  );
});

test("url-sourced plugins are rejected for opencode", () => {
  const res = runCli(["--platform", "opencode", "--user", "mempalace"]);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr + res.stdout, /url-sourced/);
});

test("uninstall removes skills, wrappers, and our config entries", () => {
  const res = runCli([
    "--platform",
    "opencode",
    "--uninstall",
    "--user",
    "vwf",
    "--user",
    "context7",
  ]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  assert.ok(!existsSync(join(configDir, "ai-plugins", "vwf")));
  assert.ok(!existsSync(join(configDir, "ai-plugins")));
  const wrappers = existsSync(join(configDir, "command"))
    ? readdirSync(join(configDir, "command")).filter(f => f.startsWith("vwf-"))
    : [];
  assert.deepEqual(wrappers, []);

  // Foreign keys survive; ours are gone.
  const config = readConfig();
  assert.equal(config.theme, "custom");
  assert.deepEqual(config.skills.paths, ["~/my-skills"]);
  assert.equal(config.mcp, undefined);
});

test("--statusline with opencode-only platform is a noted no-op", () => {
  const res = runCli(["--platform", "opencode", "--statusline"]);
  // Nothing selected for opencode → "Nothing to do" error, after the note.
  assert.notEqual(res.status, 0);
  assert.match(res.stdout, /Claude Code-only/);
});
