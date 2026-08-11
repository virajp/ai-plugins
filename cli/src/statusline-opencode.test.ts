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
import type { AdapterContext } from "./adapters/types.ts";
import { readJsonc } from "./config/json.ts";
import { executeStatuslineOpencode } from "./executor.ts";
import {
  installStatuslineOpencode,
  planStatuslineOpencode,
  revertStatuslineOpencode,
} from "./statusline-opencode.ts";

/**
 * Hermetic: a real install of the bundled `.tsx` into a temp `$HOME`. Nothing
 * here touches the developer's own `~/.config/opencode`.
 */
const repoRoot = join(import.meta.dirname, "..", "..");

let home: string;
let context: AdapterContext;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ai-plugins-oc-sl-"));
  context = {
    sourceRoot: repoRoot,
    home,
    cwd: home,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    // Everything here is a file copy and a config edit.
    exec: () => {
      throw new Error("the OpenCode statusline must not run commands");
    },
  };
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

const configDir = () => join(home, ".config", "opencode");
const pluginFile = () => join(configDir(), "ai-plugins-statusline.tsx");
const tuiConfig = () => join(configDir(), "tui.json");

describe("the OpenCode statusline", () => {
  it("copies the plugin in and registers it in tui.json", () => {
    installStatuslineOpencode(context);

    expect(existsSync(pluginFile())).toBe(true);
    // Ships as authored TSX: OpenCode's loader is Bun, so nothing transpiles it.
    expect(readFileSync(pluginFile(), "utf8"))
      .toContain("@jsxImportSource @opentui/solid");

    const config = readJsonc<any>(readFileSync(tuiConfig(), "utf8"));
    expect(config.plugin).toEqual(["./ai-plugins-statusline.tsx"]);
  });

  // Written as `\u{…}` escapes in the plugin, and this is why: the Nerd Font
  // glyphs are private-use codepoints that render as a box everywhere except a
  // patched terminal, so one lost in a copy-paste is indistinguishable from the
  // empty string — a segment that silently draws a stray leading space and no
  // icon. Nothing else would catch it. (It happened once, before this existed.)
  it("carries the Claude bar's symbols, escaped and in sync", () => {
    const source = readFileSync(
      join(repoRoot, "tools", "statusline", "opencode-tui.tsx"),
      "utf8",
    );
    const symbols = JSON
      .parse(
        readFileSync(
          join(repoRoot, "tools", "statusline", "statusline.json"),
          "utf8",
        ),
      )
      .symbols as Record<string, string>;

    for (
      const name of [
        "model",
        "context",
        "cost",
        "duration",
        "session",
        "project",
        "folder",
        "branch",
      ]
    ) {
      const point = symbols[name]?.codePointAt(0);
      expect(point, `statusline.json has no \`${name}\` symbol`)
        .toBeDefined();
      expect(source, `\`${name}\` drifted from statusline.json`)
        .toContain(`"\\u{${point?.toString(16)}}"`);
    }
  });

  it("registers in tui.json, never in opencode.json", () => {
    // The two are different files and OpenCode routes by plugin kind. An entry
    // in `opencode.json` would be accepted and never loaded.
    installStatuslineOpencode(context);

    expect(existsSync(join(configDir(), "opencode.json"))).toBe(false);
    expect(existsSync(join(configDir(), "opencode.jsonc"))).toBe(false);
  });

  it("is idempotent: installing twice does not append the path twice", () => {
    installStatuslineOpencode(context);
    const once = readFileSync(tuiConfig(), "utf8");

    installStatuslineOpencode(context);

    expect(readFileSync(tuiConfig(), "utf8")).toBe(once);
    const config = readJsonc<any>(once);
    expect(config.plugin).toHaveLength(1);
  });

  it("preserves foreign keys, comments and other plugins", () => {
    mkdirSync(configDir(), { recursive: true });
    const original = `{
  // The user's own comment.
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./mine.tsx"],
  "theme": "tokyonight"
}
`;
    writeFileSync(tuiConfig(), original);

    installStatuslineOpencode(context);

    const after = readFileSync(tuiConfig(), "utf8");
    expect(after).toContain("// The user's own comment.");
    const config = readJsonc<any>(after);
    expect(config.theme).toBe("tokyonight");
    expect(config.plugin).toEqual([
      "./mine.tsx",
      "./ai-plugins-statusline.tsx",
    ]);
  });

  it("restores a pre-existing tui.json byte-identically on revert", () => {
    mkdirSync(configDir(), { recursive: true });
    const original = `{
  // Keep me.
  "plugin": ["./mine.tsx"]
}
`;
    writeFileSync(tuiConfig(), original);

    const { receipt } = installStatuslineOpencode(context);
    expect(readFileSync(tuiConfig(), "utf8")).not.toBe(original);

    revertStatuslineOpencode(receipt);

    expect(readFileSync(tuiConfig(), "utf8")).toBe(original);
    expect(existsSync(pluginFile())).toBe(false);
  });

  it("deletes a tui.json it created, rather than leaving an empty one", () => {
    const { receipt } = installStatuslineOpencode(context);
    expect(existsSync(tuiConfig())).toBe(true);

    revertStatuslineOpencode(receipt);

    expect(existsSync(tuiConfig())).toBe(false);
    expect(existsSync(pluginFile())).toBe(false);
  });

  it("removes only its own key from a config that had no plugin list", () => {
    // The shallowest-new rule: `plugin` did not exist, so the key is ours and
    // undoing it must not leave an orphaned `"plugin": []` behind.
    mkdirSync(configDir(), { recursive: true });
    const original = `{
  "theme": "tokyonight"
}
`;
    writeFileSync(tuiConfig(), original);

    const { receipt } = installStatuslineOpencode(context);
    revertStatuslineOpencode(receipt);

    expect(readFileSync(tuiConfig(), "utf8")).toBe(original);
  });

  it("uninstalls cleanly after a second install", () => {
    // `createdFile`: the plugin path is ours outright, so the second install
    // must not capture the first one's output as prior state and restore it.
    //
    // The config is the other half of the same claim, and the half that used to
    // go missing: run 2 found run 1's `tui.json` already registered, returned
    // early and recorded nothing, so the receipt it overwrote lost the file and
    // the uninstall left it behind — still pointing at the plugin just removed.
    installStatuslineOpencode(context);
    const { receipt } = installStatuslineOpencode(context);

    revertStatuslineOpencode(receipt);

    expect(existsSync(pluginFile())).toBe(false);
    expect(existsSync(tuiConfig())).toBe(false);
  });

  // The other half of the ownership rule: a `tui.json` with anything of the
  // user's in it is never deleted, however many times they install.
  it("never deletes a tui.json holding entries of its own", () => {
    mkdirSync(configDir(), { recursive: true });
    const original = `{
  // Chosen by hand.
  "theme": "tokyonight",
  "plugin": ["./their-own-plugin.ts"]
}
`;
    writeFileSync(tuiConfig(), original);

    installStatuslineOpencode(context);
    const { receipt } = installStatuslineOpencode(context);

    revertStatuslineOpencode(receipt);

    expect(existsSync(tuiConfig())).toBe(true);
    expect(readFileSync(tuiConfig(), "utf8")).toContain(
      "./their-own-plugin.ts",
    );
    expect(readFileSync(tuiConfig(), "utf8")).toContain("// Chosen by hand.");
  });

  it("refuses to edit a malformed config rather than clobbering it", () => {
    mkdirSync(configDir(), { recursive: true });
    writeFileSync(tuiConfig(), "{ this is not json");

    expect(() => installStatuslineOpencode(context)).toThrow(/malformed/);
  });

  it("writes nothing on a dry run", () => {
    const actions = planStatuslineOpencode(context);

    expect(actions.length).toBeGreaterThan(0);
    expect(existsSync(pluginFile())).toBe(false);
    expect(existsSync(tuiConfig())).toBe(false);
  });

  // The `opencode`-on-PATH gate lives in the executor, beside the identical one
  // for `omp`: config written for a tool that is not on the machine is config
  // nothing will ever read.
  describe("when opencode is not installed", () => {
    const realPath = process.env["PATH"];
    afterEach(() => {
      process.env["PATH"] = realPath;
    });

    it("skips with a note rather than failing", () => {
      process.env["PATH"] = join(home, "empty-bin");
      const outcome = executeStatuslineOpencode({
        context,
        dryRun: false,
        receiptDir: join(home, "receipts"),
      });

      expect(outcome.skipped).toBe("not-installed");
      expect(outcome.error).toBeUndefined();
      expect(existsSync(tuiConfig())).toBe(false);
    });
  });
});
