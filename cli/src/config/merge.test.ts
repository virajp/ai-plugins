import {
  describe,
  expect,
  it,
} from "vitest";
import { deepMerge } from "./merge.ts";

describe("deepMerge", () => {
  it("lets the override win, recursing into objects", () => {
    expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { b: 9 } }))
      .toEqual({ a: { b: 9, c: 2 } });
  });

  it("fills in keys the override does not mention", () => {
    // The point of the merge: a new statusline version's defaults reach a
    // config the user seeded two releases ago.
    expect(deepMerge({ a: 1, b: 2 }, { a: 9 })).toEqual({ a: 9, b: 2 });
  });

  it("replaces arrays wholesale", () => {
    // A palette is one setting; splicing defaults back into a list the user
    // deliberately shortened would be the opposite of preserving their edit.
    expect(deepMerge({ a: [1, 2, 3] }, { a: [9] })).toEqual({ a: [9] });
  });

  it("drops prototype keys instead of merging them", () => {
    const merged = deepMerge(
      { safe: 1 },
      JSON.parse("{\"__proto__\": {\"polluted\": true}, \"safe\": 2}"),
    ) as Record<string, unknown>;

    expect(merged["safe"]).toBe(2);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.hasOwn(merged, "__proto__")).toBe(false);
  });

  it("returns the base when the override is absent", () => {
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
  });
});
