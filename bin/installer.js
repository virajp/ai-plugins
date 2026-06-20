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

// This is a plain-JS CLI (no TypeScript / ts-node). Tell oclif so it never tries
// to auto-transpile, which otherwise warns "Could not find typescript".
settings.enableAutoTranspile = false;
const { chmod, copyFile, mkdir, readFile, writeFile } = require(
  "node:fs/promises",
);
const { homedir } = require("node:os");
const { dirname, join } = require("node:path");
const readline = require("node:readline/promises");

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

class Installer extends Command {
  async run() {
    const { flags } = await this.parse(Installer);

    if (!flags.statusline && !flags.subagentstatusline) {
      this.error(
        "Nothing to do. Pass --statusline and/or --subagentstatusline (optionally --yes).",
      );
    }

    await this.installScript();
    await this.seedUserConfig();

    const settings = await this.readSettings();
    if (flags.statusline) {
      await this.applyKey(settings, "statusLine", STATUS_LINE, flags.yes);
    }
    if (flags.subagentstatusline) {
      await this.applyKey(
        settings,
        "subagentStatusLine",
        SUBAGENT_STATUS_LINE,
        flags.yes,
      );
    }
    await this.writeSettings(settings);
  }

  // Copy the statusline script into ~/.claude/scripts/ and make it executable.
  async installScript() {
    await mkdir(SCRIPTS_DIR, { recursive: true });
    await copyFile(join(ASSETS_DIR, "statusline"), INSTALLED_SCRIPT);
    await chmod(INSTALLED_SCRIPT, 0o755);
    this.log(`Installed script → ${INSTALLED_SCRIPT}`);
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
        this.log(`Filled missing settings → ${USER_CONFIG_PATH}`);
        return;
      }
    }
    await writeFile(USER_CONFIG_PATH, `${JSON.stringify(defaults, null, 2)}\n`);
    this.log(`Seeded defaults → ${USER_CONFIG_PATH}`);
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
      this.log(`\nExisting ${key} in ${SETTINGS_PATH}:`);
      this.log(JSON.stringify(settings[key], null, 2));
      if (!(await confirm(`Overwrite ${key}?`))) {
        this.log(`Skipped ${key}.`);
        return;
      }
    }
    settings[key] = value;
    this.log(`Set ${key}.`);
  }

  async writeSettings(settings) {
    await mkdir(dirname(SETTINGS_PATH), { recursive: true });
    await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
    this.log(`Updated ${SETTINGS_PATH}`);
  }
}

Installer.description =
  "Install the powerline statusline: copy the script to ~/.claude/scripts/, seed ~/.config/statusline.json, and wire ~/.claude/settings.json.";

Installer.examples = [
  "<%= config.bin %> --statusline",
  "<%= config.bin %> --subagentstatusline",
  "<%= config.bin %> --statusline --subagentstatusline --yes",
];

Installer.flags = {
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

const isObject = v => v != null && typeof v === "object" && !Array.isArray(v);

// Deep-merge: objects merge key-by-key; arrays and scalars from `override` win.
// Called as deepMerge(defaults, existing) so existing user values are preserved
// and only missing keys are filled from the defaults.
function deepMerge(base, override) {
  if (!isObject(base) || !isObject(override)) {
    return override === undefined ? base : override;
  }
  const out = { ...base };
  for (const key of Object.keys(override)) {
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
