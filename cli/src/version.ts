/**
 * Version reporting — what is here, and what is available.
 *
 * `bin/installer.mjs` answered this by asking Claude Code:
 * `claude plugin list --json`, cross-referenced against the marketplace manifest
 * on `main`. That worked while Claude was the only target it could install
 * plugins into. With four targets it does not: three of them keep their own
 * bookkeeping in their own shapes, and only some of those CLIs are even
 * installable on a given machine.
 *
 * So the question is asked differently. **A plugin's version in this build is
 * what an install would give you**, because every target either reads
 * `<target>/` in place or copies it — so comparing the manifest here
 * against the manifest on `main` answers "am I current?" for all five at once,
 * with no per-tool query and nothing to guess at.
 *
 * What that deliberately does not report is the version a target has *right
 * now*, for a user who installed and then let the package go stale. `--upgrade`
 * covers that case by re-running the install, which is idempotent.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";

/** The published package, and the manifest on `main`. */
export const NPM_LATEST_URL =
  "https://registry.npmjs.org/@askviraj/ai-plugins/latest";
export const REMOTE_MARKETPLACE_URL =
  "https://raw.githubusercontent.com/virajp/ai-plugins/main/.claude-plugin/marketplace.json";

/**
 * Compare two semver-ish versions, `-1 | 0 | 1`.
 *
 * Ported from `bin/utils.mjs` unchanged, including its tolerance: a leading `v`
 * is stripped, missing segments read as zero, and a non-numeric core segment
 * parses to zero rather than throwing. A version string is data from the
 * network here, so refusing to compare would turn a malformed remote entry into
 * a crash.
 */
export function cmpVer(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = "", pre = ""] = String(v).replace(/^v/, "").split("-");
    return {
      nums: core.split(".").map(n => Number.parseInt(n, 10) || 0),
      pre,
    };
  };
  const va = parse(a);
  const vb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (va.nums[i] ?? 0) - (vb.nums[i] ?? 0);
    if (d !== 0) {
      return d > 0 ? 1 : -1;
    }
  }
  if (va.pre === vb.pre) {
    return 0;
  }
  // A release outranks its own prerelease: 1.2.0 > 1.2.0-rc.1.
  if (va.pre === "") {
    return 1;
  }
  if (vb.pre === "") {
    return -1;
  }
  return cmpPre(va.pre, vb.pre);
}

/**
 * Compare two prerelease strings, dot-segment by dot-segment.
 *
 * Numeric when both segments are numeric — so `rc.10` beats `rc.2`, which a
 * lexical comparison gets backwards — lexical otherwise, and a shorter run of
 * segments is smaller.
 */
export function cmpPre(a: string, b: string): number {
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
      const d = Number.parseInt(x, 10) - Number.parseInt(y, 10);
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

export interface PluginVersion {
  readonly name: string;
  /** What this build ships. Absent when the manifest entry carries no version. */
  readonly local?: string;
  /** What `main` lists. Absent when the remote could not be read, or omits it. */
  readonly remote?: string;
}

export interface VersionReport {
  readonly cli: string;
  /** Absent when npm could not be reached. */
  readonly cliLatest?: string;
  readonly plugins: readonly PluginVersion[];
  /** Why the remote half is missing, when it is. */
  readonly remoteError?: string;
}

/** The published package's version — the CLI's own, and the statusline's. */
export function readCliVersion(sourceRoot: string): string {
  const path = join(sourceRoot, "package.json");
  if (!existsSync(path)) {
    throw new Error(`missing ${path}`);
  }
  return (JSON.parse(readFileSync(path, "utf8")) as { version: string; })
    .version;
}

interface Manifest {
  readonly plugins?: readonly { name: string; version?: string; }[];
}

/** Plugin → version, from a marketplace manifest. */
export function manifestVersions(
  manifest: Manifest,
): Map<string, string | undefined> {
  return new Map((manifest.plugins ?? []).map(p => [p.name, p.version]));
}

export function localVersions(
  sourceRoot: string,
): Map<string, string | undefined> {
  const path = join(sourceRoot, ".claude-plugin", "marketplace.json");
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return manifestVersions(JSON.parse(readFileSync(path, "utf8")) as Manifest);
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return await response.json() as T;
}

/**
 * Gather the report.
 *
 * The remote half is best-effort: a machine with no network still gets a useful
 * answer about what it has. The caller decides whether that is an error.
 */
export async function buildVersionReport(
  sourceRoot: string,
  fetcher: <T>(url: string) => Promise<T> = fetchJson,
): Promise<VersionReport> {
  const cli = readCliVersion(sourceRoot);
  const local = localVersions(sourceRoot);

  try {
    const [npm, manifest] = await Promise.all([
      fetcher<{ version: string; }>(NPM_LATEST_URL),
      fetcher<Manifest>(REMOTE_MARKETPLACE_URL),
    ]);
    const remote = manifestVersions(manifest);
    return {
      cli,
      cliLatest: npm.version,
      plugins: [...local].map(([name, version]) => ({
        name,
        ...(version === undefined ? {} : { local: version }),
        ...(remote.get(name) === undefined
          ? {}
          : { remote: remote.get(name) as string }),
      })),
    };
  }
  catch (error) {
    return {
      cli,
      plugins: [...local].map(([name, version]) => ({
        name,
        ...(version === undefined ? {} : { local: version }),
      })),
      remoteError: (error as Error).message,
    };
  }
}

/** ` → X (update available)`, or ` (latest)`. */
export function updateNote(current: string, latest?: string): string {
  if (latest === undefined) {
    return "";
  }
  return cmpVer(latest, current) > 0
    ? `  →  ${latest}  (update available)`
    : "  (latest)";
}

/** The whole report as text. Pure, so what it prints is what the tests read. */
export function renderVersionReport(report: VersionReport): string {
  const width = Math.max(
    ...report.plugins.map(p => p.name.length),
    "statusline".length,
  );
  const lines = [
    `@askviraj/ai-plugins  ${report.cli}${
      updateNote(report.cli, report.cliLatest)
    }`,
    `  ${"statusline".padEnd(width)}  ${report.cli}  (bundled with the CLI)`,
    "",
    "Plugins (virajp-plugins):",
  ];

  // Only meaningful once the remote actually answered: without it, every plugin
  // is missing a counterpart for the same uninteresting reason.
  const compared = report.remoteError === undefined;

  for (const plugin of report.plugins) {
    lines.push(`  ${plugin.name.padEnd(width)}  ${describe(plugin, compared)}`);
  }

  if (report.remoteError !== undefined) {
    lines.push(
      "",
      `Could not check for updates: ${report.remoteError}`,
    );
  }
  return lines.join("\n");
}

/**
 * One plugin's version line.
 *
 * The case worth spelling out is a plugin this build has and `main` does not —
 * one added since the last release. Left bare it renders as a version with no
 * annotation beside neighbours that all carry one, which reads as a failure
 * rather than as the newest thing here.
 */
function describe(plugin: PluginVersion, compared: boolean): string {
  if (plugin.local === undefined) {
    return "unversioned";
  }
  if (plugin.remote !== undefined) {
    return `${plugin.local}${updateNote(plugin.local, plugin.remote)}`;
  }
  return compared ? `${plugin.local}  (not on main yet)` : plugin.local;
}
