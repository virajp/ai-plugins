/**
 * Oh-My-Pi.
 *
 * `omp` owns its plugin state — an npm-shaped tree under
 * `<root>/.omp/plugins/` with a `package.json`, a lockfile and
 * `installed_plugins.json` — so this adapter drives the CLI rather than writing
 * any of it. Its marketplace takes a local path, so an install reads the
 * committed `ohmypi/` tree.
 *
 * Verified by running `omp` against a throwaway `HOME`:
 *
 * - `omp plugin marketplace add <path>` → `~/.omp/marketplaces.json`.
 *   Re-adding an existing name is an **error**, not a no-op, so registration is
 *   guarded.
 * - `omp plugin install <plugin>@<marketplace> --scope user|project`.
 *   **`--scope` is silently ignored unless the `@marketplace` form is used** —
 *   it warns and installs at the default scope, so the bare name is never used
 *   here.
 * - Project scope writes `<cwd>/.omp/plugins/`, user scope `~/.omp/plugins/`.
 *   Both work, so unlike every other adapter here nothing is redirected.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  hasBin,
  isStalePin,
  PACKAGE_NAME,
} from "./support.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
  Scope,
} from "./types.ts";
import { planPlugins } from "./types.ts";

const BIN = "omp";

/** Where the build writes this target's tree, relative to `sourceRoot`. */
const TREE = "ohmypi";

/** Mirrors the marketplace output path in `build/src/targets/ohmypi.ts`. */
const MANIFEST = join(".omp-plugin", "marketplace.json");

export const ohmypi: Adapter = {
  id: "ohmypi",
  displayName: "Oh-My-Pi",
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin(BIN);
  },

  configPaths(context): string[] {
    return [join(context.home, ".omp", "marketplaces.json")];
  },

  plan(context, plan): readonly Action[] {
    return run(context, plan, true).actions;
  },

  apply(context, plan): ApplyResult {
    return run(context, plan, false);
  },

  verify(context, receipt): string[] {
    const missing: string[] = [];
    for (const entry of receipt.entries) {
      if (entry.kind !== "command" || !entry.ran.includes("install")) {
        continue;
      }
      // `--scope <scope>` is the tail of every install we record.
      const scope = entry.ran.at(-1) as Scope;
      const name = entry.ran[2]?.split("@")[0];
      if (
        name !== undefined
        && !existsSync(join(pluginsRoot(context, scope), name))
      ) {
        missing.push(name);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    revertReceipt(receipt, {
      restoreKey() {
        // Oh-My-Pi's config is written by its own CLI, never key-by-key here.
      },
      runUndo(undo) {
        ompExec(context, undo);
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

  if (plan.user.length === 0 && plan.project.length === 0) {
    return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
  }

  const marketplace = readMarketplaceName(context);

  // Re-adding an existing marketplace fails outright, and recording an undo for
  // one we did not add would remove the user's own registration.
  const want = join(context.sourceRoot, TREE);
  const entry = registryEntry(context, marketplace);
  // Registered but with no recorded URI: leave it. We cannot tell whether it
  // is stale, and re-adding is a hard error in `omp` — guessing would turn an
  // unknown into a failed run.
  const stale = entry?.sourceUri !== undefined
    && isStalePin(entry.sourceUri, want, PACKAGE_NAME);
  if (entry === undefined || stale) {
    if (stale) {
      // Same trap as Claude's: the pin names the store path of whichever
      // version registered it, so an upgrade kept serving the previous
      // package's rendered tree. `omp` has no repoint, so it is remove + add.
      const drop = ["plugin", "marketplace", "remove", marketplace];
      actions.push({ summary: `${BIN} ${drop.join(" ")}` });
      if (!dryRun) {
        runOrThrow(context, drop);
      }
      context.log(
        `ohmypi: marketplace \`${marketplace}\` re-pointed from a previous `
          + "install of this package to the running one",
      );
    }
    const add = ["plugin", "marketplace", "add", want];
    actions.push({ summary: `${BIN} ${add.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, add);
      receipt.command(add, ["plugin", "marketplace", "remove", marketplace]);
    }
  }

  for (const scope of ["user", "project"] as const) {
    for (const name of scope === "user" ? plan.user : plan.project) {
      // Always the `<name>@<marketplace>` form: with a bare name `--scope` is
      // ignored with a warning, and the plugin lands at the default scope.
      // `--force` is not optional here. `omp plugin install` **errors** on a
      // plugin it already has ("Use force option to reinstall"), so without it
      // the first run succeeded and every run after it failed outright — which
      // is exactly what `--upgrade` does. It is also the only way to refresh:
      // `omp` copies the bundle into `~/.omp/plugins/cache/`, so skipping an
      // already-installed plugin would pin it to the content it was first
      // installed with, and an upgrade would quietly change nothing.
      const install = [
        "plugin",
        "install",
        `${name}@${marketplace}`,
        "--scope",
        scope,
        "--force",
      ];
      actions.push({ summary: `${BIN} ${install.join(" ")}` });
      if (!dryRun) {
        runOrThrow(context, install);
        receipt.command(install, [
          "plugin",
          "uninstall",
          name,
          "--scope",
          scope,
        ]);
      }
    }
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

/** The marketplace's own name, so the CLI selector matches what it registered. */
function readMarketplaceName(context: AdapterContext): string {
  const path = join(context.sourceRoot, TREE, MANIFEST);
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return (JSON.parse(readFileSync(path, "utf8")) as { name: string; }).name;
}

/**
 * The path a registered marketplace currently points at, or `undefined` when
 * it is not registered at all.
 *
 * The URI matters as much as the name: a marketplace registered by an earlier
 * version of this package still exists under the right name while serving the
 * wrong tree.
 */
function registryEntry(
  context: AdapterContext,
  name: string,
): { name?: string; sourceUri?: string; } | undefined {
  const path = join(context.home, ".omp", "marketplaces.json");
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      marketplaces?: readonly { name?: string; sourceUri?: string; }[];
    };
    return (parsed.marketplaces ?? []).find(entry => entry.name === name);
  }
  catch {
    // An unreadable registry is Oh-My-Pi's to complain about; treating it as
    // "not registered" lets the CLI produce the real error message.
    return undefined;
  }
}

function pluginsRoot(context: AdapterContext, scope: Scope): string {
  const root = scope === "project" ? context.cwd : context.home;
  return join(root, ".omp", "plugins", "node_modules");
}

/**
 * `omp` reads both `HOME` and the working directory: `HOME` selects the user
 * store, `cwd` the project one. Passing both is what keeps a test — and a
 * project-scoped install — off the developer's own `~/.omp`.
 */
function ompExec(context: AdapterContext, args: readonly string[]) {
  return context.exec(BIN, args, {
    cwd: context.cwd,
    env: { ...process.env, HOME: context.home },
  });
}

function runOrThrow(context: AdapterContext, args: readonly string[]): void {
  const result = ompExec(context, args);
  if (result.status !== 0) {
    throw new Error(
      `\`${BIN} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}
