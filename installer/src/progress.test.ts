import {
  describe,
  expect,
  it,
} from "vitest";
import { createProgress } from "./progress.ts";

function fake(isTTY: boolean) {
  const written: string[] = [];
  const stream = { write: (c: string) => void written.push(c), isTTY };
  return { stream, written };
}

describe("createProgress", () => {
  it("writes nothing at all when the stream is not a TTY", () => {
    // Piped or redirected output has no cursor to rewrite, so the escapes
    // would land in the file as junk and every transient step would become a
    // permanent line — for a run whose result is the final table anyway.
    const { stream, written } = fake(false);
    const progress = createProgress(stream);

    progress.step("installing claude");
    progress.clear();

    expect(written).toEqual([]);
  });

  it("shows the first step without clearing anything", () => {
    // Nothing has been drawn yet; a leading erase would wipe whatever the
    // caller printed before the run started.
    const { stream, written } = fake(true);

    createProgress(stream).step("installing claude");

    expect(written).toEqual(["  ⋯ installing claude"]);
  });

  it("erases the previous step before drawing the next", () => {
    const { stream, written } = fake(true);
    const progress = createProgress(stream);

    progress.step("installing claude");
    progress.step("installing cursor");

    expect(written[1]).toBe("\r[2K  ⋯ installing cursor");
  });

  it("erases on clear, so the report starts on a clean line", () => {
    const { stream, written } = fake(true);
    const progress = createProgress(stream);

    progress.step("installing claude");
    progress.clear();

    expect(written.at(-1)).toBe("\r[2K");
  });

  it("is idempotent when nothing is showing", () => {
    // `report()` always clears first, including on the paths that never drew a
    // step — a stray erase there would eat the line above it.
    const { stream, written } = fake(true);
    const progress = createProgress(stream);

    progress.clear();
    progress.clear();

    expect(written).toEqual([]);
  });
});
