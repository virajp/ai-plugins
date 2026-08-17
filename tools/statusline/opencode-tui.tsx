/** @jsxImportSource @opentui/solid */
/**
 * The OpenCode status line.
 *
 * The third install of one idea. Claude Code gets the powerline script this CLI
 * copies and points `settings.json` at; Oh-My-Pi gets its own segment renderer
 * configured through `omp config`; OpenCode gets this — a **TUI plugin** drawing
 * one line into the `app_bottom` slot.
 *
 * **Information parity, not visual parity.** The powerline styling is
 * deliberately dropped, exactly as it is for Oh-My-Pi: OpenCode owns the frame,
 * the palette and the separators, and reproducing ours would mean fighting a
 * renderer we do not own. What is mirrored is the *content* of the Claude bar —
 * `tools/statusline/statusline`'s `SEGMENTS` registry and the `lines` layout in
 * `statusline.json`:
 *
 * | Claude bar            | Here                                     | Note                                       |
 * | --------------------- | ---------------------------------------- | ------------------------------------------ |
 * | `model` (+ `effort`)  | `session.get(id).model`                  | `variant` is the nearest thing to effort   |
 * | `context`             | last assistant `tokens` ÷ model `limit`  | summed here; a single number there         |
 * | `cost`                | `session.get(id).cost`                   |                                            |
 * | `duration`            | `session.get(id).time`                   | **wall clock**, not Claude's active time   |
 * | `session`             | `session.get(id).title`                  |                                            |
 * | `project`, `worktree` | `state.path()`                           | worktree basename + the subpath inside it  |
 * | `branch`              | `state.vcs().branch`                     | branch only — no dirty/ahead flags         |
 * | `rl5h` + `rl7d`       | **omitted**                              | no ambient rate-limit state — see below    |
 *
 * **The rate-limit windows are omitted rather than approximated.** OpenCode
 * exposes no ambient rate-limit state at all; it parses provider headers on
 * error paths and nowhere else. Oh-My-Pi at least has a `usage` segment to
 * record as a known gap — here there is nothing to point at, and inventing a
 * number would be worse than the missing one.
 *
 * **The branch is the branch, and nothing more.** `state.vcs()` returns
 * `{ branch, default_branch }` — no dirty or ahead counts, which the Claude bar
 * gets by shelling out to git. It must not do that here: this function runs on
 * every frame, and spawning git per frame is not a status line, it is a fan.
 *
 * Three facts about the plugin surface, each verified against OpenCode 1.18.15
 * with a probe plugin rather than read from the docs, which are wrong or silent
 * on all three:
 *
 * - **No build step.** A `.tsx` file loads as authored. OpenCode's loader is
 *   Bun; it honours the `@jsxImportSource` pragma above and resolves both
 *   `@opentui/solid` and `@opencode-ai/plugin/tui` itself. Nothing here is
 *   transpiled, bundled or installed.
 * - **TUI plugins are not auto-discovered.** The `{plugin,plugins}/*.{ts,js}`
 *   glob is for *server* plugins — a different mechanism, and the one vwf's
 *   mempalace auto-save loads through. A TUI plugin has to be listed in
 *   `tui.json`, a file separate from `opencode.json`, which is what
 *   `cli/src/statusline-opencode.ts` writes.
 * - **The slot receives no session id.** `app_bottom(ctx, props)` is called with
 *   `props = {}` and `ctx = { theme }`, matching the upstream note that the slot
 *   context currently exposes only the theme. So the active session comes from
 *   `api.route.current`, not from the slot.
 *
 * **Every read below is defensive, and that is the load-bearing property.** A
 * plugin that throws inside a render slot takes the frame down with it — the
 * status line stops being a status line and starts being a broken editor. So
 * each segment is built through `segment()`, which turns any failure into an
 * empty string, and every access is optional. A missing session, an empty
 * message list, a provider that has gone away, a model with no declared context
 * limit: each renders *less*, never an error.
 */
import type {
  TuiPlugin,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui";

/**
 * The Claude bar's own symbols, so the two read alike. Kept in sync with
 * `symbols` in `tools/statusline/statusline.json`; a Nerd Font is required here
 * for the same reason it is there.
 *
 * **Written as escapes, not as the glyphs themselves.** All but the first are
 * Nerd Font private-use codepoints, which every editor, terminal and clipboard
 * on the way here renders as a box — and a box is indistinguishable from the
 * empty string, so a glyph silently lost in a copy is a segment that draws a
 * stray leading space forever. The escape is the one form that cannot be
 * mangled without being noticed.
 */
const SYM = {
  /** High voltage. */
  model: "\u{26a1}",
  /** nf-fa-database. */
  context: "\u{f1c0}",
  /** Stopwatch. */
  cost: "\u{23f1}",
  /** nf-fa-clock_o. */
  duration: "\u{f017}",
  /** nf-fa-comment. */
  session: "\u{f02b}",
  /** nf-mdi-folder_multiple. */
  project: "\u{f401}",
  /** nf-fa-folder. */
  folder: "\u{f07b}",
  /** nf-pl-branch. */
  branch: "\u{e0a0}",
} as const;

/** Between segments. Two spaces, since we draw no separator glyph. */
const GAP = "  ";

/**
 * What this plugin reads, and nothing more.
 *
 * Declared here rather than taken from the plugin types on purpose. Every field
 * is optional and every leaf is loose, so an OpenCode that moves or renames one
 * of these makes a segment disappear — which is the whole contract above — where
 * a precise imported type would instead make this file stop compiling against a
 * surface we do not control.
 */
interface Api {
  readonly state?: {
    /** `() => { home, state, config, worktree, directory }` */
    readonly path?: unknown;
    /** `() => { branch, default_branch }` */
    readonly vcs?: unknown;
    /** An array of providers, each with its model catalog. */
    readonly provider?: unknown;
    readonly session?: {
      readonly get?: unknown;
      readonly messages?: unknown;
    };
  };
  /** `{ name }` when idle; carries the session id inside one. */
  readonly route?: { readonly current?: unknown; };
}

interface Paths {
  readonly worktree?: string;
  readonly directory?: string;
}

interface Vcs {
  readonly branch?: string;
}

interface ModelRef {
  readonly id?: string;
  readonly providerID?: string;
  readonly variant?: string;
}

interface Session {
  readonly title?: string;
  readonly cost?: number;
  readonly model?: ModelRef;
  readonly time?: { readonly created?: unknown; readonly updated?: unknown; };
}

interface Provider {
  readonly id?: string;
  readonly models?: Record<
    string,
    { readonly limit?: { readonly context?: number; }; }
  >;
}

interface Tokens {
  readonly input?: number;
  readonly output?: number;
  readonly reasoning?: number;
  readonly cache?: { readonly read?: number; readonly write?: number; };
}

const tui: TuiPlugin = async api => {
  const state = api as unknown as Api;
  api.slots.register({
    order: 500,
    slots: {
      app_bottom: () => <text>{render(state)}</text>,
    },
  });
};

export default {
  id: "aiplugins.statusline",
  tui,
} as TuiPluginModule & { id: string; };

/** One line, in the Claude bar's order. Empty segments drop out. */
function render(api: Api): string {
  const id = sessionId(api);
  return [
    segment(() => model(api, id)),
    segment(() => context(api, id)),
    segment(() => cost(api, id)),
    segment(() => duration(api, id)),
    segment(() => title(api, id)),
    segment(() => project(api)),
    segment(() => branch(api)),
  ]
    .filter(part => part.length > 0)
    .join(GAP);
}

/**
 * Build one segment, or nothing.
 *
 * The single place failure is absorbed: a throw from any read below becomes a
 * missing segment rather than a dead frame.
 */
function segment(build: () => string | undefined): string {
  try {
    return build() ?? "";
  }
  catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

function model(api: Api, id: string | undefined): string | undefined {
  const ref = session(api, id)?.model;
  if (ref?.id === undefined) {
    return undefined;
  }
  // `variant` is the closest OpenCode comes to Claude's reasoning effort, which
  // is what the Claude bar renders in the same brackets.
  const variant = ref.variant === undefined ? "" : ` [${ref.variant}]`;
  return `${SYM.model} ${ref.id}${variant}`;
}

function context(api: Api, id: string | undefined): string | undefined {
  const used = usedTokens(api, id);
  if (used === undefined) {
    return undefined;
  }
  const limit = contextLimit(api, id);
  // A model whose catalog entry declares no context window still has a usable
  // number to show; only the percentage is unavailable.
  if (limit === undefined || limit <= 0) {
    return `${SYM.context} ${humanTokens(used)}`;
  }
  const pct = Math.round((used / limit) * 100);
  return `${SYM.context} ${humanTokens(used)}/${humanTokens(limit)} (${pct}%)`;
}

function cost(api: Api, id: string | undefined): string | undefined {
  const total = session(api, id)?.cost;
  return typeof total === "number"
    ? `${SYM.cost} $${total.toFixed(2)}`
    : undefined;
}

/**
 * Wall clock, **not** the Claude bar's figure.
 *
 * Claude reports `total_duration_ms` — time the agent was actually working.
 * OpenCode records `time.created` and `time.updated` on the session, so this is
 * elapsed time since the session started, which counts the coffee break too.
 * The two are not comparable, and the gap is here rather than hidden.
 */
function duration(api: Api, id: string | undefined): string | undefined {
  const time = session(api, id)?.time;
  const created = epochMs(time?.created);
  const updated = epochMs(time?.updated);
  if (created === undefined || updated === undefined || updated < created) {
    return undefined;
  }
  return `${SYM.duration} ${humanDuration(updated - created)}`;
}

function title(api: Api, id: string | undefined): string | undefined {
  const name = session(api, id)?.title;
  return typeof name === "string" && name.length > 0
    ? `${SYM.session} ${name}`
    : undefined;
}

/** The worktree's basename, plus the subpath when the cwd sits inside it. */
function project(api: Api): string | undefined {
  const paths = read<Paths>(api.state?.path);
  const worktree = paths?.worktree;
  if (typeof worktree !== "string" || worktree.length === 0) {
    return undefined;
  }
  const name = basename(worktree);
  const directory = paths?.directory;
  const inside = typeof directory === "string"
    && directory.startsWith(`${worktree}/`);
  return inside
    ? `${SYM.project} ${name} ${SYM.folder} ${
      directory.slice(worktree.length + 1)
    }`
    : `${SYM.project} ${name}`;
}

/** Branch only. See the header: nothing here may spawn a process. */
function branch(api: Api): string | undefined {
  const name = read<Vcs>(api.state?.vcs)?.branch;
  return typeof name === "string" && name.length > 0
    ? `${SYM.branch} ${name}`
    : undefined;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * The active session id, found rather than assumed.
 *
 * `api.route` is the TUI's screen router — `home` on launch, `session` inside a
 * conversation — and `current` is which screen is up. It is the only route to
 * the session id a plugin has: OpenCode's own footer reads `route.data` through
 * `useRoute()`, a Solid hook inside its component tree that no plugin can reach.
 *
 * **Which key holds the id is not pinned down**, and deliberately still is not.
 * The shape is normalised on the way out to plugins (`name` here, `type`
 * internally), so the id may be renamed with it. Upstream uses `session_id` in
 * the `sidebar_content` slot's props and `sessionID` in its internal route data.
 *
 * The search below **is confirmed to resolve** — verified on OpenCode 1.18.16
 * against a live session, where all five session-derived segments (model,
 * context, cost, duration, title) drew. Which of the three spellings won was not
 * determined, and that is the point: the search costs nothing per frame and
 * survives a rename that a pinned key would not.
 *
 * So this searches instead of guessing. The known spellings are tried first,
 * then any key that reads as a session id, over the route object and one level
 * below it — which is where a `data` wrapper would put it. Bounded at depth two
 * on purpose: deep enough for every shape actually seen, shallow enough that it
 * cannot wander into unrelated state and return a stranger's id.
 *
 * The failure mode is the point. An unrecognised shape yields `undefined`, the
 * session-derived segments drop out, and the bar still shows project and branch
 * — it renders less, never throws, and never invents an id.
 */
function sessionId(api: Api): string | undefined {
  const current = read<Record<string, unknown>>(api.route?.current);
  if (current === undefined || current === null) {
    return undefined;
  }
  return idIn(current) ?? idBelow(current);
}

/** Session-id-shaped keys, in preference order, then anything that reads like one. */
function idIn(source: Record<string, unknown>): string | undefined {
  const known = source["session_id"]
    ?? source["sessionID"]
    ?? source["sessionId"];
  if (typeof known === "string" && known.length > 0) {
    return known;
  }
  for (const [key, value] of Object.entries(source)) {
    if (
      typeof value === "string"
      && value.length > 0
      && /^session[_-]?id$/i.test(key)
    ) {
      return value;
    }
  }
  return undefined;
}

/** One level down — where a `data` or `params` wrapper would hold it. */
function idBelow(source: Record<string, unknown>): string | undefined {
  for (const value of Object.values(source)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const found = idIn(value as Record<string, unknown>);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * The session record.
 *
 * `undefined` covers every uninteresting case at once — no active session, a
 * getter that has gone away, or one that answers with a promise rather than a
 * record, which a render slot has no way to await.
 */
function session(api: Api, id: string | undefined): Session | undefined {
  return id === undefined
    ? undefined
    : call<Session>(api.state?.session?.get, id);
}

/**
 * Tokens on the most recent message that carries any.
 *
 * Walked from the end rather than filtered by role: the counts live on the
 * assistant message, and the newest one that has them is the current usage.
 *
 * **They sit under the `info` wrapper** — confirmed, so that is read first.
 * A message is `{ info, parts }`, which is the same shape vwf's mempalace
 * auto-save reads when it filters on `info.role`. The bare `tokens` fallback
 * is kept only so an older or reshaped message still yields a number rather
 * than blanking the segment.
 */
function usedTokens(api: Api, id: string | undefined): number | undefined {
  if (id === undefined) {
    return undefined;
  }
  const messages = call<unknown>(api.state?.session?.messages, id);
  if (!Array.isArray(messages)) {
    return undefined;
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const entry = messages[i] as Record<string, unknown> | undefined;
    const info = entry?.["info"] as Record<string, unknown> | undefined;
    const tokens = (info?.["tokens"] ?? entry?.["tokens"]) as
      | Tokens
      | undefined;
    if (tokens === undefined || tokens === null) {
      continue;
    }
    return num(tokens.input)
      + num(tokens.output)
      + num(tokens.reasoning)
      + num(tokens.cache?.read)
      + num(tokens.cache?.write);
  }
  return undefined;
}

/** The active model's declared context window, from its provider's catalog. */
function contextLimit(api: Api, id: string | undefined): number | undefined {
  const ref = session(api, id)?.model;
  if (ref?.id === undefined || ref.providerID === undefined) {
    return undefined;
  }
  const providers = read<Provider[]>(api.state?.provider);
  if (!Array.isArray(providers)) {
    return undefined;
  }
  const provider = providers.find(p => p?.id === ref.providerID);
  return provider?.models?.[ref.id]?.limit?.context;
}

/**
 * Read a value that may be a plain value or a zero-argument accessor.
 *
 * The probed surface is mixed — `state.path()` and `state.vcs()` are functions,
 * `state.provider` and `route.current` are values — and a Solid store commonly
 * exposes both shapes for the same thing. One reader means a wrong guess about
 * which is which costs a segment rather than the frame.
 */
function read<T>(source: unknown): T | undefined {
  if (typeof source === "function") {
    return (source as () => T | undefined)();
  }
  return source === null ? undefined : (source as T | undefined);
}

/** Call a one-argument accessor, if it is one. */
function call<T>(fn: unknown, arg: string): T | undefined {
  return typeof fn === "function"
    ? (fn as (a: string) => T | undefined)(arg)
    : undefined;
}

// ---------------------------------------------------------------------------
// Formatting — ported from `tools/statusline/statusline`, so both bars round
// and abbreviate the same way.
// ---------------------------------------------------------------------------

function humanTokens(n: number): string {
  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  }
  return n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);
}

function humanDuration(ms: number): string {
  let s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  if (h > 0) {
    return `${h}hr ${m}m`;
  }
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Epoch seconds, epoch millis or an ISO string — the unit was not verifiable. */
function epochMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** No `node:path` import: this runs per frame and needs nothing from Node. */
function basename(path: string): string {
  const parts = path.split("/").filter(part => part.length > 0);
  return parts[parts.length - 1] ?? path;
}
