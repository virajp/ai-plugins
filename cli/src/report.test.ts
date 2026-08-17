import { homedir } from "node:os";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  failed,
  renderDiff,
  renderProgress,
  shorten,
} from "./report.ts";

/**
 * Ported from the retired `executor.test.ts`, whose other half drove four plugin
 * adapters. What survived the narrowing is the rendering, and it kept its tests:
 * these are the only assertions on what a run actually prints.
 *
 * One test did not survive — the three statusline outcomes collapsing into a
 * single row. There is one bar now, so there is nothing to collapse.
 */
describe("renderProgress", () => {
  it("distinguishes success, skip and failure", () => {
    const text = renderProgress([
      { name: "statusline", actions: [{ summary: "a" }] },
      {
        name: "legacy:statusline-ohmypi.json",
        actions: [],
        skipped: "not-installed",
      },
      { name: "marketplace", actions: [], error: "boom" },
    ]);

    expect(text).toContain("statusline");
    expect(text).toContain("1 change");
    expect(text).toContain("tool not on PATH");
    expect(text).toContain("✘ failed");
    expect(text).toContain("boom");
    expect(text).toContain("✘ 1 of 3 steps failed");
  });

  it("aligns the columns whatever the step names are", () => {
    const lines = renderProgress([
      { name: "legacy:statusline-opencode.json", actions: [{ summary: "a" }] },
      { name: "statusline", actions: [{ summary: "b" }] },
    ])
      .split("\n")
      .filter(l => l.includes("1 change"));

    // The DETAIL column starts at the same offset on every row, which is the
    // whole point of the table — a ragged one is just prose with extra spaces.
    const offsets = lines.map(l => l.indexOf("1 change"));
    expect(new Set(offsets).size).toBe(1);
  });

  it("counts the verdict over the rows, so it cannot contradict the table", () => {
    const text = renderProgress([
      { name: "statusline", actions: [{ summary: "a" }] },
      { name: "graph", actions: [{ summary: "b" }] },
    ]);

    expect(text).toContain("✔ 2 steps updated");
  });

  it("says so when a run changed nothing", () => {
    expect(renderProgress([{ name: "statusline", actions: [] }]))
      .toContain("already up to date");
  });

  it("replaces the home directory with ~ in notes", () => {
    const text = renderProgress({
      outcomes: [{ name: "statusline", actions: [] }],
      notes: [`installing from ${homedir()}/Library/pnpm/store/v11/links`],
    });

    expect(text).toContain("~/Library/pnpm/store");
    expect(text).not.toContain(homedir());
  });

  it("puts the version in the header, so a pasted report names its build", () => {
    expect(
      renderProgress({
        outcomes: [{ name: "statusline", actions: [] }],
        version: "4.3.3",
      }),
    )
      .toContain("@askviraj/ai-plugins 4.3.3");
  });
});

describe("shorten", () => {
  it("leaves text alone when the home directory is not in it", () => {
    expect(shorten("nothing to shorten", "/home/me")).toBe(
      "nothing to shorten",
    );
  });

  it("does not collapse a one-character home into every slash", () => {
    expect(shorten("/a/b/c", "/")).toBe("/a/b/c");
  });
});

describe("renderDiff", () => {
  it("shows the changed lines of a config edit", () => {
    const text = renderDiff([{
      name: "statusline",
      actions: [{
        summary: "update /c",
        path: "/c",
        diff: { before: "{\n  \"a\": 1\n}\n", after: "{\n  \"a\": 2\n}\n" },
      }],
    }]);

    expect(text).toContain("# statusline");
    expect(text).toContain("-   \"a\": 1");
    expect(text).toContain("+   \"a\": 2");
    // Unchanged context is not repeated as a change.
    expect(text).not.toContain("- {");
  });

  it("renders a new file as all additions", () => {
    const text = renderDiff([{
      name: "statusline",
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
      name: "marketplace",
      actions: [{
        summary: "claude plugin marketplace remove virajp-plugins",
      }],
    }]);

    expect(text.trim()).toBe(
      "# marketplace\n  claude plugin marketplace remove virajp-plugins",
    );
  });

  it("says nothing at all about a step with no actions", () => {
    expect(renderDiff([{ name: "statusline", actions: [] }])).toBe("");
  });
});

describe("failed", () => {
  it("is true only when something carries an error", () => {
    expect(failed([{ name: "a", actions: [] }])).toBe(false);
    expect(failed([{ name: "a", actions: [], skipped: "empty" }])).toBe(false);
    expect(failed([{ name: "a", actions: [], error: "boom" }])).toBe(true);
  });
});
