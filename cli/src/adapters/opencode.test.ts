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
import { opencode } from "./opencode.ts";
import type {
  AdapterContext,
  AdapterPlan,
} from "./types.ts";

/**
 * Hermetic: a real install of the committed `opencode/` tree into a temp
 * `$HOME`. Nothing here touches the developer's own config.
 */
const repoRoot = join(import.meta.dirname, "..", "..", "..");

let home: string;
let cwd: string;
let context: AdapterContext;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-oc-home-"));
  cwd = mkdtempSync(join(tmpdir(), "ai-plugins-oc-cwd-"));
  context = {
    sourceRoot: repoRoot,
    home,
    cwd,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    // OpenCode installs by copying; nothing here should ever shell out.
    exec: () => {
      throw new Error("the OpenCode adapter must not run commands");
    },
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(cwd, { recursive: true, force: true });
});

const planFor = (user: string[]): AdapterPlan => ({
  target: "opencode",
  user,
  project: [],
});

const configPath = () => join(home, ".config", "opencode", "opencode.jsonc");
const bundle = (plugin: string) =>
  join(home, ".config", "opencode", "virajp-plugins", plugin);

describe("opencode adapter", () => {
  it("installs a plugin's bundle and registers its skills path", () => {
    opencode.apply(context, planFor(["markdown"]));

    expect(existsSync(join(bundle("markdown"), "skills"))).toBe(true);
    const config = readJsonc<any>(readFileSync(configPath(), "utf8"));
    expect(config.skills.paths).toContain("~/.config/opencode/virajp-plugins");
  });

  it("resolves the install-time root token to a real path", () => {
    opencode.apply(context, planFor(["vwf"]));

    const skill = readFileSync(
      join(bundle("vwf"), "skills", "execute", "SKILL.md"),
      "utf8",
    );
    // The build cannot know this path, so it emits a token the adapter fills.
    expect(skill).not.toContain("%%AI_PLUGINS_ROOT");
    expect(skill).toContain(bundle("vwf"));
  });

  it("merges the plugin's mcp/lsp fragment into the user's config", () => {
    opencode.apply(context, planFor(["typescript"]));

    const config = readJsonc<any>(readFileSync(configPath(), "utf8"));
    // Written under OpenCode's own built-in id, not the plugin's.
    expect(config.lsp.typescript.command).toContain("mise");
  });

  it("installs only the flat files owned by the selected plugins", () => {
    // Agents are global and their filenames carry no plugin prefix, so
    // selection has to come from the ownership manifest.
    opencode.apply(context, planFor(["markdown"]));
    const agentDir = join(home, ".config", "opencode", "agent");
    expect(existsSync(join(agentDir, "execute-coder.md"))).toBe(false);

    opencode.apply(context, planFor(["vwf"]));
    expect(existsSync(join(agentDir, "execute-coder.md"))).toBe(true);
  });

  it("keeps agent filenames bare, so delegation still resolves", () => {
    opencode.apply(context, planFor(["vwf"]));
    const agentDir = join(home, ".config", "opencode", "agent");
    // `vwf-execute-coder.md` would rename the agent and break every reference.
    expect(existsSync(join(agentDir, "execute-coder.md"))).toBe(true);
    expect(existsSync(join(agentDir, "vwf-execute-coder.md"))).toBe(false);
  });

  it("preserves foreign keys and comments in an existing config", () => {
    mkdirSync(join(home, ".config", "opencode"), { recursive: true });
    const original = `{
  // The user's own comment.
  "theme": "tokyonight",
  "skills": { "paths": ["~/my-own-skills"] }
}
`;
    writeFileSync(configPath(), original);

    opencode.apply(context, planFor(["markdown"]));

    const after = readFileSync(configPath(), "utf8");
    expect(after).toContain("// The user's own comment.");
    const config = readJsonc<any>(after);
    expect(config.theme).toBe("tokyonight");
    expect(config.skills.paths).toContain("~/my-own-skills");
    expect(config.skills.paths).toContain("~/.config/opencode/virajp-plugins");
  });

  it("writes nothing on a dry run", () => {
    const actions = opencode.plan(context, planFor(["markdown"]));
    expect(actions.length).toBeGreaterThan(0);
    expect(existsSync(bundle("markdown"))).toBe(false);
    expect(existsSync(configPath())).toBe(false);
  });

  it("restores an existing config byte-identically on revert", () => {
    mkdirSync(join(home, ".config", "opencode"), { recursive: true });
    const original = `{
  // Keep me.
  "theme": "tokyonight"
}
`;
    writeFileSync(configPath(), original);

    const { receipt } = opencode.apply(context, planFor(["markdown"]));
    expect(readFileSync(configPath(), "utf8")).not.toBe(original);

    opencode.revert(context, receipt);

    expect(readFileSync(configPath(), "utf8")).toBe(original);
    expect(existsSync(bundle("markdown"))).toBe(false);
  });

  it("is idempotent: installing twice leaves the config unchanged", () => {
    opencode.apply(context, planFor(["markdown"]));
    const once = readFileSync(configPath(), "utf8");
    opencode.apply(context, planFor(["markdown"]));
    expect(readFileSync(configPath(), "utf8")).toBe(once);
  });

  it("refuses to edit a malformed config rather than clobbering it", () => {
    mkdirSync(join(home, ".config", "opencode"), { recursive: true });
    writeFileSync(configPath(), "{ this is not json");
    expect(() => opencode.apply(context, planFor(["markdown"])))
      .toThrow(/malformed/);
  });

  it("installs at project scope into .opencode/", () => {
    opencode.apply(context, {
      target: "opencode",
      user: [],
      project: ["markdown"],
    });

    expect(existsSync(join(cwd, ".opencode", "virajp-plugins", "markdown")))
      .toBe(true);
    const config = readJsonc<any>(
      readFileSync(join(cwd, ".opencode", "opencode.jsonc"), "utf8"),
    );
    // Project-relative, not `~/…`.
    expect(config.skills.paths).toContain(".opencode/virajp-plugins");
  });
});
