/**
 * Version reporting — what is here, what is on disk, and what is available.
 *
 * The shape of this question changed twice. `bin/installer.mjs` asked Claude
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
 * **The statusline is the opposite case, and the one that was actually wrong.**
 * This block used to print the running package's version beside it, annotated
 * "bundled with the CLI" — which under `pnpx` is whatever was just downloaded,
 * so the version *installed on disk* was never shown and a stale bar was
 * invisible. The script now self-reports (`statusline --version`), so this runs
 * the installed copy and prints installed against bundled.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  fetchGithubJson,
  fetchJson,
} from "./github.ts";
import { statuslineScriptFile } from "./statusline.ts";

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
  /** What `main` lists. Absent when the entry carries no version. */
  readonly version?: string;
}

/**
 * What the statusline copy on disk reports.
 *
 * Three states rather than an optional string, because "no bar installed" and
 * "a bar too old to answer" are different facts and the second is the one that
 * needs explaining: every install before the `--version` flag existed lands
 * here, and reading it as absent would tell the user to install something they
 * already have.
 */
export type InstalledStatusline =
  | { readonly state: "absent"; }
  | { readonly state: "unknown"; }
  | { readonly state: "known"; readonly version: string; };

export interface VersionReport {
  readonly cli: string;
  /** Absent when npm could not be reached. */
  readonly cliLatest?: string;
  /** What this package ships, which `i:test` asserts the script agrees with. */
  readonly statuslineBundled: string;
  readonly statuslineInstalled: InstalledStatusline;
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

/**
 * Run one script and return its stdout, or `undefined` if it could not run.
 *
 * **Invoked through `process.execPath` rather than as an executable**, which the
 * script itself does for its own `--refresh-spend` child. It is a `#!/usr/bin/env
 * node` file installed at 0755, so executing it directly works — until a copy
 * loses its bit, or the machine is Windows, where the shebang means nothing.
 *
 * **`input: ""` is load-bearing.** A statusline old enough to lack `--version`
 * ignores the flag and waits on stdin for a render payload; inheriting this
 * process's stdin would hang `--version` forever on the one case the flag exists
 * to detect. Closing it immediately makes that script render a bar and exit,
 * which the caller recognises as "not a version".
 */
export type RunScript = (script: string) => string | undefined;

/** A semver-ish line and nothing else — what the `--version` flag prints. */
const VERSION_LINE = /^v?\d+\.\d+\.\d+[\w.+-]*$/;

/**
 * Ask the installed script what it is.
 *
 * Anything other than a bare version means the flag was not understood: an old
 * script answers a `--version` it does not know about by rendering a powerline
 * bar, so the check is on the *shape of the answer*, never on the exit code
 * (which is 0 in both cases).
 */
export function readInstalledStatusline(
  home: string,
  run: RunScript = runScript,
): InstalledStatusline {
  const script = statuslineScriptFile(home);
  if (!existsSync(script)) {
    return { state: "absent" };
  }
  const output = run(script)?.trim() ?? "";
  return VERSION_LINE.test(output)
    ? { state: "known", version: output.replace(/^v/, "") }
    : { state: "unknown" };
}

const runScript: RunScript = script => {
  const result = spawnSync(process.execPath, [script, "--version"], {
    encoding: "utf8",
    input: "",
    timeout: 5000,
  });
  return result.error !== undefined ? undefined : result.stdout;
};

export interface VersionInputs {
  readonly sourceRoot: string;
  readonly home: string;
  /** The npm registry — **not** GitHub, so no credential is attached. */
  readonly fetchNpm?: <T>(url: string) => Promise<T>;
  /** GitHub — `$GITHUB_API_TOKEN` when the environment offers one. */
  readonly fetchGithub?: <T>(url: string) => Promise<T>;
  readonly runStatusline?: RunScript;
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
  const cli = readCliVersion(inputs.sourceRoot);
  const local = {
    cli,
    statuslineBundled: cli,
    statuslineInstalled: readInstalledStatusline(
      inputs.home,
      inputs.runStatusline,
    ),
  };

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

/**
 * The statusline's line.
 *
 * The version that matters is the one on disk: a `pnpx` run reports whatever it
 * just downloaded, which is why "bundled" is only ever context for the installed
 * number rather than the answer itself.
 */
export function describeStatusline(report: VersionReport): string {
  const bundled = report.statuslineBundled;
  switch (report.statuslineInstalled.state) {
    case "absent":
      return `not installed  (${bundled} here — run --statusline)`;
    case "unknown":
      return `unknown (predates self-reporting)  →  ${bundled} here `
        + "(re-run --statusline)";
    case "known": {
      const installed = report.statuslineInstalled.version;
      return cmpVer(bundled, installed) > 0
        ? `${installed}  →  ${bundled} here  (re-run --statusline)`
        : `${installed}  (latest)`;
    }
  }
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
    `  ${"statusline".padEnd(width)}  ${describeStatusline(report)}`,
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
