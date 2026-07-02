// Unit tests for the pure logic in bin/utils.mjs: version comparison and the
// config deep-merge. Run via `node --test` (wired into the i:test task).

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  cmpPre,
  cmpVer,
  deepMerge,
} from "../bin/utils.mjs";

test("cmpVer orders core versions", () => {
  assert.equal(cmpVer("1.2.3", "1.2.0"), 1);
  assert.equal(cmpVer("1.2.0", "1.2.3"), -1);
  assert.equal(cmpVer("2.0.0", "1.9.9"), 1);
  assert.equal(cmpVer("1.2.0", "1.2.0"), 0);
});

test("cmpVer tolerates a leading v and missing segments", () => {
  assert.equal(cmpVer("v1.2.0", "1.2.0"), 0);
  assert.equal(cmpVer("1.2", "1.2.0"), 0); // missing patch treated as 0
  assert.equal(cmpVer("v2.0.0", "1.0.0"), 1);
});

test("cmpVer ranks a release above its prerelease", () => {
  assert.equal(cmpVer("1.2.0", "1.2.0-rc.1"), 1);
  assert.equal(cmpVer("1.2.0-rc.1", "1.2.0"), -1);
});

test("cmpVer compares two prereleases segment by segment", () => {
  assert.equal(cmpVer("1.2.0-rc.2", "1.2.0-rc.1"), 1);
  assert.equal(cmpVer("1.2.0-rc.1", "1.2.0-rc.1"), 0);
  assert.equal(cmpVer("1.2.0-rc", "1.2.0-rc.1"), -1); // shorter run is smaller
});

test("cmpVer on malformed input (documents current behavior)", () => {
  // Non-numeric core segments parse to 0, so "abc" reads as 0.0.0.
  assert.equal(cmpVer("abc", "1.0.0"), -1);
  assert.equal(cmpVer("abc", "0.0.0"), 0);
  assert.equal(cmpVer("", ""), 0);
});

test("cmpPre: numeric segments compare numerically, others lexically", () => {
  assert.equal(cmpPre("rc.1", "rc.2"), -1);
  assert.equal(cmpPre("rc.10", "rc.2"), 1); // numeric, not lexical
  assert.equal(cmpPre("rc.1", "rc.1"), 0);
  assert.equal(cmpPre("alpha", "beta"), -1);
  assert.equal(cmpPre("rc", "rc.1"), -1); // shorter run is smaller
  assert.equal(cmpPre("a", "1"), 1); // mixed: lexical, "a" > "1"
});

test("deepMerge merges objects key by key", () => {
  assert.deepEqual(
    deepMerge({ a: 1, b: { x: 1 } }, { b: { y: 2 }, c: 3 }),
    { a: 1, b: { x: 1, y: 2 }, c: 3 },
  );
});

test("deepMerge: override scalars and arrays replace wholesale", () => {
  assert.equal(deepMerge({ a: 1 }, { a: 2 }).a, 2);
  assert.deepEqual(deepMerge({ a: [1, 2, 3] }, { a: [9] }).a, [9]);
});

test("deepMerge: an absent layer is a no-op", () => {
  assert.deepEqual(deepMerge({ a: 1 }, undefined), { a: 1 });
  assert.deepEqual(deepMerge(undefined, { a: 1 }), { a: 1 });
});

test("deepMerge does not merge via prototype-pollution keys", () => {
  const result = deepMerge(
    {},
    JSON.parse("{\"__proto__\":{\"polluted\":true}}"),
  );
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal({}.polluted, undefined);

  deepMerge(
    {},
    JSON.parse("{\"constructor\":{\"x\":1},\"prototype\":{\"y\":2}}"),
  );
  assert.equal({}.x, undefined);
  assert.equal({}.y, undefined);
});
