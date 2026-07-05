/**
 * Claude Code support for the CLI: marketplace + plugin install/upgrade/uninstall
 * and the powerline statusline (script, config, settings.json keys, context-caps
 * hook). All of it is encapsulated in the `ClaudeCode` tool class.
 *
 * The class is written as one concrete implementation of a generic "AI coding
 * tool" shape, so other tools (e.g. another editor's plugin system) can be added
 * later as sibling modules exposing the same surface. The CLI entrypoint
 * (installer.mjs) only ever talks to a tool through these methods:
 *
 *   resolvePlan(flags)      → a plan {plugins, statusLine, subagentStatusLine}
 *   hasSelection(plan)      → was anything selected to act on?
 *   install(plan, flags)    → run the install phase; returns upgrade state
 *   upgrade(...state)       → upgrade what is already installed
 *   uninstall(plan)         → remove what this CLI installed
 *   printVersions()         → report installed vs latest
 *
 * Every method receives the shared io (the oclif command) via the constructor and
 * uses it for log()/error()/exit()/config — keeping this module free of oclif's
 * command machinery while reusing its output + exit handling.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import {
  dirname,
  join,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
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
} from "./utils.mjs";

// ESM has no __dirname; derive it from this module's URL.
const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRIPTS_DIR = join(homedir(), ".claude", "scripts");
const SETTINGS_PATH = join(homedir(), ".claude", "settings.json");
const INSTALLED_SCRIPT = join(SCRIPTS_DIR, "statusline");
const USER_CONFIG_PATH = join(homedir(), ".config", "statusline.json");
const ASSETS_DIR = join(__dirname, "..", "tools", "statusline");

// Written verbatim per docs/statusline.md. ${HOME} is expanded by the shell when
// Claude Code runs the statusLine command.
const COMMAND = "${HOME}/.claude/scripts/statusline";

const STATUS_LINE = {
  type: "command",
  command: COMMAND,
  padding: 0,
  refreshInterval: 4,
};

const SUBAGENT_STATUS_LINE = {
  type: "command",
  command: COMMAND,
};

// Context-caps PostToolUse hook — bundled with the main `statusLine`. The
// statusline mirrors context_window / rate_limits to a per-session file under
// AI_PLUGINS_USAGE_DIR; this hook reads it and halts work (via vwf:handoff) when
// a context or rate-limit cap is hit. Its sensor is the main status bar's
// writer, so it only installs with `statusLine` (not the subagent panel), and is
// inert until that statusline is running.
const HOOKS_DIR = join(homedir(), ".claude", "hooks");
const INSTALLED_HOOK = join(HOOKS_DIR, "context-caps.js");
const USAGE_ENV_KEY = "AI_PLUGINS_USAGE_DIR";
// ${HOME} is expanded by Claude Code (env + command), and again defensively
// node-side by both the statusline writer and the hook.
const USAGE_DIR = "${HOME}/.claude/usage";
const HOOK_COMMAND = "node ${HOME}/.claude/hooks/context-caps.js";

// GitHub shorthand passed to `claude plugin marketplace add`, and the marketplace
// name it resolves to (used as `<plugin>@<name>` when installing).
const MARKETPLACE_REF = "virajp/ai-plugins";
const MARKETPLACE_NAME = "virajp-plugins";

// Sources for the latest versions (used by --version and --upgrade): the
// marketplace manifest on the repo's main branch, and the published CLI on npm.
const REMOTE_MARKETPLACE_URL =
  "https://raw.githubusercontent.com/virajp/ai-plugins/main/.claude-plugin/marketplace.json";
const NPM_LATEST_URL = "https://registry.npmjs.org/@askviraj/ai-plugins/latest";

// All plugins published by the virajp-plugins marketplace.
const PLUGINS = [
  "vwf",
  "markdown",
  "typescript",
  "flutter",
  "context7",
  "mempalace",
  "mise",
  "github-actions",
  "andrej-karpathy-skills",
];

// Plugins that install at project scope by default; everything else is
// user-scoped. The marketplace itself is always user-scoped. --all installs
// only the user-scoped set; project-scoped plugins are reached via --project.
const PROJECT_SCOPED = new Set(["flutter"]);
const scopeFor = name => (PROJECT_SCOPED.has(name) ? "project" : "user");

// Opt-in plugins: excluded from --all and installed only when named explicitly
// via --user or --project (scope is the user's choice — unlike PROJECT_SCOPED
// they carry no forced default scope). Used for external, re-listed plugins that
// shouldn't ride along with a bulk install (e.g. andrej-karpathy-skills).
const OPT_IN = new Set(["andrej-karpathy-skills"]);

// --all only acts on the user-scoped set: every plugin that is neither
// project-scoped nor opt-in. Project-scoped and opt-in plugins are deliberate
// choices, so they are never installed in bulk — they must be named explicitly
// (--project <name> for project-scoped; --user/--project <name> for opt-in).
const USER_SCOPED = PLUGINS.filter(
  name => !PROJECT_SCOPED.has(name) && !OPT_IN.has(name),
);

// How to install each external tool we depend on (matches this toolchain: mise
// drives runtime tools; rtk ships as a brew formula).
const DEP_HINTS = {
  brew:
    "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
  mise: "brew install mise",
  claude: "mise use -g claude-code@latest",
  opencode: "mise use -g opencode@latest",
  tar: "ships with macOS/Linux — install via your OS package manager",
  rtk: "brew install --formulae rtk",
  pnpm: "mise use -g pnpm@latest",
  node: "mise use -g node@latest",
  graphify: "mise use -g pipx:graphifyy@latest",
  uv: "mise use -g uv@latest",
  "kotlin-lsp":
    "install a kotlin-lsp binary on PATH — https://github.com/Kotlin/kotlin-lsp",
  "sourcekit-lsp":
    "ships with Xcode or a swift.org toolchain — https://www.swift.org/install",
};

// The only tool required for ANY plugin/marketplace install: `claude` is the
// install mechanism itself. Everything else is per-plugin (PLUGIN_EXTRA_DEPS).
const CORE_DEPS = ["claude"];

// Plugin → plugin dependencies, mirroring the marketplace manifest
// (plugins:check asserts the sync). Claude Code auto-installs these itself;
// the OpenCode target expands them explicitly at plan time.
const PLUGIN_DEPS = {
  vwf: ["context7", "markdown", "mempalace", "mise"],
};

// The external runtime tools each plugin needs — checked ONLY when that plugin
// is in the install set. A plugin with no external tool (markdown) is absent. A
// plugin that pulls others in rolls up their tools too: vwf → context7's pnpm,
// mempalace's uv, and the mise plugin's mise.
const PLUGIN_EXTRA_DEPS = {
  vwf: ["rtk", "graphify", "mise", "pnpm", "uv"],
  typescript: ["mise", "pnpm"],
  context7: ["pnpm"],
  flutter: ["mise", "kotlin-lsp", "sourcekit-lsp"],
  mempalace: ["uv"],
  mise: ["mise"],
  "github-actions": ["mise"],
};

// Map of plugin name → latest version from the remote marketplace manifest
// (null for url-sourced entries like mempalace, which pin no version here).
async function remoteLatest() {
  const mp = await fetchJson(REMOTE_MARKETPLACE_URL);
  const out = {};
  for (const p of mp.plugins || []) {
    out[p.name] = p.version || null;
  }
  return out;
}

// Map of plugin name → installed version from `claude plugin list --json`,
// restricted to the virajp-plugins marketplace. Each entry's `id` is
// `<name>@<marketplace>`. Throws if claude fails or its output isn't JSON.
function installedPlugins() {
  const res = spawnSync("claude", ["plugin", "list", "--json"], {
    encoding: "utf8",
  });
  if (res.error || res.status !== 0) {
    throw new Error(
      "`claude plugin list --json` failed — is the claude CLI installed?",
    );
  }
  let list;
  try {
    list = JSON.parse(res.stdout || "[]");
  }
  catch {
    throw new Error("Could not parse `claude plugin list --json` output.");
  }
  const out = {};
  for (const entry of Array.isArray(list) ? list : []) {
    const id = entry && entry.id;
    if (typeof id !== "string") {
      continue;
    }
    const at = id.lastIndexOf("@");
    if (at < 1) {
      continue;
    }
    if (id.slice(at + 1) === MARKETPLACE_NAME) {
      out[id.slice(0, at)] = { version: entry.version, scope: entry.scope };
    }
  }
  return out;
}

// The version column for one plugin given its installed and latest versions.
function pluginVersionLine(installed, latest) {
  if (!latest) {
    return installed
      ? `${installed}  ${yellow("(external; not tracked here)")}`
      : yellow("not installed  (external)");
  }
  if (!installed) {
    return yellow(`not installed  (latest ${latest})`);
  }
  return `${installed}${updateNote(installed, latest)}`;
}

// The tools that must be present for the resolved install plan.
function requiredTools({ plugins, statusLine, subagentStatusLine }) {
  const tools = new Set();
  if (plugins.length) {
    for (const d of CORE_DEPS) {
      tools.add(d);
    }
  }
  for (const p of plugins) {
    for (const d of PLUGIN_EXTRA_DEPS[p.name] || []) {
      tools.add(d);
    }
  }
  if (statusLine || subagentStatusLine) {
    tools.add("node");
  }
  return [...tools];
}

// True when an existing statusline setting already points at our script. Compares
// only `type` and `command` — the statusline's identity — so user-tuned fields
// (padding, refreshInterval) don't count as a mismatch and an already-installed
// statusline is left untouched instead of prompting to overwrite.
function statuslineMatches(existing, value) {
  return isObject(existing)
    && existing.type === value.type
    && existing.command === value.command;
}

// vwf's workflow skills rely on graphify's knowledge graph, so a vwf install
// or upgrade wires graphify into the target platform (graphify supports both
// `claude` and `opencode`). `graphify install` works anywhere and always runs;
// `graphify hook install` attaches a git post-commit hook, so it runs only
// inside a git repo and is skipped (with a note) otherwise. Both commands are
// idempotent, so re-running on every upgrade self-heals the setup. Soft-skips
// entirely when graphify isn't on PATH — checkDeps guarantees it for installs,
// but the upgrade-only path does not run that gate.
function setupGraphify(io, platform) {
  if (!hasBin("graphify")) {
    process.stdout.write("Setting up graphify ... ");
    io.log(
      yellow(`skipped (graphify not on PATH — install: ${DEP_HINTS.graphify})`),
    );
    return;
  }
  runCommand(
    io,
    `Installing graphify for ${platform}`,
    "graphify",
    ["install", "--platform", platform],
  );
  if (inGitRepo()) {
    runCommand(
      io,
      "Installing graphify post-commit hook",
      "graphify",
      ["hook", "install"],
    );
  }
  else {
    process.stdout.write("Installing graphify post-commit hook ... ");
    io.log(yellow("skipped (not a git repo)"));
  }
}

class ClaudeCode {
  // `io` is the oclif command — provides log(), error(), exit(), and config.
  constructor(io) {
    this.io = io;
  }

  // True when the plan selects anything to act on (plugins or either statusline).
  hasSelection(plan) {
    return Boolean(
      plan.plugins.length || plan.statusLine || plan.subagentStatusLine,
    );
  }

  // Run the install phase: check deps, install the selected plugins, and install
  // the statusline. Returns the state a following --upgrade needs so it can skip
  // the redundant marketplace refresh / graphify setup this run already did.
  async install(plan, flags) {
    this.checkDeps(plan);
    let marketplaceRefreshed = false;
    let graphifyConfigured = false;
    if (plan.plugins.length) {
      marketplaceRefreshed = this.installPlugins(plan.plugins);
      graphifyConfigured = plan.plugins.some(p => p.name === "vwf");
    }
    if (plan.statusLine || plan.subagentStatusLine) {
      await this.installStatusline(plan, flags.yes);
    }
    return { marketplaceRefreshed, graphifyConfigured };
  }

  // Print the CLI version (vs npm latest), the bundled statusline version, and
  // each plugin's installed version (from `claude plugin list`) vs the latest in
  // the remote marketplace, flagging updates. Errors out cleanly if the network
  // or the claude CLI is unavailable.
  async printVersions() {
    if (!hasBin("claude")) {
      this.io.error("claude CLI not found. Install it first, then re-run.");
    }
    const cli = this.io.config.version;
    let cliLatest, latest, installed;
    try {
      cliLatest = (await fetchJson(NPM_LATEST_URL)).version;
      latest = await remoteLatest();
      installed = installedPlugins();
    }
    catch (e) {
      this.io.error(
        `Version check failed (network or claude unavailable): ${e.message}`,
      );
    }

    this.io.log(`${this.io.config.name}  ${cli}${updateNote(cli, cliLatest)}`);
    this.io.log(`  ${"statusline".padEnd(16)} ${cli}  (bundled with the CLI)`);

    this.io.log(`\nPlugins (${MARKETPLACE_NAME}):`);
    for (const name of PLUGINS) {
      const inst = installed[name];
      // Tag installed plugins with the scope they live at (e.g. "flutter (project)").
      const label = inst && inst.scope ? `${name} (${inst.scope})` : name;
      this.io.log(
        `  ${label.padEnd(20)} ${
          pluginVersionLine(inst && inst.version, latest[name])
        }`,
      );
    }
  }

  // Upgrade every installed virajp-plugins plugin to its latest version, re-assert
  // graphify's setup (when vwf is installed), refresh the statusline (if installed)
  // to this CLI's bundled version, and note a newer CLI. Runs after the install
  // phase, so newly installed plugins are already
  // latest and only pre-existing ones get bumped. Installing missing plugins is
  // the install flags' job — this only upgrades what is present. Errors out if
  // the network or the claude CLI is unavailable.
  async upgrade(marketplaceRefreshed = false, graphifyConfigured = false) {
    if (!hasBin("claude")) {
      this.io.error("claude CLI not found. Install it first, then re-run.");
    }
    // Fail fast (cleanly) on the remote reads before mutating anything.
    let latest, cliLatest, installed;
    try {
      latest = await remoteLatest();
      cliLatest = (await fetchJson(NPM_LATEST_URL)).version;
      installed = installedPlugins();
    }
    catch (e) {
      this.io.error(
        `Upgrade check failed (network or claude unavailable): ${e.message}`,
      );
    }
    const ours = PLUGINS.filter(name => installed[name]);

    // The install phase already refreshed the marketplace, so only refresh it
    // here when this run skipped the install phase.
    if (!marketplaceRefreshed) {
      this.runClaude(
        `Upgrading marketplace ${MARKETPLACE_NAME}`,
        ["plugin", "marketplace", "update", MARKETPLACE_NAME],
      );
    }

    if (!ours.length) {
      this.io.log(
        yellow("No virajp-plugins plugins are installed — nothing to upgrade."),
      );
    }
    else {
      let updated = 0;
      for (const name of ours) {
        const have = installed[name].version;
        const want = latest[name];
        // Act at (and show) the scope the plugin is actually installed at —
        // project for flutter, user for the rest. `plugin update` defaults to user
        // scope and fails otherwise. Fall back to the per-plugin default scope.
        const scope = installed[name].scope || scopeFor(name);
        if (want && cmpVer(want, have) > 0) {
          this.runClaude(
            `Updating ${name} (${scope}, ${have} → ${want})`,
            [
              "plugin",
              "update",
              `${name}@${MARKETPLACE_NAME}`,
              "--scope",
              scope,
            ],
          );
          updated++;
        }
        else {
          this.io.log(
            green(
              `${name} (${scope}) is up to date (${have}${
                want ? "" : ", external"
              }).`,
            ),
          );
        }
      }
      if (updated) {
        this.io.log(
          green("\nPlugin updates applied — restart Claude Code to load them."),
        );
      }
    }

    // Re-assert graphify's Claude Code integration + post-commit hook (idempotent)
    // whenever vwf is installed, so an upgrade self-heals the setup — unless the
    // install phase already did it this run.
    if (!graphifyConfigured && ours.includes("vwf")) {
      this.setupGraphify();
    }

    // Refresh the installed statusline script + config (no settings.json change).
    if (existsSync(INSTALLED_SCRIPT)) {
      this.io.log(green("\nRefreshing statusline…"));
      await this.installScript();
      await this.seedUserConfig();
    }

    if (cmpVer(cliLatest, this.io.config.version) > 0) {
      this.io.log(
        yellow(
          `\nA newer CLI is available: ${this.io.config.version} → ${cliLatest}`,
        ),
      );
      this.io.log(
        yellow("Re-run with: pnpx @askviraj/ai-plugins@latest --upgrade"),
      );
    }
  }

  // Uninstall mode (mirrors the install selection): remove the selected plugins
  // via claude and/or strip the statusline. Reverses what the CLI installed; it
  // never touches external tools, since the CLI never installs those.
  async uninstall(plan) {
    if (plan.plugins.length) {
      if (!hasBin("claude")) {
        this.io.error("claude CLI not found. Install it first, then re-run.");
      }
      for (const { name, scope } of plan.plugins) {
        this.runClaude(
          `Uninstalling ${name} (${scope} scope)`,
          [
            "plugin",
            "uninstall",
            "--scope",
            scope,
            "--yes",
            `${name}@${MARKETPLACE_NAME}`,
          ],
        );
      }
    }
    if (plan.statusLine || plan.subagentStatusLine) {
      await this.uninstallStatusline(plan);
    }
  }

  // Remove the requested statusline key(s) from settings.json; once no statusline
  // key remains, delete the installed script too. The seeded ~/.config file is
  // left in place (it may hold user edits) — note how to remove it.
  async uninstallStatusline(plan) {
    const settings = await this.readSettings();
    let changed = false;
    for (const key of ["statusLine", "subagentStatusLine"]) {
      const want = key === "statusLine"
        ? plan.statusLine
        : plan.subagentStatusLine;
      if (want && settings[key] !== undefined) {
        await step(this.io, `Removing ${key}`, () => {
          delete settings[key];
        });
        changed = true;
      }
    }
    // Context-caps is bundled with the main statusLine — remove it alongside.
    if (plan.statusLine && (await this.uninstallContextCaps(settings))) {
      changed = true;
    }
    if (changed) {
      await this.writeSettings(settings);
    }

    if (
      settings.statusLine === undefined
      && settings.subagentStatusLine === undefined
      && existsSync(INSTALLED_SCRIPT)
    ) {
      await step(this.io, "Removing statusline script", async () => {
        await rm(INSTALLED_SCRIPT, { force: true });
      });
      this.io.log(
        `Left ${USER_CONFIG_PATH} in place — delete it manually for a full reset.`,
      );
    }
  }

  // Turn the parsed flags into a concrete plan: the plugins to act on (each with
  // its scope) and whether to touch the statusline. --all selects every
  // user-scoped plugin (at user scope); --user/--project name plugins at the
  // matching scope. --statusline drives both statusline keys (one merged flag).
  resolvePlan(flags) {
    let plugins;
    if (flags.all) {
      plugins = USER_SCOPED.map(name => ({ name, scope: "user" }));
    }
    else {
      const named = [
        ...(flags.user ?? []).map(name => ({ name, scope: "user" })),
        ...(flags.project ?? []).map(name => ({ name, scope: "project" })),
      ];
      // This CLI installs ONLY from the virajp-plugins marketplace, so names must
      // be bare — reject any `@marketplace` / path qualifier outright.
      const qualified = named.filter(p => /[@/]/.test(p.name)).map(p => p.name);
      if (qualified.length) {
        this.io.error(
          `Plugin names must be bare (e.g. "vwf") — this CLI installs only from `
            + `the ${MARKETPLACE_NAME} marketplace and cannot target another. `
            + `Drop the qualifier from: ${qualified.join(", ")}`,
        );
      }
      const invalid = named.filter(p => !PLUGINS.includes(p.name)).map(p =>
        p.name
      );
      if (invalid.length) {
        this.io.error(
          `Unknown plugin(s): ${[...new Set(invalid)].join(", ")}. Valid: ${
            PLUGINS.join(", ")
          }`,
        );
      }
      // A name can't be requested at both scopes.
      const both = (flags.user ?? []).filter(n =>
        (flags.project ?? []).includes(n)
      );
      if (both.length) {
        this.io.error(
          `Cannot install at both --user and --project: ${
            [...new Set(both)].join(", ")
          }`,
        );
      }
      // Dedupe a name repeated within one scope.
      const seen = new Set();
      plugins = named.filter(p => !seen.has(p.name) && seen.add(p.name));
    }
    return {
      plugins,
      statusLine: flags.statusline,
      subagentStatusLine: flags.statusline,
    };
  }

  // Verify every tool the plan needs is on PATH. If any are missing, print the
  // install command for each and exit so the user installs them and re-runs.
  checkDeps(plan) {
    const missing = requiredTools(plan).filter(t => !hasBin(t));
    if (!missing.length) {
      return;
    }
    this.io.log(
      red("\nMissing required dependencies — install these, then re-run:\n"),
    );
    for (const t of missing) {
      this.io.log(`  ${yellow(t)}`);
      this.io.log(`    ${DEP_HINTS[t] || "see project docs"}`);
    }
    this.io.exit(1);
  }

  // Add the marketplace (user scope), refresh it, then install each plugin at its
  // scope. `marketplace add` is a no-op when the marketplace already exists on
  // disk — it does NOT pull the latest manifest — so a newly published plugin
  // would 404 against the stale local copy; always `marketplace update` after.
  // Returns true (the marketplace is now refreshed) so a following --upgrade can
  // skip its redundant refresh. `plugins` is a list of `{name, scope}`; the
  // marketplace itself is always added user-scoped.
  installPlugins(plugins) {
    this.runClaude(
      `Adding marketplace ${MARKETPLACE_NAME} (user scope)`,
      ["plugin", "marketplace", "add", "--scope", "user", MARKETPLACE_REF],
    );
    // Refresh the on-disk copy so newly published plugins resolve (add alone
    // won't update an existing marketplace).
    this.runClaude(
      `Refreshing marketplace ${MARKETPLACE_NAME}`,
      ["plugin", "marketplace", "update", MARKETPLACE_NAME],
    );
    for (const { name, scope } of plugins) {
      this.runClaude(
        `Installing ${name} (${scope} scope)`,
        ["plugin", "install", "--scope", scope, `${name}@${MARKETPLACE_NAME}`],
      );
    }
    if (plugins.some(p => p.name === "vwf")) {
      this.setupGraphify();
    }
    return true;
  }

  // Run a `claude` subcommand under a one-line status (see utils.runCommand).
  runClaude(label, args, opts = {}) {
    return runCommand(this.io, label, "claude", args, opts);
  }

  // Wire graphify for Claude Code (see setupGraphify below).
  setupGraphify() {
    setupGraphify(this.io, "claude");
  }

  // Copy the script, seed the user config, and set the requested statusline keys.
  async installStatusline(plan, yes) {
    await this.installScript();
    await this.seedUserConfig();

    const settings = await this.readSettings();
    if (plan.statusLine) {
      await this.applyKey(settings, "statusLine", STATUS_LINE, yes);
    }
    if (plan.subagentStatusLine) {
      await this.applyKey(
        settings,
        "subagentStatusLine",
        SUBAGENT_STATUS_LINE,
        yes,
      );
    }
    // The caps hook's sensor is the main status bar's writer, so bundle it with
    // `statusLine` only (not the subagent panel).
    if (plan.statusLine) {
      await this.installContextCaps(settings);
    }
    await this.writeSettings(settings);
  }

  // Install the context-caps hook (bundled with the main statusLine): copy the
  // hook script, set the usage-dir env var, and add the PostToolUse entry —
  // idempotent, preserving any other env keys / PostToolUse hooks.
  async installContextCaps(settings) {
    await step(this.io, "Installing context-caps hook", async () => {
      await mkdir(HOOKS_DIR, { recursive: true });
      await copyFile(join(ASSETS_DIR, "context-caps.js"), INSTALLED_HOOK);
      await chmod(INSTALLED_HOOK, 0o755);
    });

    settings.env = isObject(settings.env) ? settings.env : {};
    settings.env[USAGE_ENV_KEY] = USAGE_DIR;

    settings.hooks = isObject(settings.hooks) ? settings.hooks : {};
    const post = Array.isArray(settings.hooks.PostToolUse)
      ? settings.hooks.PostToolUse
      : (settings.hooks.PostToolUse = []);
    const present = post.some(
      e =>
        Array.isArray(e?.hooks)
        && e.hooks.some(h => h?.command === HOOK_COMMAND),
    );
    if (!present) {
      post.push({ hooks: [{ type: "command", command: HOOK_COMMAND }] });
    }
  }

  // Remove the context-caps hook: strip our PostToolUse entry + env var from
  // `settings` (returns true if it changed anything) and delete the installed
  // hook script. Leaves other hooks / env keys intact.
  async uninstallContextCaps(settings) {
    let changed = false;

    if (isObject(settings.hooks) && Array.isArray(settings.hooks.PostToolUse)) {
      const kept = settings.hooks.PostToolUse.filter(
        e =>
          !(Array.isArray(e?.hooks)
            && e.hooks.some(h => h?.command === HOOK_COMMAND)),
      );
      if (kept.length !== settings.hooks.PostToolUse.length) {
        changed = true;
        if (kept.length) {
          settings.hooks.PostToolUse = kept;
        }
        else {
          delete settings.hooks.PostToolUse;
          if (!Object.keys(settings.hooks).length) {
            delete settings.hooks;
          }
        }
      }
    }

    if (isObject(settings.env) && settings.env[USAGE_ENV_KEY] !== undefined) {
      delete settings.env[USAGE_ENV_KEY];
      if (!Object.keys(settings.env).length) {
        delete settings.env;
      }
      changed = true;
    }

    if (existsSync(INSTALLED_HOOK)) {
      await step(this.io, "Removing context-caps hook", async () => {
        await rm(INSTALLED_HOOK, { force: true });
      });
    }
    return changed;
  }

  // Copy the statusline script into ~/.claude/scripts/ and make it executable.
  async installScript() {
    await step(this.io, "Installing statusline script", async () => {
      await mkdir(SCRIPTS_DIR, { recursive: true });
      await copyFile(join(ASSETS_DIR, "statusline"), INSTALLED_SCRIPT);
      await chmod(INSTALLED_SCRIPT, 0o755);
    });
  }

  // Seed ~/.config/statusline.json with the bundled defaults, or deep-merge any
  // missing settings into an existing file (existing user values are preserved).
  async seedUserConfig() {
    await step(this.io, "Seeding statusline config", async () => {
      const defaults = JSON.parse(
        await readFile(join(ASSETS_DIR, "statusline.json"), "utf8"),
      );
      await mkdir(dirname(USER_CONFIG_PATH), { recursive: true });

      if (existsSync(USER_CONFIG_PATH)) {
        const raw = await readFile(USER_CONFIG_PATH, "utf8");
        if (raw.trim()) {
          let existing;
          try {
            existing = JSON.parse(raw);
          }
          catch {
            this.io.error(
              `${USER_CONFIG_PATH} is not valid JSON. Fix or remove it, then retry.`,
            );
          }
          await writeFile(
            USER_CONFIG_PATH,
            `${JSON.stringify(deepMerge(defaults, existing), null, 2)}\n`,
          );
          return;
        }
      }
      await writeFile(
        USER_CONFIG_PATH,
        `${JSON.stringify(defaults, null, 2)}\n`,
      );
    });
  }

  async readSettings() {
    if (!existsSync(SETTINGS_PATH)) {
      return {};
    }
    const raw = await readFile(SETTINGS_PATH, "utf8");
    if (!raw.trim()) {
      return {};
    }
    try {
      return JSON.parse(raw);
    }
    catch {
      this.io.error(
        `${SETTINGS_PATH} is not valid JSON. Fix or remove it, then retry.`,
      );
    }
  }

  // Set `key`. If the existing value is already our statusline (same `type` +
  // `command` — the statusline's identity, ignoring user-tuned fields like
  // padding/refreshInterval), leave it untouched. Otherwise prompt before
  // overwriting a different existing value, unless `yes`.
  async applyKey(settings, key, value, yes) {
    if (statuslineMatches(settings[key], value)) {
      process.stdout.write(`Setting ${key} ... `);
      this.io.log(yellow("skipped (already configured)"));
      return;
    }
    if (!yes && settings[key] !== undefined) {
      this.io.log(yellow(`\nExisting ${key} in ${SETTINGS_PATH}:`));
      this.io.log(JSON.stringify(settings[key], null, 2));
      if (!(await confirm(`Overwrite ${key}?`))) {
        this.io.log(yellow(`Skipped ${key}.`));
        return;
      }
    }
    await step(this.io, `Setting ${key}`, () => {
      settings[key] = value;
    });
  }

  async writeSettings(settings) {
    await step(this.io, "Writing settings.json", async () => {
      await mkdir(dirname(SETTINGS_PATH), { recursive: true });
      await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
    });
  }
}

export {
  ClaudeCode,
  DEP_HINTS,
  OPT_IN,
  PLUGIN_DEPS,
  PLUGIN_EXTRA_DEPS,
  PLUGINS,
  PROJECT_SCOPED,
  REMOTE_MARKETPLACE_URL,
  setupGraphify,
  USER_SCOPED,
};
