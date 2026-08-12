import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  dirname,
  join,
} from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { claude } from "./claude.ts";
import type {
  AdapterContext,
  AdapterPlan,
  Exec,
} from "./types.ts";

/**
 * `exec` is injected, so these never drive the real `claude` — which matters
 * more here than anywhere else, since the developer running them is inside
 * Claude Code and a stray write would land in their live config.
 *
 * The fake maintains the same `settings.json` files the CLI writes, because
 * every "already registered / already installed" guard reads them back.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let configDir: string;
let cwd: string;
let context: AdapterContext;
let ran: string[][];
let logged: string[];
let savedXdgData: string | undefined;

/**
 * Where the payload lands, derived the same way the adapter derives it.
 *
 * `home` is the throwaway config dir, so this stays inside it — provided
 * `XDG_DATA_HOME` is cleared, which `beforeEach` does. A developer with that
 * variable exported would otherwise have these tests write into their real
 * data directory.
 */
const marketplaceRoot = () =>
  join(configDir, ".local", "share", "virajp", "ai-plugins", "claude");

const userSettings = () => join(configDir, "settings.json");
const projectSettings = () => join(cwd, ".claude", "settings.json");

function read(path: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, any>;
  }
  catch {
    return {};
  }
}

function write(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/** Mimics `claude plugin …`, maintaining the settings files the real CLI writes. */
const fakeClaude: Exec = (command, args) => {
  ran.push([command, ...args]);
  const [, action, ...rest] = args;

  if (action === "marketplace" && rest[0] === "add") {
    const settings = read(userSettings());
    settings["extraKnownMarketplaces"] = {
      ...settings["extraKnownMarketplaces"],
      "virajp-plugins": { source: { source: "directory", path: rest[1] } },
    };
    write(userSettings(), settings);
  }
  else if (action === "marketplace" && rest[0] === "remove") {
    const settings = read(userSettings());
    delete settings["extraKnownMarketplaces"];
    write(userSettings(), settings);
  }
  else if (action === "install" || action === "uninstall") {
    const scope = args.at(-1);
    const path = scope === "project" ? projectSettings() : userSettings();
    const settings = read(path);
    const enabled = { ...settings["enabledPlugins"] } as Record<string, true>;
    if (action === "install") {
      enabled[rest[0] as string] = true;
    }
    else {
      for (const key of Object.keys(enabled)) {
        if (key.split("@")[0] === rest[0]) {
          delete enabled[key];
        }
      }
    }
    settings["enabledPlugins"] = enabled;
    write(path, settings);
  }
  return { status: 0, stdout: "", stderr: "" };
};

beforeEach(() => {
  configDir = mkdtempSync(join(tmpdir(), "ai-plugins-cc-cfg-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-cc-cwd-"));
  ran = [];
  logged = [];
  process.env["CLAUDE_CONFIG_DIR"] = configDir;
  // Cleared, not set: `dataDir` prefers it over `home`, so a developer with it
  // exported would have the payload copied into their real data directory.
  savedXdgData = process.env["XDG_DATA_HOME"];
  delete process.env["XDG_DATA_HOME"];
  context = {
    sourceRoot: repoRoot,
    home: configDir,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: message => {
      logged.push(message);
    },
    exec: fakeClaude,
  };
});
afterEach(() => {
  delete process.env["CLAUDE_CONFIG_DIR"];
  if (savedXdgData === undefined) {
    delete process.env["XDG_DATA_HOME"];
  }
  else {
    process.env["XDG_DATA_HOME"] = savedXdgData;
  }
  rmSync(configDir, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

const planFor = (user: string[], project: string[] = []): AdapterPlan => ({
  target: "claude",
  user,
  project,
});

describe("claude adapter", () => {
  it("survives three consecutive installs", () => {
    // Every bug in 3.0.1 and 3.0.2 appeared only on the SECOND run, and
    // nothing here ran anything twice. Three, because two proves
    // repeatability and three proves it is not an alternating state machine.
    for (const attempt of [1, 2, 3]) {
      expect(
        () => claude.apply(context, planFor(["markdown"], ["mise"])),
        `attempt ${attempt}`,
      )
        .not
        .toThrow();
    }
  });

  it("copies the payload somewhere that outlives the pnpm store", () => {
    // The whole point: `pnpx` is `pnpm dlx`, so sourceRoot is a temporary
    // store path that `pnpm store prune` reclaims. Registering it left Claude
    // pointed at a directory with a shorter life than the install.
    claude.apply(context, planFor(["markdown"]));

    const manifest = join(
      marketplaceRoot(),
      ".claude-plugin",
      "marketplace.json",
    );
    expect(existsSync(manifest)).toBe(true);
    // Byte-identical: the layout is preserved precisely so the manifest never
    // has to be rewritten at install time.
    expect(readFileSync(manifest, "utf8")).toBe(
      readFileSync(
        join(repoRoot, ".claude-plugin", "marketplace.json"),
        "utf8",
      ),
    );
    // `./claude/plugins/<name>` resolves against the marketplace root, which is
    // why the doubled `claude` below is the contract rather than an accident.
    expect(existsSync(join(marketplaceRoot(), "claude", "plugins", "vwf")))
      .toBe(true);
    expect(read(userSettings())["extraKnownMarketplaces"]["virajp-plugins"])
      .toEqual({ source: { source: "directory", path: marketplaceRoot() } });
  });

  it("preserves the executable bit on hook scripts", () => {
    // The regression guard for using `cpSync` over `copyTree`. `copyTree`
    // writes anything matching its TEXT regex — which includes `sh` — through
    // `writeFileAtomic`, losing the source mode. OpenCode ships its mempalace
    // hooks at 644 for exactly this reason, and Claude runs its hooks
    // directly, so a non-executable one is a hook that does not fire.
    claude.apply(context, planFor(["vwf"]));

    const hook = join(
      marketplaceRoot(),
      "claude",
      "plugins",
      "vwf",
      "hooks",
      "mempalace-checkpoint.sh",
    );
    expect(existsSync(hook)).toBe(true);
    expect(statSync(hook).mode & 0o111).not.toBe(0);
  });

  it("drops content that no longer exists upstream", () => {
    claude.apply(context, planFor(["markdown"]));
    const stray = join(marketplaceRoot(), "claude", "plugins", "gone-away");
    mkdirSync(stray, { recursive: true });
    writeFileSync(join(stray, "SKILL.md"), "retired");

    claude.apply(context, planFor(["markdown"]));

    // Cleared before copying, the same rule `plugins:build` follows: a stale
    // file nobody rendered is indistinguishable from a current one.
    expect(existsSync(stray)).toBe(false);
  });

  it("fully uninstalls after a repeat install, not just the payload", () => {
    // The receipt is rewritten every run, so what a *no-op* run records is
    // what an uninstall gets. Undos used to be recorded only when a command
    // changed something, while the payload was recorded unconditionally — so
    // a second install produced a receipt naming only the tree, and uninstall
    // deleted the payload while leaving the plugin enabled against a
    // marketplace whose directory had just been removed. Worse than the
    // no-op it replaced.
    claude.apply(context, planFor(["markdown"]));
    const { receipt } = claude.apply(context, planFor(["markdown"]));

    claude.revert(context, receipt);

    expect(existsSync(marketplaceRoot())).toBe(false);
    expect(read(userSettings())["enabledPlugins"]).toEqual({});
    expect(read(userSettings())["extraKnownMarketplaces"]).toBeUndefined();
  });

  it("records the undos without re-running the commands", () => {
    // The other half: recording an undo for state already in place must not
    // turn a no-op run back into a re-install. `ran` stays empty; only the
    // receipt grows.
    claude.apply(context, planFor(["markdown"]));
    ran = [];

    const { receipt } = claude.apply(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
    expect(receipt.entries.map(e => e.kind)).toEqual([
      // The two `dir` entries are the payload's parent directories, claimed so
      // they do not survive the uninstall as empties.
      "dir",
      "dir",
      "tree",
      "command",
      "command",
    ]);
  });

  it("takes its own parent directories with it on revert", () => {
    // `cpSync` creates `<data>/virajp/` and `<data>/virajp/ai-plugins/`, and
    // nothing recorded them — so every uninstall left two empty directories
    // behind. Claimed with `ownedDir`, which removes only when empty.
    const { receipt } = claude.apply(context, planFor(["markdown"]));
    const parent = dirname(marketplaceRoot());

    claude.revert(context, receipt);

    expect(existsSync(marketplaceRoot())).toBe(false);
    expect(existsSync(parent)).toBe(false);
    expect(existsSync(dirname(parent))).toBe(false);
  });

  it("declares the marketplace, then installs each plugin", () => {
    claude.apply(context, planFor(["markdown"]));

    expect(ran.map(c => c.join(" "))).toEqual([
      `claude plugin marketplace add ${marketplaceRoot()}`,
      "claude plugin install markdown@virajp-plugins --scope user",
    ]);
  });

  it("passes an absolute source, which the CLI requires", () => {
    // A bare `.` is rejected outright: "Invalid marketplace source format".
    claude.apply(context, planFor(["markdown"]));

    const add = ran.find(c => c.includes("marketplace"));
    expect(add?.at(-1)).toBe(marketplaceRoot());
    expect(add?.at(-1)?.startsWith("/")).toBe(true);
  });

  it("does not expand dependencies — the CLI installs its own", () => {
    // `claude plugin install vwf` reports "+ 4 dependencies". Naming them here
    // would record undos for plugins Claude manages.
    claude.apply(context, planFor(["vwf"]));

    const installs = ran.filter(c => c.includes("install"));
    expect(installs).toHaveLength(1);
    expect(installs[0]?.[3]).toBe("vwf@virajp-plugins");
  });

  // Claude caches plugin content per version and keeps serving the cached one,
  // so copying a newer payload over the marketplace directory is not an
  // upgrade. Re-running the installer is this tool's documented upgrade path
  // (there is no `--upgrade`), and before this it delivered nothing at all to
  // anyone who already had the plugin enabled: `plugin install` answers
  // "already installed" and the old version stays live.
  const seedInstalled = (selector: string, version: string, scope = "user") => {
    write(join(configDir, "plugins", "installed_plugins.json"), {
      version: 2,
      plugins: { [selector]: [{ scope, version, installPath: "/x" }] },
    });
  };

  it("updates a plugin whose installed version is behind the marketplace", () => {
    claude.apply(context, planFor(["vwf"]));
    ran = [];
    // The manifest in this repo advertises a version; pretend Claude still has
    // an older one cached, which is exactly the in-place-upgrade shape.
    seedInstalled("vwf@virajp-plugins", "0.0.1");

    claude.apply(context, planFor(["vwf"]));

    const updates = ran.filter(c => c[1] === "plugin" && c[2] === "update");
    expect(updates).toHaveLength(1);
    // The SELECTOR, not the bare name. `plugin update` spells its argument the
    // way `install` does, not the way `uninstall` does; the bare name fails
    // with `Plugin "vwf" not found`, and because the payload copy runs first
    // and the throw escapes before the receipt is written, that failure
    // stranded the install with nothing to uninstall from. The fake accepts
    // any argument, so only this assertion holds the form.
    expect(updates[0]).toEqual([
      "claude",
      "plugin",
      "update",
      "vwf@virajp-plugins",
      "--scope",
      "user",
    ]);
  });

  it("keeps going, with a note, when the update itself fails", () => {
    claude.apply(context, planFor(["vwf"]));
    seedInstalled("vwf@virajp-plugins", "0.0.1");
    const failing: Exec = (command, args) => {
      if (args[1] === "update") {
        ran.push([command, ...args]);
        return { status: 1, stdout: "", stderr: "Plugin not found" };
      }
      return fakeClaude(command, args, {} as never);
    };

    // A failed version bump must not fail the target. The payload copy has
    // already succeeded and a throw escapes before the receipt is written,
    // which left the install on disk with nothing to uninstall from.
    const { receipt } = claude.apply(
      { ...context, exec: failing },
      planFor(["vwf"]),
    );

    expect(receipt.entries.length).toBeGreaterThan(0);
    expect(logged.some(m => m.includes("plugin update` failed"))).toBe(true);
  });

  it("does not update when the installed version already matches", () => {
    claude.apply(context, planFor(["vwf"]));
    const manifest = JSON.parse(
      readFileSync(
        join(repoRoot, ".claude-plugin", "marketplace.json"),
        "utf8",
      ),
    ) as { plugins: { name: string; version: string; }[]; };
    const current = manifest.plugins.find(p => p.name === "vwf")?.version;
    expect(current).toBeDefined();
    seedInstalled("vwf@virajp-plugins", current as string);
    ran = [];

    claude.apply(context, planFor(["vwf"]));

    // A no-change re-run must stay a no-op rather than churning the cache.
    expect(ran.filter(c => c.includes("update"))).toHaveLength(0);
  });

  it("does not update when Claude's bookkeeping is unreadable", () => {
    claude.apply(context, planFor(["vwf"]));
    write(join(configDir, "plugins", "installed_plugins.json"), {});
    writeFileSync(
      join(configDir, "plugins", "installed_plugins.json"),
      "{ not json",
    );
    ran = [];

    claude.apply(context, planFor(["vwf"]));

    // Unreadable means "cannot tell", never "out of date" — guessing here
    // would reinstall on every run against a file that is Claude's, not ours.
    expect(ran.filter(c => c.includes("update"))).toHaveLength(0);
  });

  it("installs each scope against its own settings file", () => {
    claude.apply(context, planFor(["markdown"], ["mise"]));

    expect(read(userSettings())["enabledPlugins"]).toHaveProperty(
      "markdown@virajp-plugins",
    );
    expect(read(projectSettings())["enabledPlugins"]).toHaveProperty(
      "mise@virajp-plugins",
    );
  });

  it("declares the marketplace at user scope even for a project install", () => {
    claude.apply(context, planFor([], ["mise"]));

    expect(read(userSettings())["extraKnownMarketplaces"]).toHaveProperty(
      "virajp-plugins",
    );
  });

  it("does not re-declare a marketplace already pointing here", () => {
    claude.apply(context, planFor(["markdown"]));
    ran = [];

    claude.apply(context, planFor(["mise"]));

    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
  });

  it("warns rather than repointing a marketplace of the same name", () => {
    // The real collision: `virajp-plugins` is normally installed from GitHub,
    // so silently continuing would install from the published copy instead.
    write(userSettings(), {
      extraKnownMarketplaces: {
        "virajp-plugins": {
          source: { source: "github", path: "/somewhere/else" },
        },
      },
    });

    claude.apply(context, planFor(["markdown"]));

    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
    expect(logged.join("\n")).toMatch(/already points at/);
  });

  it("re-points a pin left by an older install of this package", () => {
    // `pnpx` resolves to a version-specific store path, so every upgrade moves
    // sourceRoot. Declining to re-point meant a marketplace added by 3.0.0
    // kept serving 3.0.0's rendered trees forever, while `--upgrade` reported
    // "already up to date" — the upgrade silently did nothing.
    // A real package-shaped root: the guard reads the marketplace name out of
    // it, and the path has to look like a node_modules install for the pin to
    // count as this CLI's own rather than the user's.
    const store = mkdtempSync(join(tmpdir(), "ai-plugins-store-"));
    const newer = join(store, "node_modules", "@askviraj", "ai-plugins");
    mkdirSync(join(newer, ".claude-plugin"), { recursive: true });
    // The payload copy needs both halves present, since their relative
    // positions are what the manifest's `./claude/plugins/…` sources rely on.
    mkdirSync(join(newer, "claude", "plugins"), { recursive: true });
    write(
      join(newer, ".claude-plugin", "marketplace.json"),
      { name: "virajp-plugins", plugins: [] },
    );
    const older = newer.replace("ai-plugins-store-", "ai-plugins-store-old-");
    write(userSettings(), {
      extraKnownMarketplaces: {
        "virajp-plugins": { source: { source: "directory", path: older } },
      },
    });

    claude.apply({ ...context, sourceRoot: newer }, planFor(["markdown"]));

    const marketplace = ran.filter(c => c.includes("marketplace"));
    // Remove then add, in that order — `claude` has no re-point command.
    expect(marketplace[0]?.includes("remove")).toBe(true);
    expect(marketplace[1]?.includes("add")).toBe(true);
    // The managed directory, NOT the store path it was read from. This is the
    // migration: without it every existing user keeps a pin that their next
    // `pnpm store prune` deletes.
    expect(marketplace[1]?.at(-1)).toBe(marketplaceRoot());
    expect(logged.join("\n")).toMatch(/re-pointed/);
  });

  it("leaves a pin that is not an install of this package alone", () => {
    // A git clone, or anywhere else the user pointed it deliberately. Only a
    // path inside a node_modules copy of this package, or inside the managed
    // data directory, counts as ours to move.
    write(userSettings(), {
      extraKnownMarketplaces: {
        "virajp-plugins": {
          source: { source: "directory", path: "/home/me/src/ai-plugins" },
        },
      },
    });

    claude.apply(context, planFor(["markdown"]));

    expect(ran.some(c => c.includes("marketplace"))).toBe(false);
    expect(logged.join("\n")).toMatch(/already points at/);
  });

  it("skips a plugin that is already installed", () => {
    claude.apply(context, planFor(["markdown"]));
    ran = [];

    claude.apply(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
  });

  it("runs nothing on a dry run, but describes every command", () => {
    const actions = claude.plan(context, planFor(["markdown"]));

    expect(ran).toEqual([]);
    expect(actions.map(a => a.summary)).toEqual([
      `copy the marketplace payload to ${marketplaceRoot()}`,
      `claude plugin marketplace add ${marketplaceRoot()}`,
      "claude plugin install markdown@virajp-plugins --scope user",
    ]);
    // One line for 527 files. Recording them individually would bury the two
    // commands that actually change Claude's state.
    expect(actions).toHaveLength(3);
    expect(existsSync(marketplaceRoot())).toBe(false);
  });

  it("reverts by running the CLI's own removals, in reverse", () => {
    const { receipt } = claude.apply(context, planFor(["markdown"]));
    ran = [];

    claude.revert(context, receipt);

    expect(ran.map(c => c.join(" "))).toEqual([
      "claude plugin uninstall markdown --scope user",
      // Scoped deliberately: without --scope this removes the declaration from
      // every scope, including ones we never touched.
      "claude plugin marketplace remove virajp-plugins --scope user",
    ]);
    expect(read(userSettings())["enabledPlugins"]).toEqual({});
  });

  it("does not remove a marketplace it did not declare", () => {
    write(userSettings(), {
      extraKnownMarketplaces: {
        "virajp-plugins": { source: { source: "directory", path: repoRoot } },
      },
    });

    const { receipt } = claude.apply(context, planFor(["markdown"]));
    claude.revert(context, receipt);

    expect(read(userSettings())["extraKnownMarketplaces"]).toHaveProperty(
      "virajp-plugins",
    );
  });

  it("fails loudly when the CLI does", () => {
    context = {
      ...context,
      exec: () => ({ status: 1, stdout: "", stderr: "boom" }),
    };

    expect(() => claude.apply(context, planFor(["markdown"])))
      .toThrow(/failed \(1\): boom/);
  });
});
