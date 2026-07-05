/**
 * @askviraj/ai-plugins — installs Viraj Patel's AI-coding toolkit (marketplace
 * plugins + the powerline statusline) for Claude Code and/or OpenCode.
 *
 * Single-command oclif CLI, plain JS (no build step). Run via:
 *   npx @askviraj/ai-plugins --all --statusline [--yes]
 *
 * This file is only the CLI entrypoint: it parses flags and dispatches to one
 * tool per targeted platform. Claude-specific behavior lives in ./claude.mjs
 * (the ClaudeCode tool), OpenCode-specific behavior in ./opencode.mjs, and
 * tool-agnostic helpers in ./utils.mjs — every tool exposes the same surface
 * (resolvePlan / hasSelection / install / upgrade / uninstall / printVersions).
 */

import {
  Command,
  execute,
  Flags,
  settings,
} from "@oclif/core";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ClaudeCode,
  PLUGINS,
  PROJECT_SCOPED,
  USER_SCOPED,
} from "./claude.mjs";
import { OpenCode } from "./opencode.mjs";
import {
  green,
  hasBin,
  yellow,
} from "./utils.mjs";

// This is a plain-JS CLI (no TypeScript / ts-node). Tell oclif so it never tries
// to auto-transpile, which otherwise warns "Could not find typescript".
settings.enableAutoTranspile = false;

// The AI coding tools this CLI can install for. Claude Code gets marketplace
// plugins + the statusline; OpenCode gets the plugins' skills rendered into its
// config (see opencode.mjs). Explicit --platform wins; otherwise every tool
// found on PATH is targeted.
const PLATFORMS = ["claude", "opencode"];
const toolFor = (platform, io) =>
  platform === "opencode" ? new OpenCode(io) : new ClaudeCode(io);

class Installer extends Command {
  // The platforms this run acts on: the explicit --platform values, or every
  // platform whose binary is on PATH. Ordered claude-first.
  resolvePlatforms(flags) {
    if (flags.platform?.length) {
      return PLATFORMS.filter(p => flags.platform.includes(p));
    }
    const detected = PLATFORMS.filter(p => hasBin(p));
    if (!detected.length) {
      this.error(
        "Neither `claude` nor `opencode` found on PATH. Install one (claude: "
          + "`mise use -g claude-code@latest`; opencode: see opencode.ai), or "
          + "pass --platform explicitly.",
      );
    }
    this.log(
      green(`Detected platform(s): ${detected.join(", ")}`),
    );
    return detected;
  }

  async run() {
    const { flags } = await this.parse(Installer);
    const platforms = this.resolvePlatforms(flags);

    if (flags.version) {
      for (const platform of platforms) {
        await toolFor(platform, this).printVersions();
      }
      return;
    }

    // The statusline is a Claude Code surface (it lives in ~/.claude); flag a
    // request that can't be honored because claude isn't targeted.
    if (flags.statusline && !platforms.includes("claude")) {
      this.log(
        yellow(
          "Note: --statusline is Claude Code-only — skipped (claude is not a targeted platform).",
        ),
      );
    }

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

    // One job per platform: each tool resolves the same flags into its own plan.
    const jobs = platforms.map(platform => {
      const tool = toolFor(platform, this);
      return { platform, tool, plan: tool.resolvePlan(flags) };
    });
    const anySelection = jobs.some(j => j.tool.hasSelection(j.plan));
    const banner = platform =>
      platforms.length > 1 && this.log(green(`\n── ${platform} ──`));

    // Uninstall mode reuses the same selection flags but removes instead.
    if (flags.uninstall) {
      if (!anySelection) {
        this.error(
          "Nothing to uninstall. Pass --all, --user <name>, --project <name>, and/or --statusline with --uninstall.",
        );
      }
      for (const { platform, tool, plan } of jobs) {
        if (tool.hasSelection(plan)) {
          banner(platform);
          await tool.uninstall(plan);
        }
      }
      return;
    }

    if (!anySelection && !flags.upgrade) {
      this.error(
        "Nothing to do. Pass --all, --user <name>, --project <name>, --statusline, --upgrade, --uninstall, or --version.",
      );
    }

    for (const { platform, tool, plan } of jobs) {
      banner(platform);
      // Install first — so a fresh machine ends up with the requested plugins…
      let state = { marketplaceRefreshed: false, graphifyConfigured: false };
      if (tool.hasSelection(plan)) {
        state = await tool.install(plan, flags);
      }
      // …then upgrade everything that is installed to the latest versions. Skip
      // the marketplace refresh / graphify setup an install phase already did.
      if (flags.upgrade) {
        await tool.upgrade(
          state.marketplaceRefreshed,
          state.graphifyConfigured,
        );
      }
    }
  }
}

// Use `summary` (not `description`) so oclif prints this once at the top of
// --help; setting `description` would also render a duplicate DESCRIPTION block.
Installer.summary =
  "Install Viraj Patel's AI-coding toolkit for Claude Code and/or OpenCode: marketplace plugins (via the `claude` CLI), skills rendered into OpenCode's config, and the powerline statusline. Checks required tools (brew/mise/claude/rtk/pnpm/…) first and prints install hints for any that are missing.";

// Users invoke this via pnpx (npx works too), never the bare `ai-plugins` bin,
// so spell the runnable command out rather than using <%= config.bin %>.
Installer.examples = [
  "pnpx @askviraj/ai-plugins --all --statusline",
  "pnpx @askviraj/ai-plugins --all",
  "pnpx @askviraj/ai-plugins --user vwf --user markdown",
  "pnpx @askviraj/ai-plugins --project flutter",
  "pnpx @askviraj/ai-plugins --user vwf --project flutter",
  "pnpx @askviraj/ai-plugins --platform opencode --user typescript",
  "pnpx @askviraj/ai-plugins --platform claude --platform opencode --all",
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
  platform: Flags.string({
    multiple: true,
    options: PLATFORMS,
    description:
      "Target platform(s): claude and/or opencode (repeatable). Omitted → every platform found on PATH",
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
      "Install the statusline — both the main bar (`statusLine`) and the subagent panel (`subagentStatusLine`) — in ~/.claude/settings.json (Claude Code only)",
  }),
  yes: Flags.boolean({
    char: "y",
    description: "Overwrite existing config without prompting",
  }),
};

export default Installer;

// oclif loads this file as the single command (see `oclif.commands` in
// package.json); when invoked directly (the bin entry, possibly via a symlink)
// it also bootstraps the CLI. realpathSync resolves the bin symlink so this
// matches the module's own path — the ESM equivalent of `require.main === module`.
// Not awaited: oclif's execute() owns the process lifecycle (it calls
// process.exit), and a pending top-level await would trip Node's
// "unsettled top-level await" exit. This mirrors the original CJS bootstrap.
if (
  process.argv[1]
  && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  execute({ dir: import.meta.url });
}
