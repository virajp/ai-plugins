/**
 * Cursor.
 *
 * The only adapter that installs nothing. Cursor has a real marketplace, so
 * following it means writing a *reference* — the tool then clones and caches
 * the bundle itself — rather than copying the rendered tree the way OpenCode
 * needs.
 *
 * Three facts shape this file, all read out of Cursor's own loader because none
 * of them is documented and each fails silently if guessed:
 *
 * - **Plugin sources are git-only.** The union is a bare string, or an object
 *   tagged `github` / `url` / `git-subdir`; there is no local-path variant. So a
 *   Cursor install resolves over the network even though `cursor/` is sitting
 *   right there. This is the one target where the committed-render
 *   guarantee — what you install is what CI validated — does not hold, because
 *   Cursor reads whatever ref it resolves rather than the working copy.
 * - **Project scope is the only writable per-plugin surface.** A user-scope
 *   marketplace install is account-side (a gRPC `updateUserPluginInstall`), and
 *   the legacy local file that used to hold them is closed: `addGitHubPlugin`
 *   now throws "Direct GitHub plugin installs are no longer supported."
 *   User-scope requests therefore fall back to project scope.
 * - **`plugins` keys are `<marketplace>/<plugin>`**, split on the first `/`.
 *
 * The marketplace manifest the build emits is the contract between the two
 * halves, exactly as OpenCode's config fragment is: this file reads the git
 * coordinates out of it and never has to know the repo URL itself.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import { isDeepStrictEqual } from "node:util";
import writeFileAtomic from "write-file-atomic";
import {
  getPath,
  readJsonc,
  setJsonPath,
} from "../config/json.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  hasBin,
  shallowestNew,
} from "./support.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
} from "./types.ts";
import { planPlugins } from "./types.ts";

/** Cursor prefers this over `.claude-plugin/marketplace.json`; the build emits both. */
const MANIFEST = ".cursor-plugin/marketplace.json";

/** One `git-subdir` entry from the rendered marketplace manifest. */
interface ManifestPlugin {
  readonly name: string;
  readonly source: {
    readonly source: string;
    readonly url?: string;
    readonly path?: string;
    readonly ref?: string;
  };
}

export const cursor: Adapter = {
  id: "cursor",
  displayName: "Cursor",
  // Both are accepted so a manifest-declared scope is never rejected; `user` is
  // redirected in `run`, with a note, rather than refused.
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin("cursor");
  },

  configPaths(context): string[] {
    return [settingsFile(context)];
  },

  plan(context, plan): readonly Action[] {
    return run(context, plan, true).actions;
  },

  apply(context, plan): ApplyResult {
    return run(context, plan, false);
  },

  verify(context, receipt): string[] {
    void context;
    const missing: string[] = [];
    for (const entry of receipt.entries) {
      if (entry.kind === "configKey" && !existsSync(entry.file)) {
        missing.push(entry.file);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    void context;
    revertReceipt(receipt, {
      restoreKey(file, path, hadKey, previous) {
        if (!existsSync(file)) {
          return;
        }
        const text = readFileSync(file, "utf8");
        const parsed = readJsonc<Record<string, unknown>>(text);
        // Deleting a path whose parent is already gone throws rather than
        // no-opping, and an earlier entry in this same receipt may have removed
        // that parent.
        if (
          !hadKey && (parsed === undefined
            || getPath(parsed, path) === undefined)
        ) {
          return;
        }
        writeFileAtomic.sync(
          file,
          setJsonPath(text, path, hadKey ? previous : undefined),
        );
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

  if (plan.user.length > 0) {
    context.log(
      `cursor: installing ${plan.user.join(", ")} at project scope — Cursor `
        + "has no locally-writable user-scope plugin install (marketplace "
        + "installs there are account-side)",
    );
  }

  // Deduplicated: a plugin named at both scopes is one entry, and writing it
  // twice would record a second receipt key whose "prior value" is our own
  // first write — which reverts to the installed state instead of removing it.
  const names = [...new Set([...plan.user, ...plan.project])];
  // Sequenced deliberately: `build()` snapshots the entries, so evaluating it
  // in the same object literal as `mergeSettings` would capture an empty
  // receipt — property order would run it before anything was recorded.
  const actions = names.length === 0
    ? []
    : mergeSettings(context, names, receipt, dryRun);

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

function mergeSettings(
  context: AdapterContext,
  names: readonly string[],
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const { marketplace, plugins } = readManifest(context);
  const file = settingsFile(context);
  const existed = existsSync(file);
  const before = existed ? readFileSync(file, "utf8") : "";
  const parsed = readJsonc<Record<string, unknown>>(before);

  if (before.length > 0 && parsed === undefined) {
    throw new Error(`refusing to edit malformed Cursor settings: ${file}`);
  }

  const wanted = names.map(name => {
    const entry = plugins.get(name);
    if (entry === undefined) {
      throw new Error(
        `${name} is not listed in ${MANIFEST} — run \`mise run plugins:build\``,
      );
    }
    return {
      path: ["plugins", `${marketplace}/${name}`],
      desired: {
        enabled: true,
        gitUrl: entry.source.url,
        ...(entry.source.ref ? { gitRef: entry.source.ref } : {}),
        ...(entry.source.path ? { gitPath: entry.source.path } : {}),
      },
    };
  });

  let text = before;
  for (const { path, desired } of wanted) {
    // Already exactly right — leave the bytes alone. Rewriting an identical
    // value is not a no-op: `modify` only formats when the document was empty,
    // so the second write would collapse the entry onto one line and a
    // re-install would not be byte-idempotent.
    if (
      parsed !== undefined
      && JSON.stringify(getPath(parsed, path)) === JSON.stringify(desired)
    ) {
      continue;
    }
    text = setJsonPath(text, path, desired);
  }

  // **Ownership, not existence** — and the claim is recorded even when this run
  // writes nothing. Skipping it on an unchanged key (the `continue` above) and
  // on an unchanged file (the no-op return below) meant a *second* install
  // produced an empty receipt, which then overwrote the complete one from the
  // first: the uninstall after it reported success and left the whole install
  // in place. `--upgrade` reaches the same path, so upgrading alone was enough.
  //
  // `basis` is the file as it would be without our own entries, which is what
  // run 1 actually saw — a plugin key holding exactly the value we would write
  // is one an earlier run of ours wrote, whatever is on disk now. Computing the
  // claim against that makes every run record what run 1 recorded.
  const basis = withoutOwnEntries(parsed, wanted);

  if (!dryRun) {
    // Directory before file: revert replays in reverse, so recording it second
    // would try to remove `.cursor/` while our settings file is still in it,
    // and a non-empty directory is left alone.
    if (basis === undefined) {
      // Nothing here is anyone else's. `ownedDir`, not `dir`: the guarded form
      // skips a directory that is already there, so on run 2 it recorded
      // nothing and `.cursor/` survived the uninstall.
      receipt.ownedDir(dirname(file));
      receipt.createdFile(file);
    }
    else {
      receipt.dir(dirname(file));
      // A file that is also the user's is undone key by key, so a concurrent
      // edit by another tool survives our uninstall. Recording both would have
      // revert fight itself.
      for (const { path } of wanted) {
        const owned = shallowestNew(basis, path);
        const previous = getPath(basis, owned);
        receipt.configKey(
          file,
          owned,
          previous === undefined
            ? { present: false }
            : { present: true, value: previous },
        );
      }
    }
  }

  if (text === before) {
    return [];
  }

  const action: Action = {
    summary: `update ${file}`,
    path: file,
    diff: { before, after: text },
  };
  if (!dryRun) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, text);
  }
  return [action];
}

/**
 * The settings file as it would be without this tool's own plugin entries.
 *
 * A key holding exactly the value we would write is ours, whichever run put it
 * there — so taking those out reconstructs what the *first* run saw, and a
 * claim computed against it is the same on every run. Parents emptied by the
 * removal go too, matching `shallowestNew`'s rule that a container we created
 * is ours to remove rather than leave behind as an orphaned `"plugins": {}`.
 *
 * `undefined` means nothing else is in the file: it is ours outright.
 */
function withoutOwnEntries(
  parsed: Record<string, unknown> | undefined,
  wanted: readonly { path: string[]; desired: unknown; }[],
): Record<string, unknown> | undefined {
  if (parsed === undefined) {
    return undefined;
  }
  const rest = structuredClone(parsed);
  for (const { path, desired } of wanted) {
    if (!isDeepStrictEqual(getPath(rest, path), desired)) {
      continue;
    }
    for (let depth = path.length; depth > 0; depth--) {
      const parent = depth === 1
        ? rest
        : getPath(rest, path.slice(0, depth - 1));
      if (parent === null || typeof parent !== "object") {
        break;
      }
      const container = parent as Record<string, unknown>;
      delete container[path[depth - 1] as string];
      if (Object.keys(container).length > 0) {
        break;
      }
    }
  }
  return Object.keys(rest).length === 0 ? undefined : rest;
}

/**
 * The git coordinates for each plugin, straight from the rendered manifest.
 *
 * Reading them rather than reconstructing them keeps the repo URL in one place
 * (`templates/marketplace.yaml`) and means a plugin missing from the manifest
 * fails loudly here instead of installing an entry Cursor silently skips for
 * having no usable source.
 */
function readManifest(
  context: AdapterContext,
): { marketplace: string; plugins: Map<string, ManifestPlugin>; } {
  const path = join(context.sourceRoot, MANIFEST);
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as {
    name: string;
    plugins?: readonly ManifestPlugin[];
  };
  return {
    marketplace: parsed.name,
    plugins: new Map((parsed.plugins ?? []).map(p => [p.name, p])),
  };
}

/** Cursor's project settings. There is no user-scope equivalent to write. */
function settingsFile(context: AdapterContext): string {
  return join(context.cwd, ".cursor", "settings.json");
}
