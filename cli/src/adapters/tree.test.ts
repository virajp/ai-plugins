import {
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
  ReceiptBuilder,
  revert,
} from "../receipt.ts";
import {
  copyTree,
  substitute,
  walk,
} from "./tree.ts";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ai-plugins-tree-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("root token substitution", () => {
  const sibling = (plugin: string) => `/installed/${plugin}`;

  it("resolves a plugin's own root", () => {
    expect(substitute("see %%AI_PLUGINS_ROOT%%/assets/x.md", "/me", sibling))
      .toBe("see /me/assets/x.md");
  });

  it("resolves sibling references before the bare token", () => {
    // Order is load-bearing: `%%AI_PLUGINS_ROOT:vwf%%` *contains* the bare
    // token as a prefix, so substituting the bare one first would leave
    // `/me:vwf%%` — a path that silently points nowhere.
    expect(substitute("%%AI_PLUGINS_ROOT:vwf%%/assets/a.md", "/me", sibling))
      .toBe("/installed/vwf/assets/a.md");
  });

  it("handles both tokens in one document", () => {
    const out = substitute(
      "own %%AI_PLUGINS_ROOT%%/a.md and %%AI_PLUGINS_ROOT:vwf%%/b.md",
      "/me",
      sibling,
    );
    expect(out).toBe("own /me/a.md and /installed/vwf/b.md");
  });

  it("replaces every occurrence, not just the first", () => {
    expect(
      substitute("%%AI_PLUGINS_ROOT%% %%AI_PLUGINS_ROOT%%", "/me", sibling),
    )
      .toBe("/me /me");
  });
});

describe("copyTree", () => {
  function fixture(): string {
    const from = join(root, "src");
    mkdirSync(join(from, "skills", "plan"), { recursive: true });
    writeFileSync(
      join(from, "skills", "plan", "SKILL.md"),
      "read %%AI_PLUGINS_ROOT%%/assets/x.md\n",
    );
    writeFileSync(join(from, "logo.png"), Buffer.from([0x89, 0x50, 0x4e]));
    return from;
  }

  const options = (from: string, to: string) => ({
    from,
    to,
    rootPath: "/installed/vwf",
    siblingRoot: (p: string) => `/installed/${p}`,
  });

  it("substitutes in text files and copies binaries verbatim", () => {
    const from = fixture();
    const to = join(root, "out");
    copyTree(options(from, to), new ReceiptBuilder(), false);

    expect(readFileSync(join(to, "skills", "plan", "SKILL.md"), "utf8"))
      .toBe("read /installed/vwf/assets/x.md\n");
    // Not text: must survive byte-for-byte rather than being read as utf8.
    expect([...readFileSync(join(to, "logo.png"))]).toEqual([0x89, 0x50, 0x4e]);
  });

  it("writes nothing on a dry run but reports the same actions", () => {
    const from = fixture();
    const to = join(root, "out");

    const dry = copyTree(options(from, to), new ReceiptBuilder(), true);
    expect(existsSyncSafe(to)).toBe(false);

    const wet = copyTree(options(from, to), new ReceiptBuilder(), false);
    // One code path drives both, so a dry run cannot drift from the real one.
    expect(dry.map(a => a.summary)).toEqual(wet.map(a => a.summary));
  });

  it("is fully reverted by its own receipt", () => {
    const from = fixture();
    const to = join(root, "out");
    const receipt = new ReceiptBuilder();

    copyTree(options(from, to), receipt, false);
    revert(receipt.build("2026-01-01T00:00:00Z"), { restoreKey() {} });

    // Every file and every directory the copy created is gone again.
    expect(existsSyncSafe(to)).toBe(false);
  });

  it("restores a file it overwrote rather than deleting it", () => {
    const from = fixture();
    const to = join(root, "out");
    mkdirSync(join(to, "skills", "plan"), { recursive: true });
    writeFileSync(join(to, "skills", "plan", "SKILL.md"), "user's own\n");

    const receipt = new ReceiptBuilder();
    copyTree(options(from, to), receipt, false);
    revert(receipt.build("2026-01-01T00:00:00Z"), { restoreKey() {} });

    expect(readFileSync(join(to, "skills", "plan", "SKILL.md"), "utf8"))
      .toBe("user's own\n");
  });

  it("refuses a missing source tree instead of silently installing nothing", () => {
    expect(() =>
      copyTree(
        options(join(root, "absent"), join(root, "out")),
        new ReceiptBuilder(),
        false,
      )
    )
      .toThrow(/missing rendered tree/);
  });
});

describe("walk", () => {
  it("returns every file, relative and sorted", () => {
    const from = join(root, "w");
    mkdirSync(join(from, "b"), { recursive: true });
    writeFileSync(join(from, "a.md"), "");
    writeFileSync(join(from, "b", "c.md"), "");
    expect(walk(from)).toEqual(["a.md", join("b", "c.md")]);
  });
});

function existsSyncSafe(path: string): boolean {
  try {
    return walk(path).length > 0;
  }
  catch {
    return false;
  }
}
