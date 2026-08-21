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
import {
  restoreJsonKey,
  setJsonPath,
} from "./config/json.ts";
import type {
  Entry,
  Receipt,
} from "./receipt.ts";
import {
  readReceipt,
  RECEIPT_VERSION,
  revert,
} from "./receipt.ts";

/**
 * A receipt written by an older version of this CLI.
 *
 * **Every receipt is one now** — nothing this version installs writes one, so
 * `ReceiptBuilder` and `writeReceipt` are gone and there is nothing left to
 * round-trip through. Which is the right shape for these tests anyway: what
 * `revert` has to meet is JSON already on disk, written by a version whose code
 * is no longer here to build a fixture with.
 *
 * That makes this file the only guard on a specific failure: dropping an
 * `Entry` kind from `revert` turns an existing receipt into a file nothing can
 * undo, and the half-revert reports as a clean uninstall. So every kind gets a
 * case below, including the two — `tree` and `command` — that only a retired
 * adapter ever wrote.
 */
function legacy(
  installedAt: string,
  entries: readonly Entry[],
  plugins?: Receipt["plugins"],
): Receipt {
  return {
    version: RECEIPT_VERSION,
    installedAt,
    entries: [...entries],
    ...(plugins === undefined ? {} : { plugins }),
  };
}

/**
 * The invariant under test is the one the whole receipt system exists for:
 * install then remove leaves the tree and every touched config byte-identical.
 * Anything less means uninstall is guessing.
 */
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ai-plugins-receipt-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The real hook `uninstall.ts` passes, not a stand-in for it. */
const jsonHooks = { restoreKey: restoreJsonKey };

describe("reverting a receipt", () => {
  it("deletes a file it created and restores one it overwrote", () => {
    const created = join(root, "created.txt");
    const existing = join(root, "existing.txt");
    writeFileSync(existing, "original\n");
    writeFileSync(created, "new\n");

    revert(
      legacy("t1", [
        { kind: "file", path: created },
        { kind: "file", path: existing, previous: "original\n" },
      ]),
      jsonHooks,
    );

    expect(existsSync(created)).toBe(false);
    expect(readFileSync(existing, "utf8")).toBe("original\n");
  });

  it("removes a directory it created, but not one holding user files", () => {
    const ours = join(root, "ours");
    const shared = join(root, "shared");
    mkdirSync(ours);
    mkdirSync(shared);
    writeFileSync(join(shared, "user.txt"), "mine\n");

    revert(
      legacy("t1", [
        { kind: "dir", path: ours },
        { kind: "dir", path: shared },
      ]),
      jsonHooks,
    );

    expect(existsSync(ours)).toBe(false);
    // Still there, because the user put something in it.
    expect(existsSync(shared)).toBe(true);
  });

  it("removes a `tree` recursively, files and all", () => {
    // The distinction from `dir`: nothing but this tool ever wrote here, which
    // is what makes recursive removal safe rather than reckless. Only the
    // retired adapters wrote these — a copied render tree, the copied Claude
    // marketplace payload — so a machine carrying one has no other way out.
    const tree = join(root, "payload");
    mkdirSync(join(tree, "nested"), { recursive: true });
    writeFileSync(join(tree, "nested", "a.txt"), "x\n");

    revert(legacy("t1", [{ kind: "tree", path: tree }]), jsonHooks);

    expect(existsSync(tree)).toBe(false);
  });

  it("tolerates a `tree` that is already gone", () => {
    // An interrupted uninstall, or a hand-deleted payload. `force` covers it;
    // throwing here would strand every later entry in the same receipt.
    expect(() =>
      revert(
        legacy("t1", [{ kind: "tree", path: join(root, "never-existed") }]),
        jsonHooks,
      )
    )
      .not
      .toThrow();
  });

  it("runs a recorded undo command through the hook", () => {
    // Oh-My-Pi's `config.yml` is the one config no adapter could edit directly —
    // this CLI ships no YAML parser — so that adapter recorded the command to
    // unmake it instead.
    const ran: string[][] = [];
    revert(
      legacy("t1", [
        {
          kind: "command",
          ran: ["config", "set", "k", "v"],
          undo: ["config", "set", "k", ""],
        },
      ]),
      { ...jsonHooks, runUndo: undo => ran.push([...undo]) },
    );

    expect(ran).toEqual([["config", "set", "k", ""]]);
  });

  it("skips a `command` entry when no undo hook was supplied", () => {
    // Absent for the receipts whose adapter never recorded one; a skip rather
    // than an error, or one such entry would fail an otherwise clean revert.
    expect(() =>
      revert(
        legacy("t1", [
          { kind: "command", ran: ["a"], undo: ["b"] },
        ]),
        jsonHooks,
      )
    )
      .not
      .toThrow();
  });

  it("leaves a config byte-identical after install then revert", () => {
    const file = join(root, "settings.json");
    const original = `{
  // A comment the user wrote.
  "theme": "dark",
  "env": { "EXISTING": "keep" }
}
`;
    writeFileSync(file, original);

    let text = original;
    text = setJsonPath(text, ["statusLine"], { type: "command" });
    text = setJsonPath(text, ["env", "EXISTING"], "clobbered");
    writeFileSync(file, text);

    revert(
      legacy("t1", [
        { kind: "configKey", file, path: ["statusLine"], hadKey: false },
        {
          kind: "configKey",
          file,
          path: ["env", "EXISTING"],
          hadKey: true,
          previous: "keep",
        },
      ]),
      jsonHooks,
    );

    // Byte-identical, comment included — not merely semantically equal.
    expect(readFileSync(file, "utf8")).toBe(original);
  });

  it("restores a foreign statusLine command from a v5.2.0 receipt", () => {
    // The one behaviour the statusline's removal had to not break: a machine
    // upgrading from v5.2.0 carries `statusline.json`, and reverting it is what
    // puts the user's own bar back. Nothing writes that receipt any more, so
    // this fixture is the shape as it exists on disk.
    const file = join(root, "settings.json");
    writeFileSync(
      file,
      `${
        JSON.stringify(
          {
            statusLine: {
              type: "command",
              command: "${HOME}/.claude/scripts/statusline",
            },
          },
          null,
          2,
        )
      }\n`,
    );

    revert(
      legacy("t1", [
        {
          kind: "configKey",
          file,
          path: ["statusLine"],
          hadKey: true,
          previous: { type: "command", command: "/opt/theirs/bar.sh" },
        },
      ]),
      jsonHooks,
    );

    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
      statusLine: { type: "command", command: "/opt/theirs/bar.sh" },
    });
  });

  it("reverts in reverse, so a file inside a created dir is removed first", () => {
    const dir = join(root, "nested");
    const file = join(dir, "inside.txt");
    mkdirSync(dir);
    writeFileSync(file, "x\n");

    revert(
      legacy("t1", [
        { kind: "dir", path: dir },
        { kind: "file", path: file },
      ]),
      jsonHooks,
    );

    // Forward order would have tried to rmdir a non-empty directory and left both.
    expect(existsSync(file)).toBe(false);
    expect(existsSync(dir)).toBe(false);
  });
});

describe("reading a receipt", () => {
  it("reads one written to disk by an older version", () => {
    const path = join(root, "receipt.json");
    const receipt = legacy("2026-01-01T00:00:00Z", [
      { kind: "file", path: join(root, "a.txt") },
    ], [{ name: "vwf", scope: "user" }]);
    writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);

    expect(readReceipt(path)).toEqual(receipt);
  });

  it("refuses a receipt written by a newer version", () => {
    const path = join(root, "future.json");
    writeFileSync(path, JSON.stringify({ version: 99, entries: [] }));
    // Reverting with rules that do not match how it was written is worse than
    // declining to revert at all.
    expect(readReceipt(path)).toBeUndefined();
  });

  it("treats a missing or corrupt receipt as absent", () => {
    expect(readReceipt(join(root, "nope.json"))).toBeUndefined();
    const bad = join(root, "bad.json");
    writeFileSync(bad, "{ not json");
    expect(readReceipt(bad)).toBeUndefined();
  });
});
