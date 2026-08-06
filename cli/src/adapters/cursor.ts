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
 *   Cursor install resolves over the network even though `dist/cursor/` is
 *   sitting right there. This is the one target where the committed-`dist/`
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

  return { receipt: receipt.build(context.now), actions };
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

  let text = before;
  for (const name of names) {
    const entry = plugins.get(name);
    if (entry === undefined) {
      throw new Error(
        `${name} is not listed in ${MANIFEST} — run \`mise run plugins:build\``,
      );
    }

    const path = ["plugins", `${marketplace}/${name}`];
    const desired = {
      enabled: true,
      gitUrl: entry.source.url,
      ...(entry.source.ref ? { gitRef: entry.source.ref } : {}),
      ...(entry.source.path ? { gitPath: entry.source.path } : {}),
    };

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

    // A file we create is undone by deleting it; one that already existed is
    // undone key by key, so a concurrent edit by another tool survives our
    // uninstall. Recording both would have revert fight itself.
    if (existed) {
      const owned = shallowestNew(parsed, path);
      const present = parsed !== undefined
        && getPath(parsed, owned) !== undefined;
      receipt.configKey(
        file,
        owned,
        present
          ? { present, value: getPath(parsed, owned) }
          : { present: false },
      );
    }
    text = setJsonPath(text, path, desired);
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
    // Directory before file: revert replays in reverse, so recording it second
    // would try to remove `.cursor/` while our settings file is still in it,
    // and a non-empty directory is left alone.
    receipt.dir(dirname(file));
    if (!existed) {
      receipt.file(file);
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, text);
  }
  return [action];
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
