/**
 * Oh-My-Pi.
 *
 * `omp` owns its plugin state — an npm-shaped tree under
 * `<root>/.omp/plugins/` with a `package.json`, a lockfile and
 * `installed_plugins.json` — so this adapter drives the CLI rather than writing
 * any of it. Its marketplace takes a local path, so an install reads the
 * committed `ohmypi/` tree — from a copy under `ohmypiMarketplaceRoot`, not
 * from `sourceRoot`, because `omp` re-reads that path on every later install.
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
  cpSync,
  existsSync,
  readFileSync,
  rmSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  dataDir,
  hasBin,
  isStalePin,
  ohmypiMarketplaceRoot,
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

/** Mirrors the marketplace output path in `renderer/src/targets/ohmypi.ts`. */
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

  // Copy before registering, so the path exists by the time `omp` reads it —
  // and so revert, which walks entries backwards, un-registers the marketplace
  // before deleting what it pointed at.
  actions.push(...installPayload(context, receipt, dryRun));

  // Re-adding an existing marketplace fails outright, and recording an undo for
  // one we did not add would remove the user's own registration.
  const want = ohmypiMarketplaceRoot(context.home);
  const entry = registryEntry(context, marketplace);
  // Registered but with no recorded URI: leave it. We cannot tell whether it
  // is stale, and re-adding is a hard error in `omp` — guessing would turn an
  // unknown into a failed run.
  const stale = entry?.sourceUri !== undefined
    && isStalePin(
      entry.sourceUri,
      want,
      PACKAGE_NAME,
      dataDir(context.home),
    );
  if (entry === undefined || stale) {
    if (stale) {
      // Same trap as Claude's: the pin names the store path of whichever
      // version registered it, so an upgrade kept serving the previous
      // package's rendered tree. `omp` has no repoint, so it is remove + add.
      // `managedBase` above is what carries an existing user across: their pin
      // is a package install and `want` is now the managed directory, so
      // without it the migration off the store path would never fire.
      const drop = ["plugin", "marketplace", "remove", marketplace];
      actions.push({ summary: `${BIN} ${drop.join(" ")}` });
      if (!dryRun) {
        runOrThrow(context, drop);
      }
      context.log(
        `ohmypi: marketplace \`${marketplace}\` re-pointed from `
          + `\`${entry?.sourceUri ?? "an earlier install"}\` to \`${want}\``,
      );
    }
    const add = ["plugin", "marketplace", "add", want];
    actions.push({ summary: `${BIN} ${add.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, add);
      receipt.command(add, ["plugin", "marketplace", "remove", marketplace]);
    }
  }
  else if (entry.sourceUri === want) {
    // Registered already, by an earlier run of ours — the pin names our own
    // managed directory, which nobody else would have registered.
    //
    // The path is right, but `omp` caches the marketplace **catalog** it read
    // when the pin was added, under `plugins/cache/marketplaces/`, and nothing
    // re-reads it. So an upgrade refreshed the payload while the catalog kept
    // describing the previous release: `omp plugin list` reported the old
    // version, and — the part that actually breaks — a plugin **added** in a
    // later release could not be installed at all, failing with
    // `Plugin "<name>" not found in marketplace "virajp-plugins"`, with no
    // remedy short of removing the marketplace by hand.
    //
    // Unconditional, unlike Claude's version-gated update: the catalog is
    // `omp`'s own cache with no version to compare against, so there is no
    // cheap staleness test — and the refresh is idempotent.
    const refresh = ["plugin", "marketplace", "update", marketplace];
    actions.push({ summary: `${BIN} ${refresh.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, refresh);
      // **Ownership, not activity**, which is the rule `receipt.ts` states for
      // command entries: an undo is recorded when the command changed
      // something *or when the state it would have produced is provably this
      // tool's*. Keying it on "did this run add it" instead meant run 2's
      // receipt dropped the un-register, so the uninstall after it deleted the
      // payload and left `virajp-plugins` registered at the path it had just
      // removed — after which a later
      // `omp plugin install <other>@virajp-plugins` fails outright with
      // "Plugin source directory does not exist".
      //
      // The refresh itself records no undo: it restores no prior state and
      // there is nothing to roll a catalog back to.
      receipt.command(
        ["plugin", "marketplace", "add", want],
        ["plugin", "marketplace", "remove", marketplace],
      );
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
        // `<name>@<marketplace>` on the undo too, for the same reason as the
        // install and one worse consequence: given a bare name `omp` exits 0
        // and prints "✔ Uninstalled" while only half-removing — the plugin
        // stays in `omp plugin list`, and its record, symlink and cache dir all
        // survive. The qualified form removes all three.
        receipt.command(install, [
          "plugin",
          "uninstall",
          `${name}@${marketplace}`,
          "--scope",
          scope,
        ]);
      }
    }
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

/**
 * Copy the marketplace payload somewhere that outlives the runner.
 *
 * `context.sourceRoot` is the unpacked package, and under `pnpx` that is a
 * `pnpm dlx` store path — reclaimed by `pnpm store prune`. `omp` records the
 * path it was given and re-reads it for every later install, so registering the
 * store path left a marketplace whose catalog still advertised all 13 plugins
 * while installing any not-yet-installed one failed outright.
 *
 * `cpSync` rather than `copyTree`, for the same two reasons as Claude's: this
 * tree carries no `%%AI_PLUGINS_ROOT%%` tokens, and `copyTree` routes text
 * through `writeFileAtomic`, which drops the source mode — Oh-My-Pi's bundles
 * ship no executables today, but the hook extensions are `.ts` beside them and
 * the asymmetry is not worth inheriting.
 *
 * The destination is cleared first, so a plugin or skill deleted upstream
 * disappears rather than lingering — the same rule `plugins:build` follows for
 * the rendered trees.
 */
function installPayload(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const to = ohmypiMarketplaceRoot(context.home);
  const from = join(context.sourceRoot, TREE);

  if (!existsSync(from)) {
    throw new Error(`missing ${from} — run \`mise run plugins:build\``);
  }

  const actions: Action[] = [{
    summary: `copy the marketplace payload to ${to}`,
    path: to,
  }];
  if (dryRun) {
    return actions;
  }

  // Outermost first: revert replays backwards, so the payload comes out before
  // the directories holding it are asked whether they are empty. `cpSync`
  // creates both parents (`<data>/virajp/` and `<data>/virajp/ai-plugins/`) and
  // nothing was recording them, so they survived every uninstall. `ownedDir`
  // removes only when empty, which is what makes claiming them safe.
  receipt.ownedDir(dirname(dirname(to)));
  receipt.ownedDir(dirname(to));
  // Recorded before the write, so an interrupted install still has the tree in
  // its receipt. Recorded unconditionally: a payload already there is ours.
  receipt.tree(to);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, preserveTimestamps: true });
  return actions;
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
