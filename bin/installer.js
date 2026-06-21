#!/usr/bin/env node
"use strict";

/**
 * @askviraj/ai-plugins — installs the powerline statusline into Claude Code.
 *
 * Single-command oclif CLI, plain JS (no build step). Run via:
 *   npx @askviraj/ai-plugins --statusline --subagentstatusline [--yes]
 */

const { Command, Flags, execute, settings } = require("@oclif/core");
const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");

// This is a plain-JS CLI (no TypeScript / ts-node). Tell oclif so it never tries
// to auto-transpile, which otherwise warns "Could not find typescript".
settings.enableAutoTranspile = false;
const { chmod, copyFile, mkdir, readFile, rm, writeFile } = require(
  "node:fs/promises",
);
const { homedir } = require("node:os");
const { delimiter, dirname, join } = require("node:path");
const readline = require("node:readline/promises");

// Semantic ANSI colors for human-facing output: green = success/up-to-date,
// yellow = notices/updates-available/skips, red = failures. Disabled when stdout
// is not a TTY (piped/CI) or NO_COLOR is set, so logs stay clean there.
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = code => s => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : `${s}`);
const green = paint("32");
const yellow = paint("33");
const red = paint("31");

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
  "typescript-lsp",
  "dart-lsp",
  "context7",
  "mempalace",
];

// Plugins that install at project scope by default; everything else is
// user-scoped. The marketplace itself is always user-scoped.
const PROJECT_SCOPED = new Set(["dart-lsp"]);
const scopeFor = name => (PROJECT_SCOPED.has(name) ? "project" : "user");

// How to install each external tool we depend on (matches this toolchain:
// brew + mise drive the rest; rtk ships as a brew formula).
const DEP_HINTS = {
  brew:
    "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
  mise: "brew install mise",
  claude: "mise use -g claude-code@latest",
  rtk: "brew install --formulae rtk",
  pnpm: "mise use -g pnpm@latest",
  node: "mise use -g node@latest",
  graphify: "mise use -g pipx:graphifyy@latest",
};

// Tools required whenever any plugin/marketplace install runs.
const CORE_DEPS = ["brew", "mise", "claude"];

// Extra tools specific plugins need: vwf ships an `rtk hook claude` Bash hook,
// uses graphify, and pulls in context7, which runs its MCP server via pnpx (pnpm).
const PLUGIN_EXTRA_DEPS = {
  vwf: ["rtk", "pnpm", "graphify"],
  context7: ["pnpm"],
};

class Installer extends Command {
  async run() {
    const { flags } = await this.parse(Installer);

    if (flags.version) {
      await this.printVersions();
      return;
    }

    const plan = this.resolvePlan(flags);
    const hasSelection = plan.plugins.length
      || plan.statusLine
      || plan.subagentStatusLine;

    // Uninstall mode reuses the same selection flags but removes instead.
    if (flags.uninstall) {
      if (!hasSelection) {
        this.error(
          "Nothing to uninstall. Pass --all, --plugins, --plugin <name>, --statusline, and/or --subagentstatusline with --uninstall.",
        );
      }
      await this.uninstall(plan);
      return;
    }

    if (!hasSelection && !flags.upgrade) {
      this.error(
        "Nothing to do. Pass --all, --plugins, --plugin <name>, --statusline, --subagentstatusline, --upgrade, --uninstall, or --version.",
      );
    }

    // Install first — so a fresh machine ends up with the requested plugins…
    let marketplaceRefreshed = false;
    if (hasSelection) {
      this.checkDeps(plan);
      if (plan.plugins.length) {
        marketplaceRefreshed = this.installPlugins(plan.plugins);
      }
      if (plan.statusLine || plan.subagentStatusLine) {
        await this.installStatusline(plan, flags.yes);
      }
    }

    // …then upgrade everything that is installed to the latest versions. Skip the
    // marketplace refresh if the install phase already refreshed it.
    if (flags.upgrade) {
      await this.upgrade(marketplaceRefreshed);
    }
  }

  // Print the CLI version (vs npm latest), the bundled statusline version, and
  // each plugin's installed version (from `claude plugin list`) vs the latest in
  // the remote marketplace, flagging updates. Errors out cleanly if the network
  // or the claude CLI is unavailable.
  async printVersions() {
    if (!hasBin("claude")) {
      this.error("claude CLI not found. Install it first, then re-run.");
    }
    const cli = this.config.version;
    let cliLatest, latest, installed;
    try {
      cliLatest = (await fetchJson(NPM_LATEST_URL)).version;
      latest = await remoteLatest();
      installed = installedPlugins();
    }
    catch (e) {
      this.error(
        `Version check failed (network or claude unavailable): ${e.message}`,
      );
    }

    this.log(`${this.config.name}  ${cli}${updateNote(cli, cliLatest)}`);
    this.log(`  ${"statusline".padEnd(16)} ${cli}  (bundled with the CLI)`);

    this.log(`\nPlugins (${MARKETPLACE_NAME}):`);
    for (const name of PLUGINS) {
      this.log(
        `  ${name.padEnd(16)} ${
          pluginVersionLine(installed[name], latest[name])
        }`,
      );
    }
  }

  // Upgrade every installed virajp-plugins plugin to its latest version, refresh
  // the statusline (if installed) to this CLI's bundled version, and note a newer
  // CLI. Runs after the install phase, so newly installed plugins are already
  // latest and only pre-existing ones get bumped. Installing missing plugins is
  // the install flags' job — this only upgrades what is present. Errors out if
  // the network or the claude CLI is unavailable.
  async upgrade(marketplaceRefreshed = false) {
    if (!hasBin("claude")) {
      this.error("claude CLI not found. Install it first, then re-run.");
    }
    // Fail fast (cleanly) on the remote reads before mutating anything.
    let latest, cliLatest, installed;
    try {
      latest = await remoteLatest();
      cliLatest = (await fetchJson(NPM_LATEST_URL)).version;
      installed = installedPlugins();
    }
    catch (e) {
      this.error(
        `Upgrade check failed (network or claude unavailable): ${e.message}`,
      );
    }
    const ours = PLUGINS.filter(name => installed[name]);

    this.log(
      green(`\nUpgrading installed plugins (marketplace ${MARKETPLACE_NAME})…`),
    );
    // The install phase already refreshed the marketplace, so only refresh it
    // here when this run skipped the install phase.
    if (!marketplaceRefreshed) {
      this.runClaude(
        `Refreshing marketplace ${MARKETPLACE_NAME}`,
        ["plugin", "marketplace", "update", MARKETPLACE_NAME],
      );
    }

    if (!ours.length) {
      this.log(
        yellow("No virajp-plugins plugins are installed — nothing to upgrade."),
      );
    }
    else {
      let updated = 0;
      for (const name of ours) {
        const have = installed[name];
        const want = latest[name];
        if (want && cmpVer(want, have) > 0) {
          this.runClaude(
            `Updating ${name} (${have} → ${want})`,
            ["plugin", "update", `${name}@${MARKETPLACE_NAME}`],
          );
          updated++;
        }
        else {
          this.log(
            green(
              `${name} is up to date (${have}${want ? "" : ", external"}).`,
            ),
          );
        }
      }
      if (updated) {
        this.log(
          green("\nPlugin updates applied — restart Claude Code to load them."),
        );
      }
    }

    // Refresh the installed statusline script + config (no settings.json change).
    if (existsSync(INSTALLED_SCRIPT)) {
      this.log(green("\nRefreshing statusline…"));
      await this.installScript();
      await this.seedUserConfig();
    }

    if (cmpVer(cliLatest, this.config.version) > 0) {
      this.log(
        yellow(
          `\nA newer CLI is available: ${this.config.version} → ${cliLatest}`,
        ),
      );
      this.log(
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
        this.error("claude CLI not found. Install it first, then re-run.");
      }
      for (const name of plan.plugins) {
        const scope = scopeFor(name);
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
        delete settings[key];
        this.log(yellow(`Removed ${key} from ${SETTINGS_PATH}`));
        changed = true;
      }
    }
    if (changed) {
      await this.writeSettings(settings);
    }

    if (
      settings.statusLine === undefined
      && settings.subagentStatusLine === undefined
      && existsSync(INSTALLED_SCRIPT)
    ) {
      await rm(INSTALLED_SCRIPT, { force: true });
      this.log(yellow(`Removed script → ${INSTALLED_SCRIPT}`));
      this.log(
        `Left ${USER_CONFIG_PATH} in place — delete it manually for a full reset.`,
      );
    }
  }

  // Turn the parsed flags into a concrete plan: which plugins to install and
  // which statusline keys to set. --all is the superset of everything.
  resolvePlan(flags) {
    const all = flags.all;
    let plugins;
    if (all || flags.plugins) {
      plugins = [...PLUGINS];
    }
    else if (flags.plugin?.length) {
      // This CLI installs ONLY from the virajp-plugins marketplace, so plugin
      // names must be bare — reject any `@marketplace` / path qualifier outright
      // rather than let it reach the claude CLI.
      const qualified = flags.plugin.filter(n => /[@/]/.test(n));
      if (qualified.length) {
        this.error(
          `Plugin names must be bare (e.g. "vwf") — this CLI installs only from `
            + `the ${MARKETPLACE_NAME} marketplace and cannot target another. `
            + `Drop the qualifier from: ${qualified.join(", ")}`,
        );
      }
      const invalid = flags.plugin.filter(n => !PLUGINS.includes(n));
      if (invalid.length) {
        this.error(
          `Unknown plugin(s): ${invalid.join(", ")}. Valid: ${
            PLUGINS.join(", ")
          }`,
        );
      }
      plugins = [...new Set(flags.plugin)];
    }
    else {
      plugins = [];
    }
    return {
      all,
      plugins,
      statusLine: all || flags.statusline,
      subagentStatusLine: all || flags.subagentstatusline,
    };
  }

  // Verify every tool the plan needs is on PATH. If any are missing, print the
  // install command for each and exit so the user installs them and re-runs.
  checkDeps(plan) {
    const missing = requiredTools(plan).filter(t => !hasBin(t));
    if (!missing.length) {
      return;
    }
    this.log(
      red("\nMissing required dependencies — install these, then re-run:\n"),
    );
    for (const t of missing) {
      this.log(`  ${yellow(t)}`);
      this.log(`    ${DEP_HINTS[t] || "see project docs"}`);
    }
    this.exit(1);
  }

  // Add the marketplace (user scope), refresh it, then install each plugin at its
  // scope. `marketplace add` is a no-op when the marketplace already exists on
  // disk — it does NOT pull the latest manifest — so a newly published plugin
  // would 404 against the stale local copy; always `marketplace update` after.
  // Returns true (the marketplace is now refreshed) so a following --upgrade can
  // skip its redundant refresh.
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
    for (const name of plugins) {
      const scope = scopeFor(name);
      this.runClaude(
        `Installing ${name} (${scope} scope)`,
        ["plugin", "install", "--scope", scope, `${name}@${MARKETPLACE_NAME}`],
      );
    }
    return true;
  }

  // Run a `claude` subcommand quietly under a one-line status: prints
  // "<label> … ✅" on success, or "<label> … ❌" followed by the captured command
  // output on failure. Output is surfaced ONLY on error — success stays a single
  // tidy line. Returns true on exit 0.
  runClaude(label, args) {
    process.stdout.write(`${label} ... `);
    const res = spawnSync("claude", args, { encoding: "utf8" });
    if (res.error) {
      this.log(red("❌"));
      this.error(`Failed to run claude: ${res.error.message}`);
    }
    if (res.status === 0) {
      this.log(green("✅ OK"));
      return true;
    }
    this.log(red("❌ FAILED"));
    const out = `${res.stdout || ""}${res.stderr || ""}`.trim();
    if (out) {
      this.log(out);
    }
    return false;
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
    await this.writeSettings(settings);
  }

  // Copy the statusline script into ~/.claude/scripts/ and make it executable.
  async installScript() {
    await mkdir(SCRIPTS_DIR, { recursive: true });
    await copyFile(join(ASSETS_DIR, "statusline"), INSTALLED_SCRIPT);
    await chmod(INSTALLED_SCRIPT, 0o755);
    this.log(green(`Installed script → ${INSTALLED_SCRIPT}`));
  }

  // Seed ~/.config/statusline.json with the bundled defaults, or deep-merge any
  // missing settings into an existing file (existing user values are preserved).
  async seedUserConfig() {
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
          this.error(
            `${USER_CONFIG_PATH} is not valid JSON. Fix or remove it, then retry.`,
          );
        }
        await writeFile(
          USER_CONFIG_PATH,
          `${JSON.stringify(deepMerge(defaults, existing), null, 2)}\n`,
        );
        this.log(green(`Filled missing settings → ${USER_CONFIG_PATH}`));
        return;
      }
    }
    await writeFile(USER_CONFIG_PATH, `${JSON.stringify(defaults, null, 2)}\n`);
    this.log(green(`Seeded defaults → ${USER_CONFIG_PATH}`));
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
      this.error(
        `${SETTINGS_PATH} is not valid JSON. Fix or remove it, then retry.`,
      );
    }
  }

  // Set `key`, prompting before overwriting an existing value unless `yes`.
  async applyKey(settings, key, value, yes) {
    if (!yes && settings[key] !== undefined) {
      this.log(yellow(`\nExisting ${key} in ${SETTINGS_PATH}:`));
      this.log(JSON.stringify(settings[key], null, 2));
      if (!(await confirm(`Overwrite ${key}?`))) {
        this.log(yellow(`Skipped ${key}.`));
        return;
      }
    }
    settings[key] = value;
    this.log(green(`Set ${key}.`));
  }

  async writeSettings(settings) {
    await mkdir(dirname(SETTINGS_PATH), { recursive: true });
    await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
    this.log(green(`Updated ${SETTINGS_PATH}`));
  }
}

// Use `summary` (not `description`) so oclif prints this once at the top of
// --help; setting `description` would also render a duplicate DESCRIPTION block.
Installer.summary =
  "Install Viraj Patel's Claude Code toolkit: marketplace plugins (via the `claude` CLI) and the powerline statusline. Checks required tools (brew/mise/claude/rtk/pnpm/…) first and prints install hints for any that are missing.";

// Users invoke this via pnpx (npx works too), never the bare `ai-plugins` bin,
// so spell the runnable command out rather than using <%= config.bin %>.
Installer.examples = [
  "pnpx @askviraj/ai-plugins --all",
  "pnpx @askviraj/ai-plugins --plugins",
  "pnpx @askviraj/ai-plugins --plugin vwf --plugin dart-lsp",
  "pnpx @askviraj/ai-plugins --statusline --subagentstatusline --yes",
  "pnpx @askviraj/ai-plugins --all --upgrade",
  "pnpx @askviraj/ai-plugins --uninstall --plugin vwf",
  "pnpx @askviraj/ai-plugins --uninstall --all",
  "pnpx @askviraj/ai-plugins --version",
];

Installer.flags = {
  version: Flags.boolean({
    char: "v",
    description:
      "Show CLI, statusline, and plugin versions (installed vs latest)",
  }),
  upgrade: Flags.boolean({
    description:
      "After any install, upgrade installed plugins to latest + refresh the statusline + check for a CLI update. Combine with --all for an idempotent install+upgrade (safe in setup scripts)",
  }),
  uninstall: Flags.boolean({
    description:
      "Remove instead of install: pair with --all / --plugins / --plugin <name> / --statusline / --subagentstatusline to uninstall those plugins or statusline keys",
  }),
  all: Flags.boolean({
    description:
      "Install everything: every marketplace plugin plus both statusline keys",
  }),
  plugins: Flags.boolean({
    description: `Install all marketplace plugins (${PLUGINS.join(", ")})`,
  }),
  plugin: Flags.string({
    multiple: true,
    description: `Install a specific plugin by name (repeatable). One of: ${
      PLUGINS.join(", ")
    }`,
  }),
  statusline: Flags.boolean({
    description:
      "Install `statusLine` (the main status bar) in ~/.claude/settings.json",
  }),
  subagentstatusline: Flags.boolean({
    description:
      "Install `subagentStatusLine` (the subagent panel) in ~/.claude/settings.json",
  }),
  yes: Flags.boolean({
    char: "y",
    description: "Overwrite existing config without prompting",
  }),
};

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
      out[id.slice(0, at)] = entry.version;
    }
  }
  return out;
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

// True if `bin` is an executable found on PATH.
function hasBin(bin) {
  return (process.env.PATH || "")
    .split(delimiter)
    .some(dir => dir && existsSync(join(dir, bin)));
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
    for (const d of PLUGIN_EXTRA_DEPS[p] || []) {
      tools.add(d);
    }
  }
  if (statusLine || subagentStatusLine) {
    tools.add("node");
  }
  return [...tools];
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

module.exports = Installer;

// oclif loads this file as the single command (see `oclif.commands` in
// package.json); when invoked directly it also bootstraps the CLI.
if (require.main === module) {
  execute({ dir: __dirname });
}
