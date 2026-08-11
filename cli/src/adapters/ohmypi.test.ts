import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { ohmypi } from "./ohmypi.ts";
import type {
  AdapterContext,
  AdapterPlan,
  Exec,
} from "./types.ts";

/**
 * `exec` is injected, so these run without `omp` installed. The fake maintains
 * the real `marketplaces.json`, because the adapter reads it back to decide
 * whether registration is needed — and `omp` *errors* on a duplicate rather
 * than ignoring it, so getting that guard wrong is a failed install.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let home: string;
let cwd: string;
let context: AdapterContext;
let ran: string[][];
let env: (NodeJS.ProcessEnv | undefined)[];

const registryPath = () => join(home, ".omp", "marketplaces.json");

/**
 * A stand-in for `omp` that **refuses what the real one refuses**.
 *
 * The permissiveness of this fake is how a shipped bug survived: it used to
 * accept any `plugin install`, while the real `omp` errors on a plugin it
 * already has. So the suite was green while a second run of the CLI failed
 * outright on every machine. A fake that says yes to everything only tests
 * that we called it.
 *
 * Both refusals below were copied from real `omp` output, not guessed.
 */
const installed = new Set<string>();

const fakeOmp: Exec = (command, args, options) => {
  ran.push([command, ...args]);
  env.push(options?.env);
  const [, action, ...rest] = args;

  if (action === "marketplace" && rest[0] === "add") {
    if (existsSync(registryPath())) {
      return { status: 1, stdout: "", stderr: "Marketplace already exists" };
    }
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({
        version: 1,
        marketplaces: [{
          name: "virajp-plugins",
          sourceType: "local",
          // The real registry records where it points, which is what lets a
          // pin left by an older install of this package be recognised.
          sourceUri: rest[1],
        }],
      }),
    );
  }
  else if (action === "marketplace" && rest[0] === "remove") {
    rmSync(registryPath(), { force: true });
  }
  else if (action === "install") {
    const selector = rest[0] ?? "";
    if (installed.has(selector) && !args.includes("--force")) {
      return {
        status: 1,
        stdout: "",
        stderr: `Failed to install ${selector}: Error: Plugin "${selector}" `
          + "is already installed. Use force option to reinstall.",
      };
    }
    installed.add(selector);
  }
  else if (action === "uninstall") {
    for (const selector of [...installed]) {
      if (selector.startsWith(`${rest[0]}@`)) {
        installed.delete(selector);
      }
    }
  }
  return { status: 0, stdout: "", stderr: "" };
};

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-omp-home-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-omp-cwd-"));
  ran = [];
  env = [];
  installed.clear();
  context = {
    sourceRoot: repoRoot,
    home,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: fakeOmp,
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

/**
 * Where the payload is copied, and therefore what the marketplace is pinned to.
 *
 * Deliberately not `sourceRoot`: `omp` re-reads the registered path for every
 * later install, so a `pnpm dlx` store path leaves a catalog that still lists
 * all 13 plugins while installing an uninstalled one fails.
 */
const payloadRoot = () =>
  join(home, ".local", "share", "virajp", "ai-plugins", "ohmypi");

const planFor = (user: string[], project: string[] = []): AdapterPlan => ({
  target: "ohmypi",
  user,
  project,
});

describe("ohmypi adapter", () => {
  it("registers the local marketplace, then installs each plugin", () => {
    ohmypi.apply(context, planFor(["markdown"]));

    expect(ran.map(c => c.join(" "))).toEqual([
      `omp plugin marketplace add ${payloadRoot()}`,
      "omp plugin install markdown@virajp-plugins --scope user --force",
    ]);
    // The pin is only durable if the bytes are actually there — registering a
    // path this run did not populate is the failure being fixed, inverted.
    expect(existsSync(join(payloadRoot(), "vwf"))).toBe(true);
    expect(existsSync(join(payloadRoot(), ".omp-plugin", "marketplace.json")))
      .toBe(true);
  });

  it("re-copies the payload, dropping anything no longer rendered", () => {
    ohmypi.apply(context, planFor(["markdown"]));
    const stray = join(payloadRoot(), "gone-away");
    mkdirSync(stray, { recursive: true });

    ohmypi.apply(context, planFor(["markdown"]));

    // A bundle deleted upstream has to disappear: `omp` resolves `./<name>`
    // against this root, so a lingering directory is indistinguishable from a
    // plugin that still ships.
    expect(existsSync(stray)).toBe(false);
    expect(existsSync(join(payloadRoot(), "vwf"))).toBe(true);
  });

  it("always uses the <name>@<marketplace> form, so --scope is honoured", () => {
    // With a bare name `omp` warns and ignores --scope, installing at the
    // default scope instead — a silently wrong install, not an error.
    ohmypi.apply(context, planFor([], ["markdown"]));

    const install = ran.find(c => c.includes("install"));
    expect(install?.[3]).toBe("markdown@virajp-plugins");
    expect(install?.slice(-3)).toEqual(["--scope", "project", "--force"]);
  });

  it("installs both scopes in one run, without redirecting either", () => {
    // Unlike Cursor, Oh-My-Pi supports both scopes natively.
    ohmypi.apply(context, planFor(["markdown"], ["mise"]));

    const installs = ran.filter(c => c.includes("install")).map(c =>
      c.slice(-4).join(" ")
    );
    expect(installs).toEqual([
      "markdown@virajp-plugins --scope user --force",
      "mise@virajp-plugins --scope project --force",
    ]);
  });

  it("points the CLI at the injected HOME and cwd", () => {
    // Otherwise a test — or a project-scoped install — lands in the developer's
    // own ~/.omp.
    ohmypi.apply(context, planFor(["markdown"]));

    expect(env[0]?.["HOME"]).toBe(home);
  });

  it("survives three consecutive installs", () => {
    // The regression that shipped. Every bug in 3.0.1 and 3.0.2 appeared only
    // on the SECOND run, and nothing in this suite ran anything twice — so
    // three runs, because two proves repeatability and three proves it is not
    // an alternating state machine.
    for (const attempt of [1, 2, 3]) {
      expect(
        () => ohmypi.apply(context, planFor(["markdown"], ["mise"])),
        `attempt ${attempt}`,
      )
        .not
        .toThrow();
    }
  });

  it("forces every install, so a second run is not a hard error", () => {
    // `omp plugin install` errors on a plugin it already has ("Use force
    // option to reinstall"), so without --force the first run succeeded and
    // every run after it failed — which is exactly what `--upgrade` does. It
    // is also the only refresh: omp COPIES the bundle into its cache, so
    // skipping an installed plugin would pin it to the original content.
    ohmypi.apply(context, planFor(["markdown"]));

    const install = ran.find(c => c.includes("install"));
    expect(install?.at(-1)).toBe("--force");
  });

  it("re-points a marketplace left by an older install of this package", () => {
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({
        marketplaces: [{
          name: "virajp-plugins",
          sourceUri: "/store/node_modules/@askviraj/ai-plugins/ohmypi",
        }],
      }),
    );
    // A real package-shaped root: the adapter reads the marketplace name out
    // of it, and the path must look like a node_modules install for the pin to
    // count as this CLI's own rather than the user's.
    const newer = join(home, "node_modules", "@askviraj", "ai-plugins");
    mkdirSync(join(newer, "ohmypi", ".omp-plugin"), { recursive: true });
    writeFileSync(
      join(newer, "ohmypi", ".omp-plugin", "marketplace.json"),
      JSON.stringify({ name: "virajp-plugins", plugins: [] }),
    );

    ohmypi.apply({ ...context, sourceRoot: newer }, planFor(["markdown"]));

    const marketplace = ran.filter(c => c.includes("marketplace"));
    expect(marketplace[0]?.includes("remove")).toBe(true);
    expect(marketplace[1]?.includes("add")).toBe(true);
    expect(marketplace[1]?.at(-1)).toBe(payloadRoot());
  });

  it("leaves a registered marketplace with no recorded URI alone", () => {
    // Cannot tell whether it is stale, and re-adding is a hard error — so
    // guessing would turn an unknown into a failed run.
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({ marketplaces: [{ name: "virajp-plugins" }] }),
    );

    ohmypi.apply(context, planFor(["markdown"]));

    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
  });

  it("does not re-register a marketplace that is already configured", () => {
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({ marketplaces: [{ name: "virajp-plugins" }] }),
    );

    ohmypi.apply(context, planFor(["markdown"]));

    // Re-adding is a hard error in omp, so this guard is load-bearing.
    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
  });

  it("runs nothing on a dry run, but describes every command", () => {
    const actions = ohmypi.plan(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
    expect(actions.map(a => a.summary)).toEqual([
      `copy the marketplace payload to ${payloadRoot()}`,
      `omp plugin marketplace add ${payloadRoot()}`,
      "omp plugin install markdown@virajp-plugins --scope user --force",
    ]);
    // A dry run describes the copy without making it.
    expect(existsSync(payloadRoot())).toBe(false);
  });

  it("reverts by running the CLI's own removals, in reverse", () => {
    const { receipt } = ohmypi.apply(context, planFor(["markdown"]));
    ran = [];

    ohmypi.revert(context, receipt);

    expect(ran.map(c => c.join(" "))).toEqual([
      "omp plugin uninstall markdown --scope user",
      "omp plugin marketplace remove virajp-plugins",
    ]);
  });

  it("does not remove a marketplace it did not add", () => {
    mkdirSync(join(home, ".omp"), { recursive: true });
    writeFileSync(
      registryPath(),
      JSON.stringify({ marketplaces: [{ name: "virajp-plugins" }] }),
    );

    const { receipt } = ohmypi.apply(context, planFor(["markdown"]));
    ohmypi.revert(context, receipt);

    expect(existsSync(registryPath())).toBe(true);
  });

  it("fails loudly when the CLI does", () => {
    context = {
      ...context,
      exec: () => ({ status: 1, stdout: "", stderr: "boom" }),
    };

    expect(() => ohmypi.apply(context, planFor(["markdown"])))
      .toThrow(/failed \(1\): boom/);
  });
});
