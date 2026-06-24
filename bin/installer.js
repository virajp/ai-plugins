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
  "typescript",
  "flutter",
  "context7",
  "mempalace",
];

// Plugins that install at project scope by default; everything else is
// user-scoped. The marketplace itself is always user-scoped. An explicit
// --scope (`override`) wins over the per-plugin default.
const PROJECT_SCOPED = new Set(["flutter"]);
const scopeFor = (name, override) =>
  override || (PROJECT_SCOPED.has(name) ? "project" : "user");

// The bulk flags (--all / --plugins) only act on user-scoped plugins. A
// project-scoped plugin is a deliberate per-project choice, so it is never
// installed in bulk — it must be named explicitly with --plugin <name>.
const USER_SCOPED = PLUGINS.filter(name => !PROJECT_SCOPED.has(name));

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
    // Gates setupGraphify() at every call site (install + upgrade). graphify
    // operates on a git repo, so this lets installs run outside one.
    this.skipGraphify = plan.skipGraphify;
    const hasSelection = plan.plugins.length
      || plan.statusLine
      || plan.subagentStatusLine;

    // --all / --plugins act on user-scoped plugins only; flag the project-scoped
    // ones they skip so it's clear how to act on them.
    if (flags.all || flags.plugins) {
      const projectScoped = PLUGINS.filter(name => PROJECT_SCOPED.has(name));
      if (projectScoped.length) {
        this.log(
          yellow(
            `Note: project-scoped plugins (${
              projectScoped.join(", ")
            }) are excluded from --all/--plugins — pass --plugin <name> to include them.`,
          ),
        );
      }
    }

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
    let graphifyConfigured = false;
    if (hasSelection) {
      this.checkDeps(plan);
      if (plan.plugins.length) {
        marketplaceRefreshed = this.installPlugins(plan.plugins, plan.scope);
        graphifyConfigured = plan.plugins.includes("vwf");
      }
      if (plan.statusLine || plan.subagentStatusLine) {
        await this.installStatusline(plan, flags.yes);
      }
    }

    // …then upgrade everything that is installed to the latest versions. Skip the
    // marketplace refresh and graphify setup if the install phase already did them.
    if (flags.upgrade) {
      await this.upgrade(marketplaceRefreshed, graphifyConfigured);
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
          pluginVersionLine(
            installed[name] && installed[name].version,
            latest[name],
          )
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

    // The install phase already refreshed the marketplace, so only refresh it
    // here when this run skipped the install phase.
    if (!marketplaceRefreshed) {
      this.runClaude(
        `Upgrading marketplace ${MARKETPLACE_NAME}`,
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
        const have = installed[name].version;
        const want = latest[name];
        if (want && cmpVer(want, have) > 0) {
          // Update at the scope the plugin is actually installed at (project for
          // flutter, user for the rest) — `plugin update` defaults to user scope
          // and fails otherwise. Fall back to the per-plugin default scope.
          const scope = installed[name].scope || scopeFor(name);
          this.runClaude(
            `Updating ${name} (${have} → ${want}, ${scope} scope)`,
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

    // Re-assert graphify's Claude Code integration + post-commit hook (idempotent)
    // whenever vwf is installed, so an upgrade self-heals the setup — unless the
    // install phase already did it this run.
    if (!graphifyConfigured && ours.includes("vwf")) {
      this.setupGraphify();
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
        const scope = scopeFor(name, plan.scope);
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
        await this.step(`Removing ${key}`, () => {
          delete settings[key];
        });
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
      await this.step("Removing statusline script", async () => {
        await rm(INSTALLED_SCRIPT, { force: true });
      });
      this.log(
        `Left ${USER_CONFIG_PATH} in place — delete it manually for a full reset.`,
      );
    }
  }

  // Turn the parsed flags into a concrete plan: which plugins to install and
  // which statusline keys to set. --all / --plugins cover the user-scoped plugins
  // (and, for --all, both statusline keys); project-scoped plugins are reached
  // only via an explicit --plugin <name>. An explicit --scope overrides each
  // plugin's default scope; absent, the per-plugin default applies.
  resolvePlan(flags) {
    const all = flags.all;
    let plugins;
    if (all || flags.plugins) {
      plugins = [...USER_SCOPED];
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
      scope: flags.scope,
      skipGraphify: flags["skip-graphify"],
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
  // skip its redundant refresh. `scopeOverride` (from --scope) wins over each
  // plugin's default scope; the marketplace itself is always added user-scoped.
  installPlugins(plugins, scopeOverride) {
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
      const scope = scopeFor(name, scopeOverride);
      this.runClaude(
        `Installing ${name} (${scope} scope)`,
        ["plugin", "install", "--scope", scope, `${name}@${MARKETPLACE_NAME}`],
      );
    }
    if (plugins.includes("vwf")) {
      this.setupGraphify();
    }
    return true;
  }

  // Run a `claude` subcommand under a one-line status (see runCommand).
  runClaude(label, args, opts = {}) {
    return this.runCommand(label, "claude", args, opts);
  }

  // Run an external command quietly under a one-line status: prints
  // "<label> … ✅" on success, or "<label> … ❌" followed by the captured command
  // output on failure. Output is surfaced ONLY on error — success stays a single
  // tidy line. Returns true on exit 0.
  //
  // With `soft: true` a non-zero exit is treated as a skip (yellow note), not a
  // failure — for best-effort steps like refreshing a marketplace we don't own,
  // whose only common failure is "not registered".
  runCommand(label, cmd, args, { soft = false } = {}) {
    process.stdout.write(`${label} ... `);
    const res = spawnSync(cmd, args, { encoding: "utf8" });
    if (res.error) {
      this.log(red("❌"));
      this.error(`Failed to run ${cmd}: ${res.error.message}`);
    }
    if (res.status === 0) {
      this.log(green("✅ OK"));
      return true;
    }
    const out = `${res.stdout || ""}${res.stderr || ""}`.trim();
    if (soft) {
      this.log(yellow("skipped"));
      return false;
    }
    this.log(red("❌ FAILED"));
    if (out) {
      this.log(out);
    }
    return false;
  }

  // vwf's commands rely on graphify's knowledge graph, so wiring graphify into
  // Claude Code and installing its post-commit hook is part of a vwf install or
  // upgrade. Both commands are idempotent, so it is safe to re-run on every
  // upgrade. Skipped (not failed) when `--skip-graphify` is set (graphify needs a
  // git repo) or graphify isn't on PATH — checkDeps guarantees it for installs
  // unless skipped, but the upgrade-only path does not run that gate.
  setupGraphify() {
    if (this.skipGraphify) {
      process.stdout.write("Setting up graphify ... ");
      this.log(yellow("skipped (--skip-graphify)"));
      return;
    }
    if (!hasBin("graphify")) {
      process.stdout.write("Setting up graphify ... ");
      this.log(
        yellow(
          `skipped (graphify not on PATH — install: ${DEP_HINTS.graphify})`,
        ),
      );
      return;
    }
    this.runCommand(
      "Installing graphify for Claude Code",
      "graphify",
      ["install", "--platform", "claude"],
    );
    this.runCommand(
      "Installing graphify post-commit hook",
      "graphify",
      ["hook", "install"],
    );
  }

  // Run a local (file/config) step under the same one-line status as runClaude:
  // "<label> … ✅ OK" on success, or "<label> … ❌" on failure, letting the thrown
  // error propagate so oclif prints it. `fn` may be sync or async.
  async step(label, fn) {
    process.stdout.write(`${label} ... `);
    try {
      await fn();
      this.log(green("✅ OK"));
    }
    catch (e) {
      this.log(red("❌ FAILED"));
      throw e;
    }
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
    await this.step("Installing statusline script", async () => {
      await mkdir(SCRIPTS_DIR, { recursive: true });
      await copyFile(join(ASSETS_DIR, "statusline"), INSTALLED_SCRIPT);
      await chmod(INSTALLED_SCRIPT, 0o755);
    });
  }

  // Seed ~/.config/statusline.json with the bundled defaults, or deep-merge any
  // missing settings into an existing file (existing user values are preserved).
  async seedUserConfig() {
    await this.step("Seeding statusline config", async () => {
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
      this.error(
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
      this.log(yellow("skipped (already configured)"));
      return;
    }
    if (!yes && settings[key] !== undefined) {
      this.log(yellow(`\nExisting ${key} in ${SETTINGS_PATH}:`));
      this.log(JSON.stringify(settings[key], null, 2));
      if (!(await confirm(`Overwrite ${key}?`))) {
        this.log(yellow(`Skipped ${key}.`));
        return;
      }
    }
    await this.step(`Setting ${key}`, () => {
      settings[key] = value;
    });
  }

  async writeSettings(settings) {
    await this.step("Writing settings.json", async () => {
      await mkdir(dirname(SETTINGS_PATH), { recursive: true });
      await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
    });
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
  "pnpx @askviraj/ai-plugins --plugin vwf --plugin flutter",
  "pnpx @askviraj/ai-plugins --plugin vwf --scope project",
  "pnpx @askviraj/ai-plugins --plugin vwf --skip-graphify",
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
    description: `Install everything user-scoped: every user-scoped plugin (${
      USER_SCOPED.join(", ")
    }) plus both statusline keys. Project-scoped plugins (${
      [...PROJECT_SCOPED].join(", ")
    }) are excluded — add them with --plugin`,
  }),
  plugins: Flags.boolean({
    description: `Install all user-scoped marketplace plugins (${
      USER_SCOPED.join(", ")
    }); `
      + `project-scoped plugins (${
        [...PROJECT_SCOPED]
          .join(", ")
      }) need an explicit --plugin`,
  }),
  plugin: Flags.string({
    multiple: true,
    description: `Install a specific plugin by name (repeatable). One of: ${
      PLUGINS.join(", ")
    }`,
  }),
  scope: Flags.string({
    options: ["user", "project"],
    description:
      `Install/uninstall scope for the selected plugins, overriding the per-plugin default (project for ${
        [...PROJECT_SCOPED].join(", ")
      }, user otherwise)`,
  }),
  "skip-graphify": Flags.boolean({
    description:
      "Skip the graphify setup (graphify install + hook install) that a vwf install/upgrade normally runs, and drop graphify from the dependency check. Use when installing outside a git repo, where graphify's commands don't apply",
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
      out[id.slice(0, at)] = { version: entry.version, scope: entry.scope };
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
function requiredTools(
  { plugins, statusLine, subagentStatusLine, skipGraphify },
) {
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
  // --skip-graphify bypasses setupGraphify, so graphify need not be present.
  if (skipGraphify) {
    tools.delete("graphify");
  }
  if (statusLine || subagentStatusLine) {
    tools.add("node");
  }
  return [...tools];
}

const isObject = v => v != null && typeof v === "object" && !Array.isArray(v);

// True when an existing statusline setting already points at our script. Compares
// only `type` and `command` — the statusline's identity — so user-tuned fields
// (padding, refreshInterval) don't count as a mismatch and an already-installed
// statusline is left untouched instead of prompting to overwrite.
function statuslineMatches(existing, value) {
  return isObject(existing)
    && existing.type === value.type
    && existing.command === value.command;
}

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
