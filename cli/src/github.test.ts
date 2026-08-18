import {
  describe,
  expect,
  it,
} from "vitest";
import {
  describeFailure,
  githubHeaders,
  isRateLimited,
  RATE_LIMIT_HINT,
} from "./github.ts";

/** Just enough of `Headers` to answer the one question `isRateLimited` asks. */
function headers(values: Record<string, string> = {}) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("githubHeaders", () => {
  it("attaches the token when the environment has one", () => {
    expect(githubHeaders({ GITHUB_API_TOKEN: "ghp_x" }))
      .toEqual({ Authorization: "Bearer ghp_x" });
  });

  it("sends nothing at all when it does not", () => {
    // Absent the variable, behaviour is exactly what it was before — including
    // saying nothing about it. A suggestion printed on every successful run is
    // noise.
    expect(githubHeaders({})).toEqual({});
  });

  it("treats an empty or whitespace value as unset", () => {
    // What an exported but unfilled variable looks like. Sending `Bearer ` would
    // turn a working anonymous request into a 401.
    expect(githubHeaders({ GITHUB_API_TOKEN: "" })).toEqual({});
    expect(githubHeaders({ GITHUB_API_TOKEN: "   " })).toEqual({});
  });

  it("trims the value, since a copy-pasted token carries a newline", () => {
    expect(githubHeaders({ GITHUB_API_TOKEN: "ghp_x\n" }))
      .toEqual({ Authorization: "Bearer ghp_x" });
  });
});

describe("isRateLimited", () => {
  it("recognises 429", () => {
    expect(isRateLimited(429, headers())).toBe(true);
  });

  it("recognises GitHub's other spelling: 403 with no quota left", () => {
    // The one that actually bites. An exhausted anonymous quota comes back 403,
    // not 429, so testing only for 429 means the hint never appears where it is
    // needed.
    expect(isRateLimited(403, headers({ "x-ratelimit-remaining": "0" })))
      .toBe(true);
  });

  it("does NOT treat a plain 403 as rate limiting", () => {
    // A private repo or a revoked token. A read-only token would not fix either,
    // so suggesting one sends the user off to do something irrelevant.
    expect(isRateLimited(403, headers())).toBe(false);
  });

  it("does not treat a 403 with quota remaining as rate limiting", () => {
    expect(isRateLimited(403, headers({ "x-ratelimit-remaining": "42" })))
      .toBe(false);
  });

  it("leaves every other status alone", () => {
    for (const status of [401, 404, 500, 502]) {
      expect(isRateLimited(status, headers()), String(status)).toBe(false);
    }
  });
});

describe("describeFailure", () => {
  const url = "https://raw.githubusercontent.com/virajp/ai-plugins/main/x.json";

  it("adds the hint only when the call was rate-limited", () => {
    expect(describeFailure(url, 429, headers())).toContain(RATE_LIMIT_HINT);
    expect(describeFailure(url, 429, headers()))
      .toContain("GITHUB_API_TOKEN");
  });

  it("keeps a plain failure plain", () => {
    const text = describeFailure(url, 404, headers());

    expect(text).toBe(`${url} → HTTP 404`);
    expect(text).not.toContain("GITHUB_API_TOKEN");
  });

  it("keeps an authorization failure plain too", () => {
    expect(describeFailure(url, 403, headers()))
      .not
      .toContain("GITHUB_API_TOKEN");
  });

  it("names the URL and status either way, so the failure is diagnosable", () => {
    expect(describeFailure(url, 429, headers())).toContain(url);
    expect(describeFailure(url, 429, headers())).toContain("HTTP 429");
  });
});
