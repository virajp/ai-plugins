/**
 * Codex.
 *
 * Codex owns its plugin state: `codex plugin add` copies the bundle into a
 * versioned cache under `$CODEX_HOME/plugins/cache/`, and records the install
 * in `config.toml`. So this adapter drives that CLI rather than writing either
 * of those itself — editing the config while leaving the cache untouched would
 * produce a config claiming an install that is not there.
 *
 * Unlike Cursor, Codex's marketplace takes a **local path**, so an install
 * reads the committed `dist/codex` tree directly and the bytes installed are
 * the bytes CI validated.
 *
 * Verified against `codex-cli 0.146.1` by running it against a throwaway
 * `CODEX_HOME`:
 *
 * - `codex plugin marketplace add <abs path>` → `[marketplaces.<name>]`
 * - `codex plugin add <plugin>@<marketplace>` → `[plugins."<p>@<m>"]` + cache
 * - There is **no `--scope`**. Codex installs at user scope only, so a
 *   project-scoped request falls back to user scope with a note.
 * - No feature flag is needed. `features.plugins` looks required because a
 *   marketplace whose sources are malformed reports "No marketplace plugins
 *   found" — which reads exactly like a disabled feature.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { readToml } from "../config/toml.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import { hasBin } from "./support.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
} from "./types.ts";
import { planPlugins } from "./types.ts";

const BIN = "codex";

/** Where the build writes this target's tree, relative to `sourceRoot`. */
const DIST = join("dist", "codex");

/** Mirrors `MARKETPLACE_PATH` in `build/src/targets/codex.ts`. */
const MANIFEST = join(".agents", "plugins", "marketplace.json");

export const codex: Adapter = {
  id: "codex",
  displayName: "Codex",
  // Both accepted so a manifest-declared scope is never rejected; `project` is
  // redirected in `run`, since Codex has no project-scoped install.
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin(BIN);
  },

  configPaths(context): string[] {
    return [configFile(context)];
  },

  plan(context, plan): readonly Action[] {
    return run(context, plan, true).actions;
  },

  apply(context, plan): ApplyResult {
    return run(context, plan, false);
  },

  verify(context, receipt): string[] {
    const missing: string[] = [];
    const config = readConfig(context);
    for (const entry of receipt.entries) {
      if (entry.kind !== "command") {
        continue;
      }
      // `ran` is the install command; its plugin selector is the last argument.
      const selector = entry.ran.at(-1);
      if (
        entry.ran.includes("add")
        && selector?.includes("@") === true
        && config?.plugins?.[selector] === undefined
      ) {
        missing.push(selector);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    revertReceipt(receipt, {
      restoreKey() {
        // Codex's config is written by its own CLI, never key-by-key here.
      },
      runUndo(undo) {
        codexExec(context, undo);
      },
    });
  },
};

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(
  context: AdapterContext,
  plan: AdapterPlan,
  dryRun: boolean,
): ApplyResult {
  const receipt = new ReceiptBuilder();
  const actions: Action[] = [];

  if (plan.project.length > 0) {
    context.log(
      `codex: installing ${plan.project.join(", ")} at user scope — `
        + "`codex plugin add` has no project scope",
    );
  }

  const names = [...new Set([...plan.user, ...plan.project])];
  if (names.length === 0) {
    return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
  }

  const marketplace = readMarketplaceName(context);
  const root = join(context.sourceRoot, DIST);

  // Registering a marketplace that is already registered would re-point it and,
  // worse, record an undo that removes one the user set up themselves.
  if (readConfig(context)?.marketplaces?.[marketplace] === undefined) {
    const add = ["plugin", "marketplace", "add", root];
    actions.push({ summary: `${BIN} ${add.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, add);
      receipt.command(add, ["plugin", "marketplace", "remove", marketplace]);
    }
  }

  for (const name of names) {
    const selector = `${name}@${marketplace}`;
    if (readConfig(context)?.plugins?.[selector] !== undefined) {
      continue;
    }
    const add = ["plugin", "add", selector];
    actions.push({ summary: `${BIN} ${add.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, add);
      receipt.command(add, ["plugin", "remove", name]);
    }
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

/** The marketplace's own name, so the CLI selector matches what it registered. */
function readMarketplaceName(context: AdapterContext): string {
  const path = join(context.sourceRoot, DIST, MANIFEST);
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return (JSON.parse(readFileSync(path, "utf8")) as { name: string; }).name;
}

interface CodexConfig {
  readonly marketplaces?: Record<string, unknown>;
  readonly plugins?: Record<string, unknown>;
}

/**
 * Codex's config, read only to decide what is already installed.
 *
 * Never written here — the CLI owns it, and a hand-written entry would claim an
 * install whose cache does not exist.
 */
function readConfig(context: AdapterContext): CodexConfig | undefined {
  const path = configFile(context);
  return existsSync(path)
    ? readToml<CodexConfig>(readFileSync(path, "utf8"))
    : undefined;
}

function configFile(context: AdapterContext): string {
  return join(codexHome(context), "config.toml");
}

/** `CODEX_HOME` wins, which is also how tests point at a throwaway home. */
function codexHome(context: AdapterContext): string {
  const override = process.env["CODEX_HOME"];
  return override !== undefined && override.length > 0
    ? override
    : join(context.home, ".codex");
}

function codexExec(context: AdapterContext, args: readonly string[]) {
  return context.exec(BIN, args, {
    env: { ...process.env, CODEX_HOME: codexHome(context) },
  });
}

function runOrThrow(context: AdapterContext, args: readonly string[]): void {
  const result = codexExec(context, args);
  if (result.status !== 0) {
    throw new Error(
      `\`${BIN} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}
