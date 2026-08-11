import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import {
  homedir,
  tmpdir,
} from "node:os";
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
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
import { planPlugins } from "./adapters/types.ts";
import {
  execute,
  failed,
  planFromReceipt,
  receiptPath,
  renderDiff,
  renderProgress,
  revert,
  upgradeJobs,
} from "./executor.ts";
import {
  readReceipt,
  ReceiptBuilder,
} from "./receipt.ts";

let receiptDir: string;
let context: AdapterContext;

beforeEach(() => {
  receiptDir = mkdtempSync(join(tmpdir(), "ai-plugins-exec-"));
  context = {
    sourceRoot: "/src",
    home: "/home",
    cwd: "/cwd",
    now: "2026-01-01T00:00:00Z",
    log: () => {},
    exec: () => ({ status: 0, stdout: "", stderr: "" }),
  };
});
afterEach(() => {
  rmSync(receiptDir, { recursive: true, force: true });
});

const planFor = (user: string[]): AdapterPlan => ({
  target: "opencode",
  user,
  project: [],
});

/** A stand-in adapter; the real ones have their own suites. */
function fakeAdapter(over: Partial<Adapter> = {}): Adapter {
  return {
    id: "opencode",
    displayName: "OpenCode",
    scopes: ["user", "project"],
    detect: () => true,
    configPaths: () => [],
    plan: () => [{ summary: "would write /x" }],
    // Records the plan, as every real adapter does — that is what `--upgrade`
    // replays.
    apply: (_context, plan) => ({
      receipt: new ReceiptBuilder().build(
        "2026-01-01T00:00:00Z",
        planPlugins(plan),
      ),
      actions: [{ summary: "wrote /x" }],
    }),
    verify: () => [],
    revert: () => {},
    ...over,
  };
}

const options = (dryRun = false) => ({ context, dryRun, receiptDir });

describe("planFromReceipt", () => {
  it("splits the recorded plugins back by scope", () => {
    const receipt = new ReceiptBuilder().build("2026-01-01T00:00:00Z", [
      { name: "vwf", scope: "user" },
      { name: "flutter", scope: "project" },
    ]);

    expect(planFromReceipt("opencode", receipt)).toEqual({
      target: "opencode",
      user: ["vwf"],
      project: ["flutter"],
    });
  });

  it("returns nothing for a receipt written before plans were recorded", () => {
    // Byte entries alone cannot say which plugins to re-install.
    const receipt = new ReceiptBuilder().build("2026-01-01T00:00:00Z");

    expect(planFromReceipt("opencode", receipt)).toBeUndefined();
  });
});

describe("upgradeJobs", () => {
  it("replays what a target's receipt recorded", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());

    const { jobs, unrecorded } = upgradeJobs([fakeAdapter()], options());

    expect(jobs[0]?.[1].user).toEqual(["markdown"]);
    expect(unrecorded).toEqual([]);
  });

  it("skips a target with no receipt rather than installing into it", () => {
    // `--upgrade` refreshes what is here; choosing what should be here is the
    // install flags' job.
    const { jobs, unrecorded } = upgradeJobs([fakeAdapter()], options());

    expect(jobs).toEqual([]);
    expect(unrecorded).toEqual([]);
  });

  it("names a target whose receipt predates plan recording", () => {
    execute(
      [[
        fakeAdapter({
          apply: () => ({
            receipt: new ReceiptBuilder().build("2026-01-01T00:00:00Z"),
            actions: [],
          }),
        }),
        planFor(["markdown"]),
      ]],
      options(),
    );

    const { jobs, unrecorded } = upgradeJobs([fakeAdapter()], options());

    expect(jobs).toEqual([]);
    expect(unrecorded).toEqual(["opencode"]);
  });
});

describe("execute", () => {
  it("records the plan it installed, for --upgrade to replay", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());

    expect(readReceipt(receiptPath(receiptDir, "opencode"))?.plugins)
      .toEqual([{ name: "markdown", scope: "user" }]);
  });

  it("writes a receipt per target", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());

    expect(existsSync(receiptPath(receiptDir, "opencode"))).toBe(true);
  });

  it("writes no receipt and takes no action on a dry run", () => {
    const outcomes = execute(
      [[fakeAdapter(), planFor(["markdown"])]],
      options(true),
    );

    expect(outcomes[0]?.actions[0]?.summary).toBe("would write /x");
    expect(existsSync(receiptPath(receiptDir, "opencode"))).toBe(false);
  });

  it("skips a target whose tool is not installed, without failing", () => {
    const outcomes = execute(
      [[fakeAdapter({ detect: () => false }), planFor(["markdown"])]],
      options(),
    );

    expect(outcomes[0]?.skipped).toBe("not-installed");
    expect(failed(outcomes)).toBe(false);
  });

  it("installs into an absent tool when forced", () => {
    const outcomes = execute(
      [[fakeAdapter({ detect: () => false }), planFor(["markdown"])]],
      { ...options(), force: true },
    );

    expect(outcomes[0]?.skipped).toBeUndefined();
  });

  it("skips an empty plan without consulting the adapter", () => {
    const outcomes = execute(
      [[
        fakeAdapter({
          detect: () => {
            throw new Error("should not be reached");
          },
        }),
        planFor([]),
      ]],
      options(),
    );

    expect(outcomes[0]?.skipped).toBe("empty");
  });

  it("keeps going when one target fails, and still records the others", () => {
    // Targets are independent; stopping halfway would leave some installed with
    // no receipt for the ones that succeeded.
    const boom = fakeAdapter({
      id: "claude",
      apply: () => {
        throw new Error("boom");
      },
    });
    const outcomes = execute(
      [[boom, { ...planFor(["markdown"]), target: "claude" }], [
        fakeAdapter(),
        planFor(["markdown"]),
      ]],
      options(),
    );

    expect(outcomes[0]?.error).toBe("boom");
    expect(outcomes[1]?.error).toBeUndefined();
    expect(existsSync(receiptPath(receiptDir, "opencode"))).toBe(true);
    expect(failed(outcomes)).toBe(true);
  });
});

describe("revert", () => {
  it("takes the receipt directory with it once the last one is consumed", () => {
    // No receipt can record the directory holding itself, so these were left
    // behind empty by every uninstall. The parent is only removed when it is
    // our own `ai-plugins/` — walking up blindly would target whatever holds
    // the receipt dir.
    const nested = join(receiptDir, "ai-plugins", "receipts");
    mkdirSync(nested, { recursive: true });
    const nestedOptions = { context, dryRun: false, receiptDir: nested };
    execute([[fakeAdapter(), planFor(["markdown"])]], nestedOptions);

    revert([fakeAdapter()], nestedOptions);

    expect(existsSync(nested)).toBe(false);
    expect(existsSync(dirname(nested))).toBe(false);
    // The directory above ours is untouched, whatever it is.
    expect(existsSync(receiptDir)).toBe(true);
  });

  it("refuses to revert a target with no receipt", () => {
    let called = false;
    const outcomes = revert(
      [fakeAdapter({
        revert: () => {
          called = true;
        },
      })],
      options(),
    );

    // Without a receipt there is nothing to restore *to*, and guessing is what
    // receipts exist to avoid.
    expect(called).toBe(false);
    expect(outcomes[0]?.skipped).toBe("empty");
  });

  it("reverts a target that has one", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());
    let called = false;

    revert(
      [fakeAdapter({
        revert: () => {
          called = true;
        },
      })],
      options(),
    );

    expect(called).toBe(true);
  });

  it("consumes the receipt, so --upgrade cannot resurrect the install", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());

    revert([fakeAdapter()], options());

    expect(existsSync(receiptPath(receiptDir, "opencode"))).toBe(false);
    // The bite: a surviving receipt makes `--upgrade` re-install exactly what
    // was just uninstalled.
    expect(upgradeJobs([fakeAdapter()], options()).jobs).toEqual([]);
  });

  it("keeps the receipt when the revert failed", () => {
    execute([[fakeAdapter(), planFor(["markdown"])]], options());

    revert(
      [fakeAdapter({
        revert: () => {
          throw new Error("boom");
        },
      })],
      options(),
    );

    // A half-reverted install still has state to undo; discarding the record
    // would strand it.
    expect(existsSync(receiptPath(receiptDir, "opencode"))).toBe(true);
  });
});

describe("renderProgress", () => {
  it("distinguishes success, skip and failure", () => {
    const text = renderProgress([
      { target: "opencode", actions: [{ summary: "a" }], plugins: 2 },
      { target: "claude", actions: [], skipped: "not-installed" },
      { target: "cursor", actions: [], error: "boom" },
    ]);

    expect(text).toContain("opencode");
    expect(text).toContain("2 plugins, 1 change");
    expect(text).toContain("tool not on PATH");
    expect(text).toContain("✘ failed");
    expect(text).toContain("boom");
    expect(text).toContain("✘ 1 of 3 targets failed");
  });

  it("aligns the columns whatever the target names are", () => {
    const lines = renderProgress([
      { target: "opencode", actions: [{ summary: "a" }], plugins: 1 },
      { target: "claude", actions: [], plugins: 1 },
    ])
      .split("\n")
      .filter(l => l.includes("plugin"));

    // The DETAIL column starts at the same offset on every row, which is the
    // whole point of the table — a ragged one is just prose with extra spaces.
    const offsets = lines.map(l => l.indexOf("1 plugin"));
    expect(new Set(offsets).size).toBe(1);
  });

  it("collapses the three statusline outcomes into one row", () => {
    // They are three installs of one feature. Listing them separately also
    // made `statusline:opencode` the widest label in the run, padding every
    // other column to fit a name nobody needed to read.
    const text = renderProgress([
      { target: "claude", actions: [{ summary: "a" }], plugins: 1 },
      { target: "statusline", actions: [{ summary: "b" }] },
      { target: "statusline:ohmypi", actions: [] },
      { target: "statusline:opencode", actions: [{ summary: "c" }] },
    ]);

    expect(text).not.toContain("statusline:opencode");
    expect(text).toContain("claude, opencode");
    expect(text.match(/statusline/g)).toHaveLength(1);
  });

  it("replaces the home directory with ~ in notes", () => {
    const text = renderProgress({
      outcomes: [{ target: "claude", actions: [], plugins: 1 }],
      notes: [`installing from ${homedir()}/Library/pnpm/store/v11/links`],
    });

    expect(text).toContain("~/Library/pnpm/store");
    expect(text).not.toContain(homedir());
  });
});

describe("renderDiff", () => {
  it("shows the changed lines of a config edit", () => {
    const text = renderDiff([{
      target: "opencode",
      actions: [{
        summary: "update /c",
        path: "/c",
        diff: { before: "{\n  \"a\": 1\n}\n", after: "{\n  \"a\": 2\n}\n" },
      }],
    }]);

    expect(text).toContain("# opencode");
    expect(text).toContain("-   \"a\": 1");
    expect(text).toContain("+   \"a\": 2");
    // Unchanged context is not repeated as a change.
    expect(text).not.toContain("- {");
  });

  it("renders a new file as all additions", () => {
    const text = renderDiff([{
      target: "cursor",
      actions: [{
        summary: "update /c",
        diff: { before: "", after: "{\n  \"a\": 1\n}\n" },
      }],
    }]);

    expect(text).toContain("+ {");
    expect(text).not.toContain("- ");
  });

  it("prints a summary alone for an action with no diff", () => {
    const text = renderDiff([{
      target: "claude",
      actions: [{ summary: "claude plugin install vwf@virajp-plugins" }],
    }]);

    expect(text.trim()).toBe(
      "# claude\n  claude plugin install vwf@virajp-plugins",
    );
  });
});
