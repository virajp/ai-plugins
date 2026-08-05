/**
 * One-shot migration: `plugins/` (Claude-shaped, hand-authored) → `templates/`
 * (neutral, Eta-templated).
 *
 * Run once, then deleted along with `plugins/`. It is kept in the tree until
 * then so the migration is reviewable and re-runnable rather than a pile of
 * hand edits across 51 skills and 16 agents.
 *
 * Idempotent: running it twice produces the same `templates/` tree, because it
 * always reads from `plugins/` and overwrites its output.
 */
import {
  frontmatter as fm,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { globSync } from "node:fs";
import {
  basename,
  dirname,
  join,
} from "node:path";
import { stringify as toYaml } from "yaml";

interface MarketplaceEntry {
  name: string;
  version?: string;
  description?: string;
  category?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
  author?: { name: string; email?: string; };
  strict?: boolean;
  source: string | { source: string; url: string; };
  dependencies?: Array<{ marketplace: string; name: string; }>;
}

/** Runtime binaries each plugin needs, mirrored from the installer's constants. */
const REQUIRES: Record<string, string[]> = {
  vwf: ["rtk", "graphify", "mise", "pnpm", "uv"],
  typescript: ["mise", "pnpm"],
  effect: ["mise", "pnpm"], // via its typescript dependency
  stitch: ["pnpm"],
  context7: ["pnpm"],
  flutter: ["mise", "kotlin-lsp", "sourcekit-lsp"],
  mempalace: ["uv", "mise"], // mise: the OpenCode target launches its MCP via `mise x`
  mise: ["mise"],
  "github-actions": ["mise"],
};

const PROJECT_SCOPED = new Set(["flutter"]);
const OPT_IN = new Set([
  "andrej-karpathy-skills",
  "lovable",
  "stitch",
  "gcp",
  "effect",
]);
const USER_ONLY = new Set(["mempalace"]);

export function migrate(repoRoot: string): void {
  const pluginsDir = join(repoRoot, "plugins");
  const templatesDir = join(repoRoot, "templates");
  const marketplace = JSON.parse(
    readFileSync(join(repoRoot, ".claude-plugin", "marketplace.json"), "utf8"),
  ) as {
    name: string;
    displayName?: string;
    description?: string;
    owner: { name: string; };
    forceRemoveDeletedPlugins?: boolean;
    plugins: MarketplaceEntry[];
  };

  rmSync(templatesDir, { recursive: true, force: true });
  mkdirSync(templatesDir, { recursive: true });

  writeFileSync(
    join(templatesDir, "marketplace.yaml"),
    toYaml({
      name: marketplace.name,
      displayName: marketplace.displayName,
      description: marketplace.description,
      owner: marketplace.owner,
      forceRemoveDeletedPlugins: marketplace.forceRemoveDeletedPlugins ?? false,
    }),
  );

  const entries = new Map(marketplace.plugins.map(p => [p.name, p]));

  for (const entry of marketplace.plugins) {
    const local = typeof entry.source === "string";
    const out = join(templatesDir, entry.name);
    mkdirSync(out, { recursive: true });
    writeFileSync(
      join(out, "plugin.yaml"),
      toYaml(manifestFor(entry, local, pluginsDir)),
    );

    // url-sourced plugins (mempalace, andrej-karpathy-skills) are re-listed,
    // not authored here — there is no local tree to migrate.
    if (!local) {
      continue;
    }

    migrateTree(join(pluginsDir, entry.name), out, entry.name, entries);
  }
}

function manifestFor(
  entry: MarketplaceEntry,
  local: boolean,
  pluginsDir: string,
) {
  const manifest: Record<string, unknown> = { name: entry.name };

  if (entry.version) {
    manifest["version"] = entry.version;
  }
  if (entry.description) {
    manifest["description"] = entry.description;
  }
  manifest["category"] = entry.category ?? "development";
  if (entry.tags?.length) {
    manifest["tags"] = entry.tags;
  }
  if (entry.homepage) {
    manifest["homepage"] = entry.homepage;
  }
  if (entry.repository) {
    manifest["repository"] = entry.repository;
  }
  if (entry.author) {
    manifest["author"] = entry.author;
  }
  if (entry.strict !== undefined) {
    manifest["strict"] = entry.strict;
  }

  manifest["source"] = typeof entry.source === "string"
    ? { kind: "local" }
    : { kind: "url", url: entry.source.url };

  if (entry.dependencies?.length) {
    manifest["dependencies"] = entry.dependencies.map(d => d.name);
  }

  if (PROJECT_SCOPED.has(entry.name)) {
    manifest["scope"] = "project";
  }
  if (OPT_IN.has(entry.name)) {
    manifest["optIn"] = true;
  }
  if (USER_ONLY.has(entry.name)) {
    manifest["userOnly"] = true;
  }
  if (REQUIRES[entry.name]) {
    manifest["requires"] = REQUIRES[entry.name];
  }

  if (local) {
    const claude = JSON.parse(
      readFileSync(
        join(pluginsDir, entry.name, ".claude-plugin", "plugin.json"),
        "utf8",
      ),
    ) as {
      mcpServers?: Record<string, McpJson>;
      lspServers?: Record<string, LspJson>;
    };

    if (claude.mcpServers) {
      manifest["mcpServers"] = mapMcp(claude.mcpServers);
    }
    if (claude.lspServers) {
      manifest["lspServers"] = mapLsp(claude.lspServers);
    }
  }

  return manifest;
}

interface McpJson {
  type?: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

function mapMcp(servers: Record<string, McpJson>) {
  const out: Record<string, unknown> = {};
  for (const [id, s] of Object.entries(servers)) {
    out[id] = s.type === "http" || s.url !== undefined
      ? {
        transport: "http",
        url: s.url,
        ...(s.headers ? { headers: s.headers } : {}),
      }
      : {
        transport: "stdio",
        command: s.command,
        args: s.args ?? [],
        ...(s.env ? { env: s.env } : {}),
      };
  }
  return out;
}

interface LspJson {
  command: string;
  args?: string[];
  extensionToLanguage: Record<string, string>;
  startupTimeout?: number;
}

/**
 * OpenCode keys LSP config by its own built-in server ids, so the mapping the
 * installer holds as `LSP_ID_MAP` moves into the manifest where the server is
 * declared. Verified against `codex-rs`-independent OpenCode source: the ids
 * `typescript`, `dart`, `kotlin-ls` and `sourcekit-lsp` all exist verbatim.
 */
const OPENCODE_LSP_IDS: Record<string, string> = {
  "typescript-lsp": "typescript",
  "dart-lsp": "dart",
  "kotlin-lsp": "kotlin-ls",
  "sourcekit-lsp": "sourcekit-lsp",
};

function mapLsp(servers: Record<string, LspJson>) {
  const out: Record<string, unknown> = {};
  for (const [id, s] of Object.entries(servers)) {
    const alias = OPENCODE_LSP_IDS[id];
    out[id] = {
      command: s.command,
      args: s.args ?? [],
      extensions: s.extensionToLanguage,
      ...(s.startupTimeout ? { startupTimeout: s.startupTimeout } : {}),
      ...(alias ? { idAliases: { opencode: alias } } : {}),
    };
  }
  return out;
}

function migrateTree(
  from: string,
  to: string,
  pluginName: string,
  entries: Map<string, MarketplaceEntry>,
): void {
  for (const relative of globSync("**/*", { cwd: from, withFileTypes: true })) {
    if (!relative.isFile()) {
      continue;
    }
    const path = join(relative.parentPath, relative.name).slice(
      from.length + 1,
    );

    // The Claude manifest is fully absorbed into plugin.yaml.
    if (path.startsWith(".claude-plugin/")) {
      continue;
    }
    // hooks.json becomes the neutral hooks.yaml, written separately below.
    if (path === "hooks/hooks.json") {
      continue;
    }

    const source = join(from, path);
    const target = join(to, path);
    mkdirSync(dirname(target), { recursive: true });

    if (path.endsWith(".md")) {
      writeFileSync(
        target,
        templatize(readFileSync(source, "utf8"), path, entries),
      );
    }
    else {
      cpSync(source, target);
      // Hook scripts are unusable without the executable bit, and the checker
      // asserts it.
      if (path.startsWith("hooks/")) {
        chmodSync(target, 0o755);
      }
    }
  }

  const hooksJson = join(from, "hooks", "hooks.json");
  if (globSync("hooks/hooks.json", { cwd: from }).length > 0) {
    writeFileSync(
      join(to, "hooks", "hooks.yaml"),
      toYaml(neutralHooks(hooksJson)),
      "utf8",
    );
  }

  for (const path of globSync("skills/*/SKILL.md", { cwd: to })) {
    rewriteSkillFrontmatter(join(to, path));
  }
  for (const path of globSync("agents/*.md", { cwd: to })) {
    void pluginName;
    rewriteAgentFrontmatter(join(to, path));
  }
}

/**
 * Rewrite Claude-specific spellings into Eta helpers so each renderer can
 * substitute its own.
 *
 * This deliberately covers the **whole document, frontmatter included**. A
 * skill's `description` is what the model reads to decide whether to delegate,
 * and 54 of them name a sibling command — left as `/vwf:plan` they would point
 * at a command that does not exist on OpenCode or Cursor. Renderers therefore
 * run Eta over the raw file *before* parsing frontmatter.
 */
function templatize(
  source: string,
  _path: string,
  entries: Map<string, MarketplaceEntry>,
): string {
  let out = source;

  // Cross-plugin asset refs must resolve to the *sibling's* install root, which
  // differs per target — `../vwf` is only meaningful under Claude's layout.
  out = out.replace(
    /\$\{CLAUDE_PLUGIN_ROOT\}\/\.\.\/([a-z0-9-]+)/g,
    (_m, plugin: string) => `<%= it.pluginRoot(${JSON.stringify(plugin)}) %>`,
  );
  out = out.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "<%= it.root %>");

  // Slash-command references. Only rewrite plugins that actually exist, so
  // prose like `/code-review` and `/security-review` — Claude built-ins this
  // repo does not own — is left alone.
  out = out.replace(
    /\/([a-z0-9-]+):([a-z0-9-]+)\b/g,
    (match, plugin: string, skill: string) =>
      entries.has(plugin)
        ? `<%= it.cmd(${JSON.stringify(`${plugin}:${skill}`)}) %>`
        : match,
  );

  return out;
}

/** Rewrite a migrated SKILL.md's frontmatter into the neutral spelling. */
function rewriteSkillFrontmatter(absolute: string): void {
  const doc = fm.parse(readFileSync(absolute, "utf8"))!;
  const meta = skillFromFrontmatter(doc);

  let out = doc;
  // `invocation` takes the position of whichever legacy key it replaces, so the
  // rendered key order matches the source and the byte-parity gate holds.
  const anchor = doc.entries.find(
    e => e.key === "user-invocable" || e.key === "disable-model-invocation",
  );
  if (anchor) {
    out = fm.rename(out, anchor.key, "invocation");
    out = fm.set(out, "invocation", ` ${meta.invocation}`);
  }
  else {
    out = fm.set(out, "invocation", ` ${meta.invocation}`);
  }
  out = fm.omit(out, "user-invocable", "disable-model-invocation");
  out = fm.rename(out, "allowed-tools", "tools");
  out = fm.rename(out, "argument-hint", "argumentHint");

  // `tools` keeps its authored text rather than being normalised to a list.
  // The semantic reader already accepts space- and comma-separated scalars, and
  // the raw form is what lets the Claude renderer reproduce the source
  // byte-for-byte — several agents fold a long tool list across lines, and any
  // re-serialisation loses that wrapping.
  writeFileSync(absolute, fm.emit(out));
}

function rewriteAgentFrontmatter(_absolute: string): void {
  // Agent frontmatter is already neutral in shape — name, description, tools,
  // model, effort — and `tools` keeps its authored text for the same reason
  // skills do. Nothing to rewrite; the body was templatised by `templatize`.
}

interface ClaudeHookEntry {
  matcher?: string;
  hooks: Array<
    { type: string; command: string; timeout?: number; async?: boolean; }
  >;
}

/** Translate Claude's hooks.json into the neutral, intent-declaring form. */
function neutralHooks(hooksJsonPath: string) {
  const raw = JSON.parse(readFileSync(hooksJsonPath, "utf8")) as {
    hooks: Record<string, ClaudeHookEntry[]>;
  };

  const hooks: unknown[] = [];
  for (const [event, groups] of Object.entries(raw.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        const scriptRef = /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/(.+)$/.exec(
          hook.command,
        );
        const script = scriptRef?.[1];

        hooks.push({
          id: script ? basename(script, ".sh") : "rtk",
          event: event.charAt(0).toLowerCase() + event.slice(1),
          ...(group.matcher ? { matcher: group.matcher } : {}),
          // The npm normalizer rewrites the command; the rtk bridge only
          // observes, and is guarded so a missing binary never blocks a call.
          action: script ? "rewrite" : "observe",
          ...(script ? { script } : { command: hook.command }),
          ...(script
            ? {
              correction:
                "This repo uses pnpm or bun, never npm. Reissue the command with the repo's package manager.",
            }
            : {}),
          ...(hook.timeout ? { timeout: hook.timeout } : {}),
          ...(hook.async !== undefined ? { async: hook.async } : {}),
        });
      }
    }
  }

  return { hooks };
}
