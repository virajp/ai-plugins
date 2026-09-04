/**
 * Version reporting — this CLI's own version, and what `main` offers.
 *
 * The shape of this question changed twice. The original installer asked Claude
 * Code (`claude plugin list --json`); the four-target CLI could not, so it
 * compared the marketplace manifest *inside the package* against the one on
 * `main`, on the premise that a plugin's version in this build is what an
 * install would give you.
 *
 * **That premise is gone.** Plugin content no longer ships in the npm package at
 * all — the marketplace is served from GitHub and `claude plugin install` does
 * the installing — so there is no local manifest to compare against, and the
 * plugin block reports what `main` offers rather than a local-versus-remote
 * diff. Asking Claude what it currently has would be a better answer again, and
 * is deliberately not done here: it is a second bookkeeping format to parse for
 * a report, and `claude plugin list` answers it natively.
 *
 * Nothing here reports on-disk state any more. Everything this CLI installs is
 * installed by Claude or by graphify, each of which answers for its own version.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  fetchGithubJson,
  fetchJson,
} from "./github.ts";

/** The published package, and the manifest on `main`. */
export const NPM_LATEST_URL =
  "https://registry.npmjs.org/@virajp.dev/claude-plugins/latest";
export const REMOTE_MARKETPLACE_URL =
  "https://raw.githubusercontent.com/virajp/claude-plugins/main/.claude-plugin/marketplace.json";

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
  /** What `main` lists. Absent when the entry carries no version. */
  readonly version?: string;
}

export interface VersionReport {
  readonly cli: string;
  /** Absent when npm could not be reached. */
  readonly cliLatest?: string;
  readonly plugins: readonly PluginVersion[];
  /** Why the remote half is missing, when it is. */
  readonly remoteError?: string;
}

/** The published package's version — the CLI's own. */
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

/** Every plugin the manifest lists, in its own order. */
export function manifestVersions(manifest: Manifest): PluginVersion[] {
  return (manifest.plugins ?? []).map(p => ({
    name: p.name,
    ...(p.version === undefined ? {} : { version: p.version }),
  }));
}

export interface VersionInputs {
  readonly sourceRoot: string;
  /** The npm registry — **not** GitHub, so no credential is attached. */
  readonly fetchNpm?: <T>(url: string) => Promise<T>;
  /** GitHub — `$GITHUB_API_TOKEN` when the environment offers one. */
  readonly fetchGithub?: <T>(url: string) => Promise<T>;
}

/**
 * Gather the report.
 *
 * The remote half is best-effort: a machine with no network still gets a useful
 * answer about what it has installed. The caller decides whether that is an
 * error.
 */
export async function buildVersionReport(
  inputs: VersionInputs,
): Promise<VersionReport> {
  const local = { cli: readCliVersion(inputs.sourceRoot) };

  const npm = inputs.fetchNpm ?? fetchJson;
  const github = inputs.fetchGithub ?? fetchGithubJson;
  try {
    const [latest, manifest] = await Promise.all([
      npm<{ version: string; }>(NPM_LATEST_URL),
      github<Manifest>(REMOTE_MARKETPLACE_URL),
    ]);
    return {
      ...local,
      cliLatest: latest.version,
      plugins: manifestVersions(manifest),
    };
  }
  catch (error) {
    return { ...local, plugins: [], remoteError: (error as Error).message };
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
  // `0` guards the spread: with no plugins to measure — the offline path —
  // `Math.max()` of nothing is `-Infinity`, and `padEnd(-Infinity)` throws.
  const width = Math.max(0, ...report.plugins.map(p => p.name.length));
  const lines = [
    `@virajp.dev/claude-plugins  ${report.cli}${
      updateNote(report.cli, report.cliLatest)
    }`,
  ];

  if (report.remoteError !== undefined) {
    lines.push(
      "",
      `Could not list the plugins on main: ${report.remoteError}`,
    );
    return lines.join("\n");
  }

  lines.push(
    "",
    "Plugins available on main (virajp-plugins):",
    ...report.plugins.map(plugin =>
      `  ${plugin.name.padEnd(width)}  ${plugin.version ?? "unversioned"}`
    ),
    "",
    "Installed with `claude plugin install <name>@virajp-plugins`; what you "
      + "have is `claude plugin list`.",
  );
  return lines.join("\n");
}
