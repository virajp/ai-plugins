import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
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
import type {
  Context,
  ExecResult,
  RunOptions,
} from "./context.ts";
import type { Receipt } from "./receipt.ts";
import { RECEIPT_VERSION } from "./receipt.ts";
import type { Item } from "./uninstall.ts";
import {
  enumerate,
  installedPlugins,
  parseSelection,
  removeItem,
  removeItems,
  renderItems,
} from "./uninstall.ts";

/**
 * Hermetic throughout: a temp `$HOME`, a temp `CLAUDE_CONFIG_DIR`, a temp repo,
 * a temp receipt directory, and a temp `PATH` holding fake tool binaries.
 *
 * `PATH` is real rather than stubbed because `hasBin` reads it directly, and the
 * absent-tool branch is one of the behaviours under test — a machine that no
 * longer has `omp` is exactly the machine most in need of an uninstall.
 */
let tmp: string;
let home: string;
let configDir: string;
let repo: string;
let receiptDir: string;
let binDir: string;
let ran: { command: string; args: readonly string[]; cwd?: string; }[];
let context: Context;
let options: RunOptions;
/** Overridden per test to make one command fail. */
let respond: (command: string, args: readonly string[]) => ExecResult;
let realPath: string | undefined;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ai-plugins-uninstall-"));
  home = join(tmp, "home");
  configDir = join(tmp, "claude-config");
  repo = join(tmp, "repo");
  // Under `<tmp>/ai-plugins/` so the receipt-directory cleanup, which only ever
  // removes a parent named `ai-plugins`, is actually exercised.
  receiptDir = join(tmp, "ai-plugins", "receipts");
  binDir = join(tmp, "bin");
  for (const dir of [home, configDir, repo, receiptDir, binDir]) {
    mkdirSync(dir, { recursive: true });
  }
  for (const bin of ["claude", "omp", "graphify"]) {
    writeFileSync(join(binDir, bin), "");
  }
  realPath = process.env["PATH"];
  process.env["PATH"] = binDir;
  process.env["CLAUDE_CONFIG_DIR"] = configDir;

  ran = [];
  respond = () => ({ status: 0, stdout: "", stderr: "" });
  context = {
    sourceRoot: join(import.meta.dirname, "..", ".."),
    home,
    cwd: repo,
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: (command, args, execOptions) => {
      ran.push({
        command,
        args,
        ...(execOptions?.cwd === undefined ? {} : { cwd: execOptions.cwd }),
      });
      return respond(command, args);
    },
  };
  options = { context, dryRun: false, receiptDir };
});
afterEach(() => {
  if (realPath === undefined) {
    delete process.env["PATH"];
  }
  else {
    process.env["PATH"] = realPath;
  }
  delete process.env["CLAUDE_CONFIG_DIR"];
  rmSync(tmp, { recursive: true, force: true });
});

/** Answer `git` the way a checkout would, and everything else with success. */
function insideRepo(): void {
  respond = (command, args) => {
    if (command !== "git") {
      return { status: 0, stdout: "", stderr: "" };
    }
    if (args[1] === "--show-toplevel") {
      return { status: 0, stdout: `${repo}\n`, stderr: "" };
    }
    if (args[1] === "--git-path") {
      return {
        status: 0,
        stdout: `${join(repo, ".git", "hooks")}\n`,
        stderr: "",
      };
    }
    return { status: 1, stdout: "", stderr: "" };
  };
}

function writeUserSettings(value: unknown): void {
  writeFileSync(
    join(configDir, "settings.json"),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

function writeProjectSettings(value: unknown): void {
  mkdirSync(join(repo, ".claude"), { recursive: true });
  writeFileSync(
    join(repo, ".claude", "settings.json"),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

function writeReceiptFile(name: string, receipt: Receipt): string {
  const path = join(receiptDir, name);
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
  return path;
}

function receipt(
  entries: Receipt["entries"],
  plugins?: Receipt["plugins"],
): Receipt {
  return {
    version: RECEIPT_VERSION,
    installedAt: "2026-01-01T00:00:00Z",
    entries,
    ...(plugins === undefined ? {} : { plugins }),
  };
}

const ids = (items: readonly Item[]) => items.map(i => i.id);

/**
 * What the run drove another tool to do.
 *
 * `git` is filtered out: the enumeration asks it where the repo is and where the
 * hooks live, and those reads are not what any of these assertions are about.
 */
const tools = () => ran.filter(r => r.command !== "git");

describe("installedPlugins", () => {
  it("takes only what came from our marketplace", () => {
    // A plugin the user installed from somewhere else has nothing to do with
    // this toolkit, and offering to remove it would be this tool reaching past
    // what it installed.
    expect(
      installedPlugins({
        enabledPlugins: {
          "vwf@virajp-plugins": true,
          "devtools@virajp-plugins": true,
          "something@someone-else": true,
        },
      }),
    )
      .toEqual(["devtools", "vwf"]);
  });

  it("reads an absent or oddly-shaped settings file as nothing", () => {
    expect(installedPlugins(undefined)).toEqual([]);
    expect(installedPlugins({})).toEqual([]);
    expect(installedPlugins({ enabledPlugins: "nonsense" })).toEqual([]);
  });
});

describe("enumerate", () => {
  it("finds the marketplace, the user plugins and the statusline", () => {
    writeUserSettings({
      extraKnownMarketplaces: { "virajp-plugins": { source: {} } },
      enabledPlugins: { "vwf@virajp-plugins": true },
    });
    writeReceiptFile("statusline.json", receipt([]));

    expect(ids(enumerate(options)))
      .toEqual(["marketplace", "plugin:user:vwf", "statusline"]);
  });

  it("finds nothing on a machine this tool never touched", () => {
    expect(enumerate(options)).toEqual([]);
  });

  it("does not offer the statusline without a receipt to restore from", () => {
    // The invariant the whole receipt system exists for: uninstall restores what
    // was there. With no record of the previous bar there is nothing to put back,
    // and a bare delete would leave the user with no statusline at all.
    writeUserSettings({ statusLine: { type: "command", command: "x" } });

    expect(ids(enumerate(options))).toEqual([]);
  });

  it("finds the repo-level pieces only when run inside a repo", () => {
    mkdirSync(join(repo, "graphify-out"), { recursive: true });
    writeFileSync(join(repo, ".graphifyignore"), "docs/memory/\n");
    writeProjectSettings({
      enabledPlugins: { "devtools@virajp-plugins": true },
    });
    mkdirSync(join(repo, ".git", "hooks"), { recursive: true });
    writeFileSync(
      join(repo, ".git", "hooks", "post-commit"),
      "graphify update .",
    );

    expect(ids(enumerate(options))).toEqual([]);

    insideRepo();
    expect(ids(enumerate(options))).toEqual([
      "plugin:project:devtools",
      "graphify-hook",
      "graph",
      "graphifyignore",
    ]);
  });

  it("does not claim a post-commit hook that is somebody else's", () => {
    insideRepo();
    mkdirSync(join(repo, ".git", "hooks"), { recursive: true });
    writeFileSync(join(repo, ".git", "hooks", "post-commit"), "make lint\n");

    expect(ids(enumerate(options))).not.toContain("graphify-hook");
  });

  it("lists every legacy receipt, naming the surface each one covers", () => {
    // The one piece of multi-target code deliberately kept: without it a machine
    // carrying an OpenCode bundle or an Oh-My-Pi bar is orphaned rather than
    // cleaned, because nothing else knows those paths.
    writeReceiptFile(
      "opencode.json",
      receipt([
        { kind: "tree", path: join(tmp, "opencode-bundle") },
      ], [{ name: "vwf", scope: "user" }]),
    );
    writeReceiptFile(
      "statusline-ohmypi.json",
      receipt([
        {
          kind: "command",
          ran: ["config", "set", "a", "b"],
          undo: ["config", "set", "a", ""],
        },
      ]),
    );

    const items = enumerate(options);

    expect(ids(items))
      .toEqual(["legacy:opencode.json", "legacy:statusline-ohmypi.json"]);
    expect(items[0]?.label).toContain("OpenCode plugin tree");
    // `Receipt.plugins` was written by every adapter and read by nothing for two
    // versions. This is its reader.
    expect(items[0]?.note).toContain("vwf");
    expect(items[1]?.label).toContain("Oh-My-Pi statusline");
  });

  it("skips an unreadable legacy receipt rather than offering an empty row", () => {
    writeFileSync(join(receiptDir, "opencode.json"), "{ not json");

    expect(enumerate(options)).toEqual([]);
  });

  it("groups user before repo before legacy, so the list reads top-down", () => {
    insideRepo();
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    writeFileSync(join(repo, ".graphifyignore"), "x\n");
    writeReceiptFile("opencode.json", receipt([]));

    expect(enumerate(options).map(i => i.level))
      .toEqual(["user", "repo", "legacy"]);
  });
});

describe("parseSelection", () => {
  it("reads an empty answer as remove everything", () => {
    // The list is presented with everything selected, so Enter is the answer to
    // the question actually asked.
    expect(parseSelection("", 3)).toEqual({ kind: "keep", keep: new Set() });
  });

  it("reads numbers as what STAYS", () => {
    expect(parseSelection("1, 3", 3))
      .toEqual({ kind: "keep", keep: new Set([1, 3]) });
  });

  it("accepts spaces as well as commas", () => {
    expect(parseSelection("2 3", 3))
      .toEqual({ kind: "keep", keep: new Set([2, 3]) });
  });

  it("takes q as a cancel", () => {
    expect(parseSelection("q", 3)).toEqual({ kind: "cancel" });
    expect(parseSelection("QUIT", 3)).toEqual({ kind: "cancel" });
    expect(parseSelection("cancel", 3)).toEqual({ kind: "cancel" });
  });

  it("refuses a token it cannot read rather than dropping it", () => {
    // Dropping a token the user meant as "keep this" would delete the one thing
    // they were protecting — the worst available failure for a destructive
    // command. Asking again costs a second.
    expect(parseSelection("1, banana", 3))
      .toEqual({ kind: "invalid", tokens: ["banana"] });
  });

  it("refuses a number outside the list", () => {
    expect(parseSelection("0", 3)).toEqual({ kind: "invalid", tokens: ["0"] });
    expect(parseSelection("4", 3)).toEqual({ kind: "invalid", tokens: ["4"] });
  });
});

describe("renderItems", () => {
  it("numbers across the whole list and heads each group once", () => {
    insideRepo();
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    writeFileSync(join(repo, ".graphifyignore"), "x\n");
    const text = renderItems(enumerate(options));

    expect(text).toContain("User");
    expect(text).toContain("This repo");
    expect(text).toContain(" 1  [x] plugin `vwf` (user scope)");
    expect(text).toContain(" 2  [x] ");
    expect(text.match(/User/g)).toHaveLength(1);
  });

  it("marks everything selected, since the interaction is deselection", () => {
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    const text = renderItems(enumerate(options));

    expect(text).not.toContain("[ ]");
  });
});

describe("removeItem", () => {
  it("removes a plugin through Claude's own CLI, at the right config dir", () => {
    // Never by editing `enabledPlugins`: Claude keeps bookkeeping beside that
    // key, and hand-editing it strands the two apart.
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    const [item] = enumerate(options);

    const outcome = removeItem(item as Item, options);

    expect(outcome.error).toBeUndefined();
    expect(tools()).toEqual([{
      command: "claude",
      args: ["plugin", "uninstall", "vwf", "--scope", "user"],
      cwd: repo,
    }]);
  });

  it("runs a project-scope uninstall from the working directory", () => {
    insideRepo();
    writeProjectSettings({
      enabledPlugins: { "devtools@virajp-plugins": true },
    });

    removeItem(enumerate(options)[0] as Item, options);

    expect(tools().at(-1)).toEqual({
      command: "claude",
      args: ["plugin", "uninstall", "devtools", "--scope", "project"],
      cwd: repo,
    });
  });

  it("scopes the marketplace removal to user, not to every scope", () => {
    // Without `--scope` this removes the declaration from *all* of them.
    writeUserSettings({
      extraKnownMarketplaces: { "virajp-plugins": { source: {} } },
    });

    removeItem(enumerate(options)[0] as Item, options);

    expect(tools()[0]?.args).toEqual([
      "plugin",
      "marketplace",
      "remove",
      "virajp-plugins",
      "--scope",
      "user",
    ]);
  });

  it("reports a tool that failed, with what it said", () => {
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    respond = () => ({ status: 1, stdout: "", stderr: "not installed" });

    expect(removeItem(enumerate(options)[0] as Item, options).error)
      .toContain("not installed");
  });

  it("skips rather than fails when the tool is gone", () => {
    // A machine without `claude` cannot be asked to unmake a `claude` install,
    // and there is nothing this tool could do instead. Failing would make an
    // otherwise clean uninstall exit non-zero over state nobody can reach.
    rmSync(join(binDir, "claude"));
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });

    const outcome = removeItem(enumerate(options)[0] as Item, options);

    expect(outcome.skipped).toBe("not-installed");
    expect(tools()).toEqual([]);
  });

  it("undoes the graphify hooks with graphify's own command", () => {
    insideRepo();
    mkdirSync(join(repo, ".git", "hooks"), { recursive: true });
    writeFileSync(
      join(repo, ".git", "hooks", "post-commit"),
      "graphify update .",
    );

    removeItem(enumerate(options)[0] as Item, options);

    expect(tools().at(-1)).toEqual({
      command: "graphify",
      args: ["hook", "uninstall"],
      cwd: repo,
    });
  });

  it("deletes the graph and the ignore file", () => {
    insideRepo();
    const graph = join(repo, "graphify-out");
    const ignore = join(repo, ".graphifyignore");
    mkdirSync(join(graph, "memory"), { recursive: true });
    writeFileSync(join(graph, "graph.json"), "{}");
    writeFileSync(ignore, "x\n");

    for (const item of enumerate(options)) {
      removeItem(item, options);
    }

    expect(existsSync(graph)).toBe(false);
    expect(existsSync(ignore)).toBe(false);
  });

  it("writes nothing under a dry run, but describes each removal", () => {
    insideRepo();
    const ignore = join(repo, ".graphifyignore");
    writeFileSync(ignore, "x\n");
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });

    const outcomes = removeItems(enumerate(options), {
      ...options,
      dryRun: true,
    });

    expect(existsSync(ignore)).toBe(true);
    expect(tools()).toEqual([]);
    expect(outcomes.flatMap(o => o.actions.map(a => a.summary))).toEqual([
      "claude plugin uninstall vwf --scope user",
      `remove ${ignore}`,
    ]);
  });
});

describe("the statusline, removed by restoring its receipt", () => {
  it("puts back the bar the user had, rather than deleting ours", () => {
    const settings = join(configDir, "settings.json");
    writeUserSettings({
      statusLine: {
        type: "command",
        command: "${HOME}/.claude/scripts/statusline",
      },
    });
    writeReceiptFile(
      "statusline.json",
      receipt([{
        kind: "configKey",
        file: settings,
        path: ["statusLine"],
        hadKey: true,
        previous: { type: "command", command: "~/bin/my-own-bar" },
      }]),
    );

    const outcome = removeItem(enumerate(options)[0] as Item, options);

    expect(outcome.error).toBeUndefined();
    const parsed = JSON.parse(readFileSync(settings, "utf8")) as {
      statusLine: { command: string; };
    };
    expect(parsed.statusLine.command).toBe("~/bin/my-own-bar");
  });

  it("consumes the receipt, so a second run does not offer it again", () => {
    const path = writeReceiptFile("statusline.json", receipt([]));

    removeItem(enumerate(options)[0] as Item, options);

    expect(existsSync(path)).toBe(false);
    expect(enumerate(options)).toEqual([]);
  });
});

describe("the legacy-receipt reader", () => {
  it("removes a copied OpenCode tree and restores the key naming it", () => {
    const bundle = join(tmp, "opencode", "virajp-plugins");
    const config = join(tmp, "opencode", "opencode.jsonc");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(bundle, "skill.md"), "x");
    // A sibling key the user owns, with their comment above it: the restore has
    // to leave both byte-identical. (A comment sitting directly above the
    // REMOVED key is swallowed by `jsonc-parser`'s minimal splice — pre-existing
    // behaviour, and the reason the comment sits here rather than there.)
    writeFileSync(
      config,
      "{\n  // The user's own comment.\n  \"theme\": \"dark\",\n"
        + "  \"skills\": { \"paths\": [\"x\"] }\n}\n",
    );
    writeReceiptFile(
      "opencode.json",
      receipt([
        {
          kind: "configKey",
          file: config,
          path: ["skills"],
          hadKey: false,
        },
        { kind: "tree", path: bundle },
      ]),
    );

    const outcome = removeItem(enumerate(options)[0] as Item, options);

    expect(outcome.error).toBeUndefined();
    expect(existsSync(bundle)).toBe(false);
    // JSONC, restored by the statusline's own hook — every config a retired
    // adapter touched is this format, so there is one implementation.
    expect(readFileSync(config, "utf8")).toContain("The user's own comment.");
    expect(readFileSync(config, "utf8")).toContain("\"theme\": \"dark\"");
    expect(readFileSync(config, "utf8")).not.toContain("skills");
  });

  it("runs an Oh-My-Pi undo through omp, which recorded no program name", () => {
    writeReceiptFile(
      "statusline-ohmypi.json",
      receipt([{
        kind: "command",
        ran: ["config", "set", "statusline.left", "ours"],
        undo: ["config", "set", "statusline.left", "theirs"],
      }]),
    );

    removeItem(enumerate(options)[0] as Item, options);

    expect(tools()).toEqual([{
      command: "omp",
      args: ["config", "set", "statusline.left", "theirs"],
    }]);
  });

  it("skips an Oh-My-Pi receipt when omp is gone", () => {
    rmSync(join(binDir, "omp"));
    const path = writeReceiptFile(
      "statusline-ohmypi.json",
      receipt([{
        kind: "command",
        ran: ["config", "set", "k", "v"],
        undo: ["config", "set", "k", ""],
      }]),
    );

    expect(removeItem(enumerate(options)[0] as Item, options).skipped)
      .toBe("not-installed");
    // Kept: there is still state to undo, and throwing the record away would
    // strand it.
    expect(existsSync(path)).toBe(true);
  });

  it("replays the Claude payload's files but NOT its plugin uninstalls", () => {
    // The user-level enumeration already owns the marketplace registration and
    // the plugin installs. Replaying them here too would run
    // `claude plugin uninstall` twice for one plugin and report the second,
    // failing, call as a broken uninstall.
    const payload = join(tmp, "share", "virajp", "ai-plugins", "claude");
    mkdirSync(payload, { recursive: true });
    writeFileSync(join(payload, "marketplace.json"), "{}");
    writeReceiptFile(
      "claude.json",
      receipt([
        { kind: "tree", path: payload },
        {
          kind: "command",
          ran: ["plugin", "install", "vwf@virajp-plugins", "--scope", "user"],
          undo: ["plugin", "uninstall", "vwf", "--scope", "user"],
        },
      ]),
    );

    removeItem(enumerate(options)[0] as Item, options);

    expect(existsSync(payload)).toBe(false);
    expect(tools()).toEqual([]);
  });

  it("keeps the receipt when the revert failed", () => {
    const path = writeReceiptFile(
      "opencode.json",
      // A directory where a file is claimed: `writeFileAtomic` cannot restore
      // over it, so the revert throws.
      receipt([{
        kind: "configKey",
        file: tmp,
        path: ["skills"],
        hadKey: true,
        previous: "x",
      }]),
    );

    expect(removeItem(enumerate(options)[0] as Item, options).error)
      .toBeDefined();
    expect(existsSync(path)).toBe(true);
  });
});

describe("removeItems", () => {
  it("keeps going when one item fails, and reports each separately", () => {
    // The pieces are independent — a plugin that will not uninstall says nothing
    // about the graph — and stopping halfway would leave a partly-cleaned machine
    // with no record of which half.
    insideRepo();
    writeUserSettings({ enabledPlugins: { "vwf@virajp-plugins": true } });
    const graph = join(repo, "graphify-out");
    mkdirSync(graph, { recursive: true });
    respond = (command, args) =>
      command === "claude"
        ? { status: 1, stdout: "", stderr: "boom" }
        : args[1] === "--show-toplevel"
        ? { status: 0, stdout: `${repo}\n`, stderr: "" }
        : { status: 1, stdout: "", stderr: "" };

    const outcomes = removeItems(enumerate(options), options);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.error).toContain("boom");
    expect(outcomes[1]?.error).toBeUndefined();
    expect(existsSync(graph)).toBe(false);
  });

  it("takes the receipt directory with it once the last one is consumed", () => {
    // No receipt can record the directory holding itself, so these were left
    // behind, empty, after every uninstall.
    writeReceiptFile("statusline.json", receipt([]));

    removeItems(enumerate(options), options);

    expect(existsSync(receiptDir)).toBe(false);
    expect(existsSync(dirname(receiptDir))).toBe(false);
  });

  it("keeps the receipt directory when a receipt was deliberately kept", () => {
    writeReceiptFile("statusline.json", receipt([]));
    const kept = writeReceiptFile("opencode.json", receipt([]));
    const items = enumerate(options);

    removeItems(items.filter(i => i.id === "statusline"), options);

    expect(existsSync(kept)).toBe(true);
    expect(existsSync(receiptDir)).toBe(true);
  });
});
