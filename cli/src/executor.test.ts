import {
  existsSync,
  mkdtempSync,
  rmSync,
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
import type {
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
import {
  execute,
  failed,
  receiptPath,
  renderDiff,
  renderProgress,
  revert,
} from "./executor.ts";
import { ReceiptBuilder } from "./receipt.ts";

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
  statusline: false,
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
    apply: () => ({
      receipt: new ReceiptBuilder().build("2026-01-01T00:00:00Z"),
      actions: [{ summary: "wrote /x" }],
    }),
    verify: () => [],
    revert: () => {},
    ...over,
  };
}

const options = (dryRun = false) => ({ context, dryRun, receiptDir });

describe("execute", () => {
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
      id: "codex",
      apply: () => {
        throw new Error("boom");
      },
    });
    const outcomes = execute(
      [[boom, { ...planFor(["markdown"]), target: "codex" }], [
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
});

describe("renderProgress", () => {
  it("distinguishes success, skip and failure", () => {
    const text = renderProgress([
      { target: "opencode", actions: [{ summary: "a" }] },
      { target: "codex", actions: [], skipped: "not-installed" },
      { target: "cursor", actions: [], error: "boom" },
    ]);

    expect(text).toContain("✔ opencode: 1 change(s)");
    expect(text).toContain("- codex: not installed");
    expect(text).toContain("✘ cursor: boom");
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
      target: "codex",
      actions: [{ summary: "codex plugin add vwf@virajp-plugins" }],
    }]);

    expect(text.trim()).toBe(
      "# codex\n  codex plugin add vwf@virajp-plugins",
    );
  });
});
