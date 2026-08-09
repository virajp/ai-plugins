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
import { setJsonPath } from "./config/json.ts";
import {
  readReceipt,
  ReceiptBuilder,
  revert,
  writeReceipt,
} from "./receipt.ts";

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

/** Restores config keys through the JSONC mutator, as the adapters do. */
const jsonHooks = {
  restoreKey(
    file: string,
    path: readonly (string | number)[],
    hadKey: boolean,
    previous: unknown,
  ) {
    if (!existsSync(file)) {
      return;
    }
    const text = readFileSync(file, "utf8");
    writeFileSync(file, setJsonPath(text, path, hadKey ? previous : undefined));
  },
};

describe("receipts", () => {
  it("deletes a file it created and restores one it overwrote", () => {
    const created = join(root, "created.txt");
    const existing = join(root, "existing.txt");
    writeFileSync(existing, "original\n");

    const builder = new ReceiptBuilder();
    builder.file(created).file(existing);
    writeFileSync(created, "new\n");
    writeFileSync(existing, "clobbered\n");

    revert(builder.build("2026-01-01T00:00:00Z"), jsonHooks);

    expect(existsSync(created)).toBe(false);
    expect(readFileSync(existing, "utf8")).toBe("original\n");
  });

  it("removes a directory it created, but not one holding user files", () => {
    const ours = join(root, "ours");
    const shared = join(root, "shared");

    const builder = new ReceiptBuilder();
    builder.dir(ours).dir(shared);
    mkdirSync(ours);
    mkdirSync(shared);
    writeFileSync(join(shared, "user.txt"), "mine\n");

    revert(builder.build("2026-01-01T00:00:00Z"), jsonHooks);

    expect(existsSync(ours)).toBe(false);
    // Still there, because the user put something in it.
    expect(existsSync(shared)).toBe(true);
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

    const builder = new ReceiptBuilder();
    builder
      .configKey(file, ["statusLine"], { present: false })
      .configKey(file, ["env", "EXISTING"], { present: true, value: "keep" });

    let text = readFileSync(file, "utf8");
    text = setJsonPath(text, ["statusLine"], { type: "command" });
    text = setJsonPath(text, ["env", "EXISTING"], "clobbered");
    writeFileSync(file, text);

    revert(builder.build("2026-01-01T00:00:00Z"), jsonHooks);

    // Byte-identical, comment included — not merely semantically equal.
    expect(readFileSync(file, "utf8")).toBe(original);
  });

  it("reverts in reverse, so a file inside a created dir is removed first", () => {
    const dir = join(root, "nested");
    const file = join(dir, "inside.txt");

    const builder = new ReceiptBuilder();
    builder.dir(dir);
    mkdirSync(dir);
    builder.file(file);
    writeFileSync(file, "x\n");

    revert(builder.build("2026-01-01T00:00:00Z"), jsonHooks);

    // Forward order would have tried to rmdir a non-empty directory and left both.
    expect(existsSync(file)).toBe(false);
    expect(existsSync(dir)).toBe(false);
  });

  it("round-trips through disk", () => {
    const path = join(root, "receipt.json");
    const receipt = new ReceiptBuilder()
      .file(join(root, "a.txt"))
      .build("2026-01-01T00:00:00Z");

    writeReceipt(path, receipt);
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
