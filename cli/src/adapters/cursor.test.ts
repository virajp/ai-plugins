import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
import { readJsonc } from "../config/json.ts";
import { cursor } from "./cursor.ts";
import type {
  AdapterContext,
  AdapterPlan,
} from "./types.ts";

/**
 * Hermetic: writes only into a temp cwd. Unlike the OpenCode suite there is no
 * tree to copy — Cursor resolves plugins over git — so every assertion here is
 * about the reference this adapter writes into `.cursor/settings.json`.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let home: string;
let cwd: string;
let context: AdapterContext;
let logged: string[];

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-cur-home-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-cur-cwd-"));
  logged = [];
  context = {
    sourceRoot: repoRoot,
    home,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: message => {
      logged.push(message);
    },
    // Cursor installs by writing a reference; nothing here should shell out.
    exec: () => {
      throw new Error("the Cursor adapter must not run commands");
    },
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

const planFor = (project: string[], user: string[] = []): AdapterPlan => ({
  target: "cursor",
  user,
  project,
});

const settingsPath = () => join(cwd, ".cursor", "settings.json");
const settings = () =>
  readJsonc<any>(readFileSync(settingsPath(), "utf8")) as any;

describe("cursor adapter", () => {
  it("survives three consecutive installs", () => {
    // See the note in ohmypi.test.ts: the whole 3.0.x bug class only showed
    // up on a repeat run, which nothing in these suites exercised.
    for (const attempt of [1, 2, 3]) {
      expect(
        () => cursor.apply(context, planFor(["typescript"])),
        `attempt ${attempt}`,
      )
        .not
        .toThrow();
    }
  });

  it("registers a plugin as a git reference under its marketplace key", () => {
    cursor.apply(context, planFor(["typescript"]));

    const entry = settings().plugins["virajp-plugins/typescript"];
    expect(entry.enabled).toBe(true);
    // git-only: there is no local-path source in Cursor's union, so the install
    // points at the repo rather than at cursor/ sitting next to it.
    expect(entry.gitUrl).toMatch(/^https:\/\/github\.com\//);
    expect(entry.gitPath).toBe("cursor/typescript");
  });

  it("keys plugins as <marketplace>/<name>, which Cursor splits on the first slash", () => {
    cursor.apply(context, planFor(["vwf"]));

    const keys = Object.keys(settings().plugins);
    expect(keys).toContain("virajp-plugins/vwf");
    expect(keys.every(k => k.split("/").length === 2)).toBe(true);
  });

  it("redirects a user-scoped request to project scope, and says so", () => {
    cursor.apply(context, planFor([], ["typescript"]));

    expect(settings().plugins["virajp-plugins/typescript"].enabled).toBe(true);
    expect(logged.join("\n")).toMatch(/project scope/);
  });

  it("writes one entry for a plugin named at both scopes", () => {
    // Writing it twice would record a second receipt key whose "prior value" is
    // our own first write, so revert would restore the installed state.
    const { receipt } = cursor.apply(
      context,
      planFor(["typescript"], ["typescript"]),
    );

    expect(Object.keys(settings().plugins)).toHaveLength(1);
    const keys = receipt
      .entries
      .filter(e => e.kind === "configKey")
      .map(e => e.path.join("."));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("installs only the plugins named", () => {
    cursor.apply(context, planFor(["typescript"]));

    expect(Object.keys(settings().plugins)).toEqual([
      "virajp-plugins/typescript",
    ]);
  });

  it("preserves foreign keys and comments in existing settings", () => {
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    const original = `{
  // The user's own comment.
  "someSetting": true,
  "plugins": { "other/thing": { "enabled": true } }
}
`;
    writeFileSync(settingsPath(), original);

    cursor.apply(context, planFor(["typescript"]));

    const after = readFileSync(settingsPath(), "utf8");
    expect(after).toContain("// The user's own comment.");
    expect(settings().someSetting).toBe(true);
    expect(settings().plugins["other/thing"].enabled).toBe(true);
    expect(settings().plugins["virajp-plugins/typescript"].enabled).toBe(true);
  });

  it("writes nothing on a dry run", () => {
    const actions = cursor.plan(context, planFor(["typescript"]));

    expect(actions.length).toBeGreaterThan(0);
    expect(existsSync(settingsPath())).toBe(false);
  });

  it("restores existing settings byte-identically on revert", () => {
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    const original = `{
  // Keep me.
  "someSetting": true
}
`;
    writeFileSync(settingsPath(), original);

    const { receipt } = cursor.apply(context, planFor(["typescript"]));
    expect(readFileSync(settingsPath(), "utf8")).not.toBe(original);

    cursor.revert(context, receipt);

    // toBe, not a parsed comparison: a semantic check passes even when the
    // rewrite reflowed neighbouring objects or dropped the comment.
    expect(readFileSync(settingsPath(), "utf8")).toBe(original);
  });

  it("leaves no file or directory behind when it created them", () => {
    const { receipt } = cursor.apply(context, planFor(["typescript"]));
    expect(existsSync(settingsPath())).toBe(true);

    cursor.revert(context, receipt);

    expect(existsSync(settingsPath())).toBe(false);
    expect(existsSync(join(cwd, ".cursor"))).toBe(false);
  });

  it("is idempotent: installing twice leaves the settings unchanged", () => {
    cursor.apply(context, planFor(["typescript"]));
    const once = readFileSync(settingsPath(), "utf8");

    cursor.apply(context, planFor(["typescript"]));

    expect(readFileSync(settingsPath(), "utf8")).toBe(once);
  });

  // Idempotent on disk is not the same as idempotent in the receipt, and this
  // is where the two came apart: the second install found every key already
  // right, skipped both records, and returned an **empty** receipt — which then
  // overwrote the complete one. The uninstall after it reported success and
  // left the whole install in place. `--upgrade` reaches the same path, so
  // upgrading alone was enough to trigger it.
  it("removes what it created, even after a repeat install", () => {
    cursor.apply(context, planFor(["typescript"]));
    const { receipt } = cursor.apply(context, planFor(["typescript"]));

    cursor.revert(context, receipt);

    expect(existsSync(settingsPath())).toBe(false);
    expect(existsSync(join(cwd, ".cursor"))).toBe(false);
  });

  it("restores existing settings byte-identically after a repeat install", () => {
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    const original = `{
  // Keep me.
  "someSetting": true
}
`;
    writeFileSync(settingsPath(), original);

    cursor.apply(context, planFor(["typescript"]));
    const { receipt } = cursor.apply(context, planFor(["typescript"]));

    cursor.revert(context, receipt);

    // The worse half of the same bug: the file cannot simply be deleted, so a
    // dropped claim welded our key into the user's settings permanently.
    expect(readFileSync(settingsPath(), "utf8")).toBe(original);
  });

  it("keeps another marketplace's plugin key while removing its own", () => {
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    const original = `{
  "plugins": { "someone-else/thing": { "enabled": true } }
}
`;
    writeFileSync(settingsPath(), original);

    cursor.apply(context, planFor(["typescript"]));
    const { receipt } = cursor.apply(context, planFor(["typescript"]));

    cursor.revert(context, receipt);

    expect(readFileSync(settingsPath(), "utf8")).toBe(original);
  });

  it("refuses to edit malformed settings rather than clobbering them", () => {
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    writeFileSync(settingsPath(), "{ this is not json");

    expect(() => cursor.apply(context, planFor(["typescript"])))
      .toThrow(/malformed/);
  });

  it("fails loudly for a plugin missing from the rendered manifest", () => {
    // Cursor skips an entry with no usable source silently, so the check has to
    // happen here or a bad install looks like a successful one.
    expect(() => cursor.apply(context, planFor(["not-a-plugin"])))
      .toThrow(/plugins:build/);
  });
});
