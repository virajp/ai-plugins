// Integration tests for the OpenCode install target (bin/opencode.mjs), driven
// through the CLI entrypoint the way a user runs it. Hermetic — a temp fake
// HOME, and AI_PLUGINS_SOURCE_DIR pointed at this checkout so no network or
// tarball is involved. Run via `node --test`.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
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
// The CLI runs from a tmp project dir so project-scoped surfaces (.opencode/)
// land under tmp, never in this repo.
const projDir = join(tmp, "proj");
mkdirSync(projDir, { recursive: true });

// checkDeps requires the platform binary plus each selected plugin's runtime
// tools on PATH. A CI runner has none of them, so seed no-op fakes — the tests
// exercise the render pipeline, not the dependency gate (i:test covers that
// under a node-only PATH).
const fakeBin = join(tmp, "bin");
mkdirSync(fakeBin, { recursive: true });
for (const bin of ["opencode", "rtk", "mise", "pnpm", "uv"]) {
  writeFileSync(join(fakeBin, bin), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
}
// The fake graphify emulates the real CLI's opencode behavior: it writes its
// JS plugin at PROJECT level (into its cwd) — the installer must harvest and
// relocate it to the user level.
writeFileSync(
  join(fakeBin, "graphify"),
  `#!/bin/sh
if [ "$1" = "install" ] && [ "$3" = "opencode" ]; then
  mkdir -p .opencode/plugins
  echo "export const GraphifyPlugin = () => ({})" > .opencode/plugins/graphify.js
fi
exit 0
`,
  { mode: 0o755 },
);

// Fake upstream checkout for the url-sourced mempalace plugin (the installer
// reads $AI_PLUGINS_UPSTREAM_DIR/<plugin>/ instead of fetching its tarball).
const upstreamDir = join(tmp, "upstream");
const fakeMempalace = join(upstreamDir, "mempalace");
mkdirSync(join(fakeMempalace, ".claude-plugin"), { recursive: true });
mkdirSync(join(fakeMempalace, "skills", "mempalace"), { recursive: true });
mkdirSync(join(fakeMempalace, "integrations", "shared"), { recursive: true });
writeFileSync(
  join(fakeMempalace, ".claude-plugin", "plugin.json"),
  JSON.stringify({
    name: "mempalace",
    version: "9.9.9",
    mcpServers: { mempalace: { command: "mempalace-mcp" } },
  }),
);
writeFileSync(
  join(fakeMempalace, "skills", "mempalace", "SKILL.md"),
  "---\nname: mempalace\ndescription: fake\n---\nbody\n",
);
writeFileSync(
  join(fakeMempalace, "integrations", "shared", "recall-protocol.md"),
  "protocol\n",
);

// Run the CLI against the fake HOME with the local checkout as plugin source.
function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    cwd: projDir,
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
      HOME: fakeHome,
      AI_PLUGINS_SOURCE_DIR: REPO,
      AI_PLUGINS_UPSTREAM_DIR: upstreamDir,
      NO_COLOR: "1",
    },
  });
}

// New configs are created as opencode.jsonc (preferred by OpenCode's merge).
const configPath = join(configDir, "opencode.jsonc");
const readConfig = () => JSON.parse(readFileSync(configPath, "utf8"));

test("install renders skills, rewrites plugin root, and wires config", () => {
  const res = runCli([
    "--platform",
    "opencode",
    "--user",
    "vwf",
    "--user",
    "context7",
    "--user",
    "typescript",
  ]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  // Skills + assets landed under virajp-plugins/vwf. Workflow skills
  // (disable-model-invocation) are segregated to commands/<n>/index.md so
  // OpenCode's **/SKILL.md discovery never lists them to the model; doctrine
  // skills stay under skills/.
  const vwfDir = join(configDir, "virajp-plugins", "vwf");
  assert.ok(existsSync(join(vwfDir, "commands", "blueprint", "index.md")));
  assert.ok(!existsSync(join(vwfDir, "skills", "blueprint")));
  assert.ok(
    existsSync(join(vwfDir, "skills", "blueprint-authoring", "SKILL.md")),
  );
  assert.ok(existsSync(join(vwfDir, "assets", "templates", "entity.md")));
  assert.ok(existsSync(join(vwfDir, ".version")));
  // Claude-only surfaces are not rendered.
  assert.ok(!existsSync(join(vwfDir, "agents")));
  assert.ok(!existsSync(join(vwfDir, "hooks")));
  // vwf's plugin dependencies were expanded — including the url-sourced
  // mempalace, rendered from its (fake) upstream checkout.
  assert.ok(existsSync(join(configDir, "virajp-plugins", "markdown")));
  assert.ok(existsSync(join(configDir, "virajp-plugins", "mise")));
  const mpDir = join(configDir, "virajp-plugins", "mempalace");
  assert.ok(existsSync(join(mpDir, "skills", "mempalace", "SKILL.md")));
  assert.ok(
    existsSync(join(mpDir, "integrations", "shared", "recall-protocol.md")),
  );
  assert.equal(readFileSync(join(mpDir, ".version"), "utf8").trim(), "9.9.9");
  // Its Claude hooks are replaced by the bundled OpenCode plugin, and its MCP
  // server runs through mise.
  assert.ok(existsSync(join(configDir, "plugin", "mempalace-hooks.js")));
  // graphify was harvested from its CLI (which writes project-level files)
  // and relocated to the USER-level plugin dir; the project got nothing.
  assert.ok(existsSync(join(configDir, "plugin", "graphify.js")));
  assert.ok(!existsSync(join(projDir, ".opencode")));

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
    join(vwfDir, "commands", "blueprint", "index.md"),
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

  // opencode.jsonc: skills.paths + context7 MCP + typescript lsp override,
  // with the schema set.
  assert.ok(existsSync(configPath), "opencode.jsonc created");
  assert.ok(!existsSync(join(configDir, "opencode.json")));
  const config = readConfig();
  assert.equal(config.$schema, "https://opencode.ai/config.json");
  assert.deepEqual(config.skills.paths, ["~/.config/opencode/virajp-plugins"]);
  assert.deepEqual(config.mcp.context7, {
    type: "local",
    command: ["pnpm", "dlx", "@upstash/context7-mcp"],
  });
  assert.deepEqual(config.mcp.mempalace, {
    type: "local",
    command: ["mise", "x", "--", "mempalace-mcp"],
  });
  // Derived from plugins/typescript plugin.json lspServers (typescript-lsp →
  // the OpenCode built-in id "typescript") and stamped beside the render.
  assert.ok(
    existsSync(join(configDir, "virajp-plugins", "typescript", ".lsp.json")),
  );
  assert.equal(config.lsp.typescript.command[0], "mise");
  assert.ok(
    config.lsp.typescript.command.includes("typescript-language-server"),
  );
  assert.ok(config.lsp.typescript.extensions.includes(".ts"));
});

test("reinstall is idempotent and preserves foreign config keys", () => {
  // Plant a foreign key + a user skills path; re-run the same install.
  const config = readConfig();
  config.theme = "custom";
  config.skills.paths.push("~/my-skills");
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const res = runCli(["--platform", "opencode", "--user", "vwf"]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  const after2 = readConfig();
  assert.equal(after2.theme, "custom");
  assert.deepEqual(after2.skills.paths, [
    "~/.config/opencode/virajp-plugins",
    "~/my-skills",
  ]);
  // No duplicate virajp-plugins path was appended.
  assert.equal(
    after2.skills.paths.filter(p => p.includes("virajp-plugins")).length,
    1,
  );
});

test("unsupported url-sourced plugins are rejected for opencode", () => {
  const res = runCli([
    "--platform",
    "opencode",
    "--user",
    "andrej-karpathy-skills",
  ]);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr + res.stdout, /url-sourced/);
});

test("uninstall removes skills, wrappers, and our config entries", () => {
  // Deps are NOT auto-uninstalled (matching Claude Code) — name everything.
  const res = runCli([
    "--platform",
    "opencode",
    "--uninstall",
    "--user",
    "vwf",
    "--user",
    "context7",
    "--user",
    "typescript",
    "--user",
    "markdown",
    "--user",
    "mise",
    "--user",
    "mempalace",
  ]);
  assert.equal(res.status, 0, res.stderr || res.stdout);

  assert.ok(!existsSync(join(configDir, "virajp-plugins", "vwf")));
  assert.ok(!existsSync(join(configDir, "virajp-plugins")));
  const wrappers = existsSync(join(configDir, "command"))
    ? readdirSync(join(configDir, "command")).filter(f => f.startsWith("vwf-"))
    : [];
  assert.deepEqual(wrappers, []);

  // Foreign keys survive; ours are gone.
  const config = readConfig();
  assert.equal(config.theme, "custom");
  assert.deepEqual(config.skills.paths, ["~/my-skills"]);
  assert.equal(config.mcp, undefined);
  assert.equal(config.lsp, undefined);
  assert.ok(!existsSync(join(configDir, "plugin", "mempalace-hooks.js")));
});

test("a commented jsonc config is only rewritten with --yes", () => {
  writeFileSync(
    configPath,
    `{
  // keep me if you can
  "theme": "custom",
}
`,
  );

  // Without --yes (stdin closed → declined): config text untouched.
  const declined = runCli(["--platform", "opencode", "--user", "markdown"]);
  assert.equal(declined.status, 0, declined.stderr || declined.stdout);
  assert.ok(readFileSync(configPath, "utf8").includes("// keep me"));

  // With --yes: rewritten (comment dropped), foreign key + our entries present.
  const res = runCli(["--platform", "opencode", "--user", "markdown", "--yes"]);
  assert.equal(res.status, 0, res.stderr || res.stdout);
  const config = readConfig();
  assert.equal(config.theme, "custom");
  assert.deepEqual(config.skills.paths, ["~/.config/opencode/virajp-plugins"]);
  assert.ok(!readFileSync(configPath, "utf8").includes("// keep me"));
});

test("--project mempalace is redirected to user scope", () => {
  const res = runCli([
    "--platform",
    "opencode",
    "--project",
    "mempalace",
    "--yes",
  ]);
  assert.equal(res.status, 0, res.stderr || res.stdout);
  assert.match(res.stdout, /USER scope only/);
  // Rendered at the GLOBAL config dir, nothing project-scoped.
  assert.ok(
    existsSync(join(configDir, "virajp-plugins", "mempalace", ".version")),
  );
  assert.ok(!existsSync(join(projDir, ".opencode")));
});

test("--statusline with opencode-only platform is a noted no-op", () => {
  const res = runCli(["--platform", "opencode", "--statusline"]);
  // Nothing selected for opencode → "Nothing to do" error, after the note.
  assert.notEqual(res.status, 0);
  assert.match(res.stdout, /Claude Code-only/);
});
