/**
 * The MemPalace auto-save module that ships to OpenCode.
 *
 * Driven through `server()` — its only export — rather than through the helpers
 * it used to expose. That is not a testing preference: OpenCode's legacy loader
 * iterates `Object.values(mod)` and calls **every** export as a plugin, so a
 * helper exported for a unit test would be invoked with the plugin context and
 * its return value pushed into the hooks array. Upstream's source says it
 * outright — "extra test helpers cannot exist alongside plugin exports".
 *
 * Loaded by path rather than by specifier: `templates/` is outside this
 * package's `rootDir`, so a static import fails `tsc -p renderer` even though
 * vitest resolves it. The module is type-checked in its own right by
 * `templates/tsconfig.json`. And it is tested from here at all because
 * `vitest.config.mts` collects only `{schema,renderer,cli}/src/**\/*.test.ts` — a
 * test file beside the module would be silently never run.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

interface Hooks {
  event: (input: { event: unknown; }) => Promise<void>;
}

const plugin = await import(
  pathToFileURL(
    join(
      import.meta.dirname,
      "..",
      "..",
      "templates",
      "vwf",
      "opencode-plugin",
      "mempalace-autosave.ts",
    ),
  )
    .href
) as {
  default: { server: (input: { serverUrl: string; }) => Promise<Hooks>; };
};

const SERVER = "http://127.0.0.1:4096/";

/** One user message carrying a single text part. */
function user(text: string) {
  return { info: { role: "user" }, parts: [{ type: "text", text }] };
}

function conversation(count: number) {
  return Array.from({ length: count }, (_, i) => user(`message ${i}`));
}

interface Injected {
  readonly sessionID: string;
  readonly text: string;
}

/**
 * Stand in for OpenCode's server: GET returns the scripted conversation, POST
 * records what the plugin tried to inject.
 */
function stubServer(messages: () => unknown[], { ok = true } = {}) {
  const injected: Injected[] = [];

  globalThis.fetch = (async (url: URL | string, init?: RequestInit) => {
    const path = String(url);
    const sessionID = path.split("/session/")[1]?.split("/")[0] ?? "";

    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as {
        parts: { text: string; }[];
      };
      injected.push({ sessionID, text: body.parts[0]?.text ?? "" });
      return { ok: true, json: async () => ({}) };
    }
    return { ok, json: async () => messages() };
  }) as typeof fetch;

  return injected;
}

const idle = (sessionID: string) => ({
  event: { type: "session.idle", properties: { sessionID } },
});

const realFetch = globalThis.fetch;

beforeEach(() => {
  // The module consults the real environment for the opt-out; pin it on so a
  // developer with auto-save disabled does not get a silently passing suite.
  process.env["MEMPALACE_HOOKS_AUTO_SAVE"] = "true";
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env["MEMPALACE_HOOKS_AUTO_SAVE"];
});

describe("mempalace auto-save", () => {
  it("stays quiet until the interval is reached", async () => {
    const injected = stubServer(() => conversation(14));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));

    expect(injected).toEqual([]);
  });

  it("asks for a save on the fifteenth message", async () => {
    const injected = stubServer(() => conversation(15));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));

    expect(injected).toHaveLength(1);
    expect(injected[0]?.text).toContain("MemPalace save checkpoint");
    expect(injected[0]?.sessionID).toBe("s1");
  });

  it("does not save twice off the idle that follows its own prompt", async () => {
    // The injected prompt is itself a user message, so an idle fires again
    // immediately. Without the marker check this saved on every single idle.
    let messages = conversation(15);
    const injected = stubServer(() => messages);
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));
    messages = [...messages, user(injected[0]?.text ?? "")];
    await hooks.event(idle("s1"));

    expect(injected).toHaveLength(1);
  });

  it("saves again only after another full interval", async () => {
    let messages = conversation(15);
    const injected = stubServer(() => messages);
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));
    messages = [...messages, user("the injected prompt"), ...conversation(14)];
    await hooks.event(idle("s1"));
    expect(injected).toHaveLength(1);

    messages = [...messages, ...conversation(1)];
    await hooks.event(idle("s1"));
    expect(injected).toHaveLength(2);
  });

  it("tracks each session separately", async () => {
    const injected = stubServer(() => conversation(15));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));
    await hooks.event(idle("s2"));

    expect(injected.map(i => i.sessionID)).toEqual(["s1", "s2"]);
  });

  it("always saves after a compaction, whatever the count", async () => {
    const injected = stubServer(() => conversation(2));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event({
      event: { type: "session.compacted", properties: { sessionID: "s1" } },
    });

    expect(injected).toHaveLength(1);
    expect(injected[0]?.text).toContain("was just compacted");
  });

  it("reads the session id from either shape the bus uses", async () => {
    const injected = stubServer(() => conversation(15));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event({
      event: { type: "session.idle", properties: { info: { id: "s9" } } },
    });

    expect(injected[0]?.sessionID).toBe("s9");
  });

  it("ignores an event carrying no session id", async () => {
    const injected = stubServer(() => conversation(15));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event({ event: { type: "session.idle", properties: {} } });

    expect(injected).toEqual([]);
  });

  it("stays silent when the server will not answer", async () => {
    const injected = stubServer(() => conversation(15), { ok: false });
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));

    expect(injected).toEqual([]);
  });

  it("honours the opt-out", async () => {
    process.env["MEMPALACE_HOOKS_AUTO_SAVE"] = "false";
    const injected = stubServer(() => conversation(50));
    const hooks = await plugin.default.server({ serverUrl: SERVER });

    await hooks.event(idle("s1"));

    expect(injected).toEqual([]);
  });

  it("exports nothing but the plugin", async () => {
    // Every extra export would be called as a plugin by OpenCode's legacy
    // loader. This is the assertion that stops one being added back.
    const module = plugin as unknown as Record<string, unknown>;
    expect(Object.keys(module)).toEqual(["default"]);
    expect(Object.keys(module["default"] as object)).toEqual(["server"]);
  });
});
