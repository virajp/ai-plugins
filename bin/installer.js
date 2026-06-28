"use strict";

/**
 * @askviraj/ai-plugins — installs Viraj Patel's Claude Code toolkit (marketplace
 * plugins + the powerline statusline).
 *
 * Single-command oclif CLI, plain JS (no build step). Run via:
 *   npx @askviraj/ai-plugins --all --statusline [--yes]
 *
 * This file is only the CLI entrypoint: it parses flags and dispatches to a tool.
 * All Claude-specific behavior lives in ./claude.js (the ClaudeCode tool), and
 * tool-agnostic helpers in ./utils.js — so other AI coding tools can be added
 * later as sibling modules exposing the same surface.
 */

const { Command, Flags, execute, settings } = require("@oclif/core");

// This is a plain-JS CLI (no TypeScript / ts-node). Tell oclif so it never tries
// to auto-transpile, which otherwise warns "Could not find typescript".
settings.enableAutoTranspile = false;

const { yellow } = require("./utils");
const { ClaudeCode, PLUGINS, USER_SCOPED, PROJECT_SCOPED } = require(
  "./claude",
);

class Installer extends Command {
  async run() {
    const { flags } = await this.parse(Installer);
    const tool = new ClaudeCode(this);

    if (flags.version) {
      await tool.printVersions();
      return;
    }

    const plan = tool.resolvePlan(flags);
    const hasSelection = tool.hasSelection(plan);

    // --all acts on user-scoped plugins only; flag the project-scoped ones it
    // skips so it's clear how to act on them.
    if (flags.all) {
      const projectScoped = PLUGINS.filter(name => PROJECT_SCOPED.has(name));
      if (projectScoped.length) {
        this.log(
          yellow(
            `Note: project-scoped plugins (${
              projectScoped.join(", ")
            }) are excluded from --all — install them with --project ${
              projectScoped.join(" ")
            }.`,
          ),
        );
      }
    }

    // Uninstall mode reuses the same selection flags but removes instead.
    if (flags.uninstall) {
      if (!hasSelection) {
        this.error(
          "Nothing to uninstall. Pass --all, --user <name>, --project <name>, and/or --statusline with --uninstall.",
        );
      }
      await tool.uninstall(plan);
      return;
    }

    if (!hasSelection && !flags.upgrade) {
      this.error(
        "Nothing to do. Pass --all, --user <name>, --project <name>, --statusline, --upgrade, --uninstall, or --version.",
      );
    }

    // Install first — so a fresh machine ends up with the requested plugins…
    let state = { marketplaceRefreshed: false, graphifyConfigured: false };
    if (hasSelection) {
      state = await tool.install(plan, flags);
    }

    // …then upgrade everything that is installed to the latest versions. Skip the
    // marketplace refresh and graphify setup if the install phase already did them.
    if (flags.upgrade) {
      await tool.upgrade(state.marketplaceRefreshed, state.graphifyConfigured);
    }
  }
}

// Use `summary` (not `description`) so oclif prints this once at the top of
// --help; setting `description` would also render a duplicate DESCRIPTION block.
Installer.summary =
  "Install Viraj Patel's Claude Code toolkit: marketplace plugins (via the `claude` CLI) and the powerline statusline. Checks required tools (brew/mise/claude/rtk/pnpm/…) first and prints install hints for any that are missing.";

// Users invoke this via pnpx (npx works too), never the bare `ai-plugins` bin,
// so spell the runnable command out rather than using <%= config.bin %>.
Installer.examples = [
  "pnpx @askviraj/ai-plugins --all --statusline",
  "pnpx @askviraj/ai-plugins --all",
  "pnpx @askviraj/ai-plugins --user vwf --user markdown",
  "pnpx @askviraj/ai-plugins --project flutter",
  "pnpx @askviraj/ai-plugins --user vwf --project flutter",
  "pnpx @askviraj/ai-plugins --statusline --yes",
  "pnpx @askviraj/ai-plugins --all --upgrade",
  "pnpx @askviraj/ai-plugins --uninstall --user vwf",
  "pnpx @askviraj/ai-plugins --uninstall --all --statusline",
  "pnpx @askviraj/ai-plugins --version",
];

Installer.flags = {
  version: Flags.boolean({
    char: "v",
    description:
      "Show CLI, statusline, and plugin versions (installed vs latest)",
    exclusive: ["upgrade", "uninstall", "all", "user", "project", "statusline"],
  }),
  upgrade: Flags.boolean({
    description:
      "After any install, upgrade installed plugins to latest + refresh the statusline + check for a CLI update. Combine with a selection (e.g. --all) for an idempotent install+upgrade (safe in setup scripts)",
    exclusive: ["uninstall"],
  }),
  uninstall: Flags.boolean({
    description:
      "Remove instead of install: pair with --all / --user <name> / --project <name> / --statusline to uninstall those",
  }),
  all: Flags.boolean({
    description: `Install every user-scoped plugin (${
      USER_SCOPED.join(", ")
    }) at user scope; add --statusline for the status bar. Project-scoped plugins (${
      [...PROJECT_SCOPED].join(", ")
    }) are excluded — install them with --project`,
    exclusive: ["user", "project"],
  }),
  user: Flags.string({
    multiple: true,
    description:
      `Install the named plugin(s) at USER scope (repeatable). One of: ${
        PLUGINS.join(", ")
      }`,
  }),
  project: Flags.string({
    multiple: true,
    description:
      `Install the named plugin(s) at PROJECT scope (repeatable). One of: ${
        PLUGINS.join(", ")
      }`,
  }),
  statusline: Flags.boolean({
    description:
      "Install the statusline — both the main bar (`statusLine`) and the subagent panel (`subagentStatusLine`) — in ~/.claude/settings.json",
  }),
  yes: Flags.boolean({
    char: "y",
    description: "Overwrite existing config without prompting",
  }),
};

module.exports = Installer;

// oclif loads this file as the single command (see `oclif.commands` in
// package.json); when invoked directly it also bootstraps the CLI.
if (require.main === module) {
  execute({ dir: __dirname });
}
