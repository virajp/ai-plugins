/**
 * Claude Code.
 *
 * Driven through `claude plugin`, like Oh-My-Pi. Claude registers a `directory`
 * source and re-reads it **on every later session**, so what that path is
 * matters more than it looks.
 *
 * **It is a copy under `~/.local/share/virajp/ai-plugins`, not `sourceRoot`.**
 * It used to be `sourceRoot` — the unpacked package — which reads fine until
 * you notice that the documented way to run this is `pnpx`, i.e. `pnpm dlx`, a
 * deliberately temporary install. The store path is unreferenced the moment the
 * run ends and `pnpm store prune` reclaims it, leaving Claude pointed at
 * nothing. A transient runner cannot host a permanent data source. Claude was
 * the only target with that combination: OpenCode and Oh-My-Pi both copy, and
 * Cursor resolves from git.
 *
 * A remote `github` source would also be durable and was what the retired
 * `bin/installer.js` used, but `marketplace add` takes no ref — the shorthand
 * follows the default branch, so every user would track `main` rather than the
 * version they installed, and `version.ts`'s premise that "a plugin's version
 * in this build is what an install would give you" would stop holding.
 *
 * The payload keeps its repo-root-relative shape (`.claude-plugin/` beside
 * `claude/`) so the copied manifest stays byte-identical — see
 * `claudeMarketplaceRoot`.
 *
 * Verified against a throwaway `CLAUDE_CONFIG_DIR`:
 *
 * - `claude plugin marketplace add <path>` → user `settings.json`
 *   `extraKnownMarketplaces.<name>.source = {source: "directory", path}`, plus a
 *   `plugins/known_marketplaces.json` cache the CLI owns.
 * - `claude plugin install <p>@<m> --scope user|project` → `enabledPlugins` in
 *   the settings file for that scope (project writes `<cwd>/.claude/`).
 * - **Dependencies install themselves.** Installing `vwf` reported
 *   "+ 4 dependencies", so this adapter must not expand them — doing so would
 *   record undo entries for plugins Claude manages, and uninstalling one would
 *   then remove a dependency another plugin still needs.
 * - Uninstall leaves auto-installed dependencies behind, suggesting
 *   `claude plugin prune`. That matches the existing installer's rule that an
 *   uninstall never removes an unnamed dependency, so `--prune` is not passed.
 * - A bare `.` source is rejected ("Invalid marketplace source format"); an
 *   absolute path is accepted, which is what this passes.
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
  getPath,
  readJsonc,
} from "../config/json.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  claudeConfigDir,
  claudeMarketplaceRoot,
  dataDir,
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

const BIN = "claude";

/** Generated into the repo root, not `claude/` — see `renderer/src/targets/claude.ts`. */
const MANIFEST_DIR = ".claude-plugin";
const MANIFEST = join(MANIFEST_DIR, "marketplace.json");

/**
 * The rendered bundles, named separately from the manifest because both travel
 * and their **relative positions** are the contract: the manifest's sources are
 * `./claude/plugins/<name>`, resolved against the marketplace root.
 */
const TREE = "claude";

export const claude: Adapter = {
  id: "claude",
  displayName: "Claude Code",
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin(BIN);
  },

  configPaths(context, scope): string[] {
    return [settingsFile(context, scope)];
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
      const selector = entry.ran[2];
      const scope = entry.ran.at(-1) as Scope;
      if (selector !== undefined && !isInstalled(context, scope, selector)) {
        missing.push(selector);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    revertReceipt(receipt, {
      restoreKey() {
        // Claude's settings are written by its own CLI, never key-by-key here.
      },
      runUndo(undo) {
        claudeExec(context, undo);
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
  // Copy before registering, so the path exists by the time Claude reads it —
  // and so revert, which walks entries backwards, un-registers the marketplace
  // before deleting what it pointed at.
  actions.push(...installPayload(context, receipt, dryRun));
  actions.push(
    ...registerMarketplace(context, marketplace, receipt, dryRun),
  );

  for (const scope of ["user", "project"] as const) {
    for (const name of scope === "user" ? plan.user : plan.project) {
      const selector = `${name}@${marketplace}`;
      // No dependency expansion: `claude plugin install` pulls them in itself,
      // and naming them here would record undos for plugins it manages.
      const install = ["plugin", "install", selector, "--scope", scope];
      const uninstall = ["plugin", "uninstall", name, "--scope", scope];
      if (isInstalled(context, scope, selector)) {
        // Enabled already, so `plugin install` would answer "already
        // installed" and change nothing. That is not the same as being up to
        // date: Claude caches plugin content per version under
        // `plugins/cache/<marketplace>/<name>/<version>/` and keeps serving
        // the cached one, so copying a newer payload over the marketplace
        // directory leaves the old version live. Re-running the installer —
        // which is this tool's documented upgrade path, there being no
        // `--upgrade` — silently delivered nothing.
        //
        // `plugin update` is the only command that re-resolves the version.
        // Run it only on an actual mismatch, so the common no-change re-run
        // stays a no-op rather than churning the user's plugin cache.
        const want = advertisedVersion(context, name);
        const have = installedVersion(context, scope, selector);
        if (want !== undefined && have !== undefined && want !== have) {
          // `selector`, not `name`: `plugin update` takes the same
          // `<name>@<marketplace>` form as `install`, NOT the bare name
          // `uninstall` takes. The bare name fails with `Plugin "vwf" not
          // found` — and because the payload copy runs first and the throw
          // escapes before the receipt is written, that failure stranded the
          // install with no way to undo it through this tool.
          const update = ["plugin", "update", selector, "--scope", scope];
          actions.push({
            summary: `${BIN} ${update.join(" ")}  (${have} → ${want})`,
          });
          if (!dryRun) {
            // Soft, deliberately — the same rule `setupGraphify` follows, and
            // for the same reason: the payload copy has already succeeded, and
            // a throw here escapes before the receipt is written, leaving the
            // install on disk with nothing to uninstall from. A version that
            // did not advance is a degraded run, not a broken one: the content
            // is in place and the next run retries. Say so rather than
            // reporting an upgrade that did not happen.
            const result = claudeExec(context, update);
            if (result.status !== 0) {
              context.log(
                `claude: \`${name}\` is installed at ${have} and this build `
                  + `ships ${want}, but \`plugin update\` failed — everything `
                  + `else is in place; re-run to retry`,
              );
            }
          }
        }
        // The undo is still recorded. Each run overwrites the receipt, so
        // skipping it here left a repeat install with a receipt naming only
        // the payload, and an uninstall that deleted the payload while leaving
        // the plugin enabled against a marketplace whose directory had just
        // been removed.
        //
        // Recording it is safe because the plan **named** this plugin: the
        // caller asked this tool to manage it, which is a different question
        // from whether this particular run is what put it there. An update is
        // deliberately *not* separately undoable — the undo for "this tool put
        // this plugin here" is still `uninstall`, and there is no downgrade.
        if (!dryRun) {
          receipt.command(install, uninstall);
        }
        continue;
      }
      actions.push({ summary: `${BIN} ${install.join(" ")}` });
      if (!dryRun) {
        runOrThrow(context, install);
        receipt.command(install, uninstall);
      }
    }
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

/**
 * Copy the marketplace payload somewhere that outlives the runner.
 *
 * `context.sourceRoot` is the unpacked package, and under `pnpx` that is a
 * `pnpm dlx` store path — unreferenced the moment the run ends, and reclaimed
 * by `pnpm store prune`. Registering it as a `directory` source pointed Claude
 * at a directory with a shorter life than the install.
 *
 * A plain recursive `cpSync` rather than `copyTree`, for two reasons. The
 * Claude tree carries **no** `%%AI_PLUGINS_ROOT%%` tokens — it uses Claude's own
 * runtime `${CLAUDE_PLUGIN_ROOT}` — and token substitution is the only reason
 * that module exists. And `copyTree` writes anything matching its `TEXT` regex
 * through `writeFileAtomic`, which does not carry the source mode: `.sh`
 * matches, so the three hook scripts shipped at 755 would arrive at 644.
 * `cpSync` preserves mode.
 *
 * The destination is cleared first, so a plugin or skill deleted upstream
 * disappears rather than lingering — the same rule `plugins:build` follows for
 * the rendered trees, and for the same reason: a stale file nobody rendered is
 * indistinguishable from a current one.
 */
function installPayload(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const to = claudeMarketplaceRoot(context.home);
  const parts = [MANIFEST_DIR, TREE] as const;

  for (const part of parts) {
    const from = join(context.sourceRoot, part);
    if (!existsSync(from)) {
      throw new Error(`missing ${from} — run \`mise run plugins:build\``);
    }
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
  for (const part of parts) {
    cpSync(join(context.sourceRoot, part), join(to, part), {
      recursive: true,
      preserveTimestamps: true,
    });
  }
  return actions;
}

/**
 * Declare the marketplace, always at user scope — the source is one machine-wide
 * path, and the existing installer registers it there regardless of where the
 * plugins land.
 */
function registerMarketplace(
  context: AdapterContext,
  marketplace: string,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const declared = getPath(
    readSettings(context, "user"),
    ["extraKnownMarketplaces", marketplace, "source", "path"],
  );

  const root = claudeMarketplaceRoot(context.home);
  if (declared === root) {
    // Already pointing where this run would point it, so `add` is not re-run —
    // but the undo is still recorded, for the same reason as the plugins
    // above: the receipt is rewritten every run, and one that omits this
    // leaves an uninstall that removes the payload and abandons the
    // declaration naming it.
    //
    // Safe here in a way it was not before this path was managed. `root` is
    // inside the tool's own data directory, so a pin equal to it cannot be one
    // the user set up — the case the "already points at" branch below exists
    // to protect.
    if (!dryRun) {
      receipt.command(
        ["plugin", "marketplace", "add", root],
        ["plugin", "marketplace", "remove", marketplace, "--scope", "user"],
      );
    }
    return [];
  }
  const stale = typeof declared === "string"
    && isStalePin(declared, root, PACKAGE_NAME, dataDir(context.home));
  if (declared !== undefined && !stale) {
    // Re-adding would repoint a marketplace the user configured — and the
    // common case is a name collision with the *published* GitHub source, where
    // silently continuing installs from the wrong copy.
    context.log(
      `claude: marketplace \`${marketplace}\` already points at ${
        String(declared)
      }; installing from there rather than ${root}`,
    );
    return [];
  }

  const actions: Action[] = [];
  if (stale) {
    // One path this tool produced handing over to another. Two cases reach
    // here: an older install pinned to its own `pnpm dlx` store path, which is
    // the migration this relocation exists for, and the pre-relocation bug
    // where the pin named whichever store path registered first, so every later
    // `--upgrade` re-installed from the OLD tree and truthfully reported
    // "already up to date" while doing nothing.
    const remove = [
      "plugin",
      "marketplace",
      "remove",
      marketplace,
      "--scope",
      "user",
    ];
    actions.push({ summary: `${BIN} ${remove.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, remove);
    }
    context.log(
      `claude: marketplace \`${marketplace}\` re-pointed from ${
        String(declared)
      } to ${root}`,
    );
  }
  // `claude plugin marketplace add` rejects a bare `.`, so this is absolute.
  const add = ["plugin", "marketplace", "add", root];
  actions.push({ summary: `${BIN} ${add.join(" ")}` });
  if (!dryRun) {
    runOrThrow(context, add);
    receipt.command(add, [
      "plugin",
      "marketplace",
      "remove",
      marketplace,
      // Without a scope this removes the declaration from *every* scope.
      "--scope",
      "user",
    ]);
  }
  return actions;
}

/** The marketplace's own name, so the CLI selector matches what it registered. */
function readMarketplaceName(context: AdapterContext): string {
  const path = join(context.sourceRoot, MANIFEST);
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return (JSON.parse(readFileSync(path, "utf8")) as { name: string; }).name;
}

/**
 * The version this build's marketplace manifest advertises for `name`.
 *
 * Read from the manifest rather than `plugins.json`, which carries no versions
 * — the manifest is generated from each `plugin.yaml` and is the only place
 * the number exists on the install side.
 */
function advertisedVersion(
  context: AdapterContext,
  name: string,
): string | undefined {
  const path = join(context.sourceRoot, MANIFEST);
  if (!existsSync(path)) {
    return undefined;
  }
  const manifest = JSON.parse(readFileSync(path, "utf8")) as {
    plugins?: readonly { name?: string; version?: string; }[];
  };
  return manifest.plugins?.find(entry => entry.name === name)?.version;
}

/**
 * The version Claude currently has installed for `selector` at `scope`.
 *
 * `installed_plugins.json` is Claude's own bookkeeping — read, never written.
 * One selector can hold several entries (the same plugin at user and project
 * scope), so the scope has to be matched rather than taking the first.
 */
function installedVersion(
  context: AdapterContext,
  scope: Scope,
  selector: string,
): string | undefined {
  const path = join(configDir(context), "plugins", "installed_plugins.json");
  if (!existsSync(path)) {
    return undefined;
  }
  let parsed: { plugins?: Record<string, readonly unknown[]>; };
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as typeof parsed;
  }
  catch {
    // Claude's file, not ours. Unreadable means "cannot tell", which the
    // caller treats as "do not update" — never as "out of date".
    return undefined;
  }
  const entries = parsed.plugins?.[selector] ?? [];
  for (const entry of entries) {
    const record = entry as { scope?: string; version?: string; };
    if (record.scope === scope && typeof record.version === "string") {
      return record.version;
    }
  }
  return undefined;
}

function isInstalled(
  context: AdapterContext,
  scope: Scope,
  selector: string,
): boolean {
  return getPath(
    readSettings(context, scope),
    ["enabledPlugins", selector],
  ) !== undefined;
}

/** Read only, to decide what is already there. The CLI owns every write. */
function readSettings(
  context: AdapterContext,
  scope: Scope,
): Record<string, unknown> | undefined {
  const path = settingsFile(context, scope);
  return existsSync(path)
    ? readJsonc<Record<string, unknown>>(readFileSync(path, "utf8"))
    : undefined;
}

function settingsFile(context: AdapterContext, scope: Scope): string {
  return scope === "project"
    ? join(context.cwd, ".claude", "settings.json")
    : join(configDir(context), "settings.json");
}

function configDir(context: AdapterContext): string {
  return claudeConfigDir(context.home);
}

function claudeExec(context: AdapterContext, args: readonly string[]) {
  return context.exec(BIN, args, {
    cwd: context.cwd,
    env: { ...process.env, CLAUDE_CONFIG_DIR: configDir(context) },
  });
}

function runOrThrow(context: AdapterContext, args: readonly string[]): void {
  const result = claudeExec(context, args);
  if (result.status !== 0) {
    throw new Error(
      `\`${BIN} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}
