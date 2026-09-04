/**
 * Fetching from GitHub, authenticated when the environment offers a token.
 *
 * The CLI reads one thing from GitHub — the marketplace manifest on `main`, for
 * `--version` — and reads it unauthenticated, which is fine for one machine and
 * not fine behind shared egress: GitHub's anonymous limit is per source IP, so a
 * corporate NAT or a CI runner pool exhausts it between them and every user
 * behind it sees `--version` fail for reasons that have nothing to do with them.
 *
 * Three rules, and the second is the one worth being careful about:
 *
 * - **`$GITHUB_API_TOKEN` is attached when it is set, and nothing more is asked
 *   of the user.** Absent, behaviour is exactly as before, and no output
 *   mentions the variable — a suggestion printed on every successful run is
 *   noise, and a suggestion printed on every *failure* would tell a user with no
 *   network to go get a token.
 * - **The hint appears only for an actual rate limit**, which GitHub spells two
 *   ways. `429` is the documented one; the one that bites is **`403` with
 *   `x-ratelimit-remaining: 0`**, which is what the REST API returns for an
 *   exhausted anonymous quota. A plain `403` — a private repo, a revoked token —
 *   is an authorization failure that a read-only token would not fix, so it must
 *   not carry the hint.
 * - **The npm registry is not GitHub.** Its call stays tokenless and goes
 *   through plain `fetchJson`; sending a GitHub credential to registry.npmjs.org
 *   would leak it to a host that has no business seeing it.
 */

/** The environment variable, named once. */
export const TOKEN_VAR = "GITHUB_API_TOKEN";

export const RATE_LIMIT_HINT =
  `rate-limited by GitHub — set $${TOKEN_VAR} to a read-only (public-repo) `
  + "token and re-run";

/**
 * The request headers for a GitHub call.
 *
 * `Bearer`, which is what the REST API documents for a fine-grained token and
 * which classic tokens also accept — one spelling rather than sniffing the token
 * format. An empty variable is treated as unset, since that is what an exported
 * but unfilled variable looks like.
 */
export function githubHeaders(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const token = env[TOKEN_VAR];
  if (token === undefined || token.trim().length === 0) {
    return {};
  }
  return { Authorization: `Bearer ${token.trim()}` };
}

/** Just enough of `Headers` to ask one question, so a test can pass a literal. */
export interface HeaderReader {
  get(name: string): string | null;
}

/**
 * Is this response a rate limit?
 *
 * Both spellings, and nothing else. The `403` branch requires the remaining
 * count to be **exactly zero**: a missing header means the response did not come
 * from the rate limiter, and any other value means quota was left.
 */
export function isRateLimited(
  status: number,
  headers: HeaderReader,
): boolean {
  if (status === 429) {
    return true;
  }
  return status === 403 && headers.get("x-ratelimit-remaining") === "0";
}

/** The error a failed GitHub call reports, hint attached only when earned. */
export function describeFailure(
  url: string,
  status: number,
  headers: HeaderReader,
): string {
  const base = `${url} → HTTP ${status}`;
  return isRateLimited(status, headers) ? `${base} — ${RATE_LIMIT_HINT}` : base;
}

/** Read JSON from a URL, with no credentials. Used for the npm registry. */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return await response.json() as T;
}

/** Read JSON from GitHub: token when present, rate-limit hint when earned. */
export async function fetchGithubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(
      describeFailure(url, response.status, response.headers),
    );
  }
  return await response.json() as T;
}
