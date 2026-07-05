/**
 * OpenCode support for the CLI: installs the marketplace plugins' skills (and
 * their assets) into OpenCode's config, since OpenCode has no plugin/marketplace
 * concept — skills are directories on disk. Sibling of ClaudeCode (claude.mjs),
 * exposing the same tool surface the entrypoint dispatches to:
 *
 *   resolvePlan(flags)      → a plan {plugins}
 *   hasSelection(plan)      → was anything selected to act on?
 *   install(plan, flags)    → render + install the selected plugins
 *   upgrade()               → re-render every installed plugin from source
 *   uninstall(plan)         → remove what this CLI installed
 *   printVersions()         → report installed vs latest
 *
 * What an install does, per selected plugin:
 *  - fetches the repo source (GitHub main tarball, or $AI_PLUGINS_SOURCE_DIR —
 *    a local checkout — for tests/dev),
 *  - copies the plugin's `skills/` + `assets/` into
 *    `<configDir>/virajp-plugins/<plugin>/` (agents/ and hooks/ are Claude-only and
 *    skipped), rewriting every `${CLAUDE_PLUGIN_ROOT}` to that installed
 *    absolute path, and stamping `.version` from the source marketplace.json;
 *    user-invoked workflow skills (`disable-model-invocation: true`) are moved
 *    to `commands/<name>.md` so OpenCode's skill discovery (`**\/SKILL.md`)
 *    never lists them to the model — mirroring Claude's user-only semantics —
 *    while their command wrappers still reach them by path,
 *  - appends `<configDir>/virajp-plugins` to `skills.paths` in the OpenCode
 *    config (OpenCode discovers `**\/SKILL.md` recursively under it),
 *  - writes a command wrapper `<configDir>/command/<plugin>-<skill>.md` for each
 *    skill with `disable-model-invocation: true` (a former slash command) —
 *    OpenCode has no user-invoked skills, so the wrapper restores `/…`
 *    invocation,
 *  - maps the plugin's `lspServers` (if any) onto OpenCode `lsp` entries,
 *    overriding the matching built-in ids with our mise-provisioned launchers,
 *  - for context7, adds the MCP server to the config's `mcp` key.
 *
 * Plugin dependencies are expanded at plan time (PLUGIN_DEPS — Claude Code
 * auto-installs these itself), skipping url-sourced ones, and a vwf install
 * wires graphify for the opencode platform.
 *
 * Config edits target `opencode.jsonc` (preferred — OpenCode merges all config
 * filenames and jsonc wins), falling back to an existing `opencode.json`; a
 * config containing comments is only rewritten after confirmation (or --yes),
 * since a JSON re-serialize drops them.
 *
 * `--user` targets the global config (~/.config/opencode), `--project` the
 * repo-local `.opencode/`. url-sourced marketplace entries (mempalace,
 * andrej-karpathy-skills) are not authored in this repo and cannot be rendered.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  homedir,
  tmpdir,
} from "node:os";
import {
  dirname,
  join,
} from "node:path";

import {
  DEP_HINTS,
  PLUGIN_DEPS,
  PLUGIN_EXTRA_DEPS,
  PLUGINS,
  REMOTE_MARKETPLACE_URL,
  setupGraphify,
  USER_SCOPED,
} from "./claude.mjs";
import {
  confirm,
  fetchJson,
  green,
  hasBin,
  isObject,
  red,
  step,
  updateNote,
  yellow,
} from "./utils.mjs";

// The repo source rendered into OpenCode's config. AI_PLUGINS_SOURCE_DIR (a
// local checkout) overrides the network fetch — used by tests and local dev.
const REPO_TARBALL_URL =
  "https://codeload.github.com/virajp/ai-plugins/tar.gz/refs/heads/main";
const SOURCE_DIR_ENV = "AI_PLUGINS_SOURCE_DIR";

// Marketplace entries with a `url` source live in their own upstream repos —
// there is nothing here to render for OpenCode. Keep in sync with
// .claude-plugin/marketplace.json.
const URL_SOURCED = new Set(["mempalace", "andrej-karpathy-skills"]);

// Global vs project config dirs (docs: opencode.ai/docs/config). The
// `skills.paths` entry written into each config uses a portable spelling:
// `~/…` for the global config, a project-relative path for `.opencode/`.
// The directory the rendered plugins live under inside each OpenCode config
// dir — named after the marketplace, mirroring where the plugins come from.
const BUNDLE_DIR = "virajp-plugins";

const GLOBAL_DIR = join(homedir(), ".config", "opencode");
const PROJECT_DIR = join(process.cwd(), ".opencode");
const configDirFor = scope => (scope === "project" ? PROJECT_DIR : GLOBAL_DIR);
const skillsPathFor = scope =>
  scope === "project"
    ? `.opencode/${BUNDLE_DIR}`
    : `~/.config/opencode/${BUNDLE_DIR}`;

const OPENCODE_SCHEMA_URL = "https://opencode.ai/config.json";

// OpenCode merges every config filename in a dir, with `opencode.jsonc` winning
// over `opencode.json` (over `config.json`) on conflicting keys — so edits go
// to an existing jsonc first, an existing json next, and a NEW file is created
// as jsonc. All names accept JSONC syntax.
const CONFIG_FILES = ["opencode.jsonc", "opencode.json"];

// Claude `lspServers` ids → OpenCode built-in server ids. Writing under the
// built-in id replaces its launcher with the plugin's (mise-provisioned, no
// SDK on PATH needed) instead of running two servers per language.
const LSP_ID_MAP = {
  "typescript-lsp": "typescript",
  "dart-lsp": "dart",
  "kotlin-lsp": "kotlin-ls",
  "sourcekit-lsp": "sourcekit-lsp",
};

// Same per-plugin runtime tools as the Claude path; the core dep differs — the
// install mechanism here is rendering files, gated only on `opencode` itself
// (and `tar` when fetching the source tarball).
const CORE_DEPS = ["opencode"];

// ${CLAUDE_PLUGIN_ROOT} in plugin markdown means "this plugin's root". Claude
// Code expands it at runtime; for OpenCode we expand it at install time to the
// rendered plugin dir.
const PLUGIN_ROOT_RE = /\$\{CLAUDE_PLUGIN_ROOT\}/g;

// Minimal frontmatter reader: top-level `key: value` scalars only — enough for
// the fields this module needs (name, description, argument-hint,
// disable-model-invocation).
function frontmatter(text) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text);
  if (!m) {
    return {};
  }
  const fm = {};
  let key = null;
  for (const line of m[1].split("\n")) {
    const km = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (km) {
      key = km[1];
      fm[key] = km[2].trim();
    }
    else if (key && /^\s/.test(line)) {
      fm[key] += ` ${line.trim()}`;
    }
  }
  return fm;
}

const stripQuotes = v => (v || "").replace(/^["']|["']$/g, "");

// Parse JSONC: strip // and /* */ comments and trailing commas (string-aware —
// a URL like "https://…" is not a comment), then JSON.parse. Returns the data
// plus whether comments were present, so callers can warn before a rewrite
// that would drop them.
function parseJsonc(raw) {
  let stripped = "";
  let hadComments = false;
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inString) {
      stripped += c;
      if (c === "\\") {
        stripped += raw[++i] ?? "";
        continue;
      }
      if (c === "\"") {
        inString = false;
      }
      continue;
    }
    if (c === "\"") {
      inString = true;
      stripped += c;
      continue;
    }
    if (c === "/" && raw[i + 1] === "/") {
      hadComments = true;
      while (i < raw.length && raw[i] !== "\n") {
        i++;
      }
      stripped += "\n";
      continue;
    }
    if (c === "/" && raw[i + 1] === "*") {
      hadComments = true;
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) {
        i++;
      }
      i++;
      continue;
    }
    stripped += c;
  }
  // Drop trailing commas (`, }` / `, ]`), again string-aware.
  let out = "";
  inString = false;
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    if (inString) {
      out += c;
      if (c === "\\") {
        out += stripped[++i] ?? "";
        continue;
      }
      if (c === "\"") {
        inString = false;
      }
      continue;
    }
    if (c === "\"") {
      inString = true;
      out += c;
      continue;
    }
    if (c === ",") {
      let j = i + 1;
      while (j < stripped.length && /\s/.test(stripped[j])) {
        j++;
      }
      if (stripped[j] === "}" || stripped[j] === "]") {
        continue; // skip the trailing comma
      }
    }
    out += c;
  }
  return { data: JSON.parse(out), hadComments };
}

// A plugin's Claude `lspServers` mapped to OpenCode `lsp` entries (null when
// the plugin ships none).
function lspEntriesFor(pluginJson) {
  const servers = pluginJson.lspServers;
  if (!isObject(servers)) {
    return null;
  }
  const out = {};
  for (const [id, def] of Object.entries(servers)) {
    out[LSP_ID_MAP[id] || id] = {
      command: [def.command, ...(def.args || [])],
      extensions: Object.keys(def.extensionToLanguage || {}),
    };
  }
  return Object.keys(out).length ? out : null;
}

class OpenCode {
  // `io` is the oclif command — provides log(), error(), exit(), and config.
  constructor(io) {
    this.io = io;
    this.sourceRoot = null; // resolved lazily, once per run
    this.tmpRoot = null;
  }

  hasSelection(plan) {
    return Boolean(plan.plugins.length);
  }

  // Same selection semantics as the Claude path (--all → user-scoped set at
  // user scope; --user/--project name plugins), except: url-sourced plugins are
  // filtered from --all (with a note) and rejected when named — their files
  // live upstream, not here. --statusline is Claude-only and ignored here.
  resolvePlan(flags) {
    let plugins;
    if (flags.all) {
      const skipped = USER_SCOPED.filter(name => URL_SOURCED.has(name));
      if (skipped.length) {
        this.io.log(
          yellow(
            `Note: url-sourced plugins (${
              skipped.join(", ")
            }) are not installable for OpenCode — their files live upstream.`,
          ),
        );
      }
      plugins = USER_SCOPED.filter(name => !URL_SOURCED.has(name)).map(
        name => ({ name, scope: "user" }),
      );
    }
    else {
      const named = [
        ...(flags.user ?? []).map(name => ({ name, scope: "user" })),
        ...(flags.project ?? []).map(name => ({ name, scope: "project" })),
      ];
      const invalid = named.filter(p => !PLUGINS.includes(p.name)).map(p =>
        p.name
      );
      if (invalid.length) {
        this.io.error(
          `Unknown plugin(s): ${[...new Set(invalid)].join(", ")}. Valid: ${
            PLUGINS.join(", ")
          }`,
        );
      }
      const urlSourced = named.filter(p => URL_SOURCED.has(p.name)).map(p =>
        p.name
      );
      if (urlSourced.length) {
        this.io.error(
          `Not installable for OpenCode: ${
            [...new Set(urlSourced)].join(", ")
          } — url-sourced plugins live in their upstream repos, not in ${"virajp/ai-plugins"}.`,
        );
      }
      const both = (flags.user ?? []).filter(n =>
        (flags.project ?? []).includes(n)
      );
      if (both.length) {
        this.io.error(
          `Cannot install at both --user and --project: ${
            [...new Set(both)].join(", ")
          }`,
        );
      }
      const seen = new Set();
      plugins = named.filter(p => !seen.has(p.name) && seen.add(p.name));

      // Expand plugin dependencies at the same scope (Claude Code auto-installs
      // them; here they are part of the plan). Installs only — uninstall never
      // removes a dependency you didn't name, matching Claude Code. url-sourced
      // deps live upstream — noted, not rendered.
      for (const { name, scope } of flags.uninstall ? [] : [...plugins]) {
        const added = [];
        const skipped = [];
        for (const dep of PLUGIN_DEPS[name] || []) {
          if (seen.has(dep)) {
            continue;
          }
          if (URL_SOURCED.has(dep)) {
            skipped.push(dep);
            continue;
          }
          seen.add(dep);
          plugins.push({ name: dep, scope });
          added.push(dep);
        }
        if (added.length || skipped.length) {
          this.io.log(
            yellow(
              `${name} dependencies: ${
                added.length ? `installing ${added.join(", ")}` : ""
              }${added.length && skipped.length ? "; " : ""}${
                skipped.length
                  ? `${
                    skipped.join(", ")
                  } lives upstream — not installable for OpenCode`
                  : ""
              }.`,
            ),
          );
        }
      }
    }
    // `yes` rides in the plan: config rewrites that would drop JSONC comments
    // prompt unless it is set.
    return { plugins, yes: Boolean(flags.yes) };
  }

  // Verify every tool the plan needs is on PATH — mirrors ClaudeCode.checkDeps.
  checkDeps(plan) {
    const tools = new Set(plan.plugins.length ? CORE_DEPS : []);
    if (plan.plugins.length && !process.env[SOURCE_DIR_ENV]) {
      tools.add("tar"); // extracts the fetched source tarball
    }
    for (const p of plan.plugins) {
      for (const d of PLUGIN_EXTRA_DEPS[p.name] || []) {
        tools.add(d);
      }
    }
    const missing = [...tools].filter(t => !hasBin(t));
    if (!missing.length) {
      return;
    }
    this.io.log(
      red("\nMissing required dependencies — install these, then re-run:\n"),
    );
    for (const t of missing) {
      this.io.log(`  ${yellow(t)}`);
      this.io.log(`    ${DEP_HINTS[t] || "see project docs"}`);
    }
    this.io.exit(1);
  }

  // (Takes no flags — the second argument the entrypoint passes is unused here.)
  async install(plan) {
    this.checkDeps(plan);
    const source = await this.resolveSource();
    const touched = new Set();
    try {
      for (const { name, scope } of plan.plugins) {
        await this.renderPlugin(source, name, scope);
        touched.add(scope);
      }
      for (const scope of touched) {
        await this.updateConfig(
          scope,
          plan.plugins.filter(p => p.scope === scope).map(p => p.name),
          plan.yes,
        );
      }
    }
    finally {
      await this.cleanupSource();
    }
    if (plan.plugins.some(p => p.name === "vwf")) {
      setupGraphify(this.io, "opencode");
    }
    this.io.log(green("\nRestart OpenCode to load the skills."));
    return { marketplaceRefreshed: false, graphifyConfigured: false };
  }

  // Re-render every plugin present under each config dir from the current
  // source. Versions are compared via the stamped .version files.
  async upgrade() {
    const found = [];
    for (const scope of ["user", "project"]) {
      const root = join(configDirFor(scope), BUNDLE_DIR);
      if (!existsSync(root)) {
        continue;
      }
      for (const entry of await readdir(root, { withFileTypes: true })) {
        if (entry.isDirectory() && PLUGINS.includes(entry.name)) {
          found.push({ name: entry.name, scope });
        }
      }
    }
    if (!found.length) {
      this.io.log(
        yellow(
          "No virajp-plugins skills are installed for OpenCode — nothing to upgrade.",
        ),
      );
      return;
    }
    const source = await this.resolveSource();
    try {
      for (const { name, scope } of found) {
        const stamp = join(
          configDirFor(scope),
          BUNDLE_DIR,
          name,
          ".version",
        );
        const before = existsSync(stamp)
          ? (await readFile(stamp, "utf8")).trim()
          : "?";
        await this.renderPlugin(source, name, scope);
        const after = (await readFile(stamp, "utf8")).trim();
        this.io.log(
          before === after
            ? green(`${name} (${scope}) is up to date (${after}).`)
            : green(`${name} (${scope}) updated ${before} → ${after}.`),
        );
      }
    }
    finally {
      await this.cleanupSource();
    }
    // Re-assert graphify's opencode wiring (idempotent), mirroring the Claude
    // upgrade path.
    if (found.some(p => p.name === "vwf")) {
      setupGraphify(this.io, "opencode");
    }
    this.io.log(green("\nRestart OpenCode to load the refreshed skills."));
  }

  async uninstall(plan) {
    const touched = new Set();
    const lspByScope = new Map(); // scope → the lsp entries those plugins wrote
    for (const { name, scope } of plan.plugins) {
      const configDir = configDirFor(scope);
      const dest = join(configDir, BUNDLE_DIR, name);
      const lspStamp = join(dest, ".lsp.json");
      if (existsSync(lspStamp)) {
        const acc = lspByScope.get(scope) ?? {};
        Object.assign(acc, JSON.parse(await readFile(lspStamp, "utf8")));
        lspByScope.set(scope, acc);
      }
      if (existsSync(dest)) {
        await step(
          this.io,
          `Removing ${name} (${scope})`,
          () => rm(dest, { recursive: true, force: true }),
        );
      }
      // Its command wrappers.
      const cmdDir = join(configDir, "command");
      if (existsSync(cmdDir)) {
        for (const f of await readdir(cmdDir)) {
          if (f.startsWith(`${name}-`) && f.endsWith(".md")) {
            await rm(join(cmdDir, f), { force: true });
          }
        }
      }
      touched.add(scope);
    }
    for (const scope of touched) {
      await this.pruneConfig(
        scope,
        plan.plugins.filter(p => p.scope === scope).map(p => p.name),
        lspByScope.get(scope) ?? {},
        plan.yes,
      );
    }
  }

  // .version stamps vs the latest in the remote marketplace manifest.
  async printVersions() {
    let latest;
    try {
      latest = await fetchJson(REMOTE_MARKETPLACE_URL);
    }
    catch (e) {
      this.io.error(`Version check failed (network): ${e.message}`);
    }
    const latestByName = {};
    for (const p of latest.plugins || []) {
      latestByName[p.name] = p.version || null;
    }
    this.io.log("\nOpenCode skills (virajp-plugins):");
    let any = false;
    for (const scope of ["user", "project"]) {
      const root = join(configDirFor(scope), BUNDLE_DIR);
      if (!existsSync(root)) {
        continue;
      }
      for (const entry of await readdir(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
          continue;
        }
        any = true;
        const stamp = join(root, entry.name, ".version");
        const installed = existsSync(stamp)
          ? (await readFile(stamp, "utf8")).trim()
          : "?";
        const want = latestByName[entry.name];
        this.io.log(
          `  ${`${entry.name} (${scope})`.padEnd(20)} ${installed}${
            want ? updateNote(installed, want) : ""
          }`,
        );
      }
    }
    if (!any) {
      this.io.log(yellow("  none installed"));
    }
  }

  // ── source resolution ────────────────────────────────────────────────────

  // A directory containing the repo (with plugins/ + .claude-plugin/): the
  // AI_PLUGINS_SOURCE_DIR override, or the fetched+extracted main tarball.
  async resolveSource() {
    if (this.sourceRoot) {
      return this.sourceRoot;
    }
    const override = process.env[SOURCE_DIR_ENV];
    if (override) {
      if (!existsSync(join(override, "plugins"))) {
        this.io.error(
          `$${SOURCE_DIR_ENV} (${override}) has no plugins/ directory.`,
        );
      }
      this.sourceRoot = override;
      return this.sourceRoot;
    }
    await step(this.io, "Fetching plugin source (github: main)", async () => {
      this.tmpRoot = await mkdtemp(join(tmpdir(), "ai-plugins-"));
      const res = await fetch(REPO_TARBALL_URL);
      if (!res.ok) {
        throw new Error(`GET ${REPO_TARBALL_URL} → HTTP ${res.status}`);
      }
      const tarball = join(this.tmpRoot, "source.tar.gz");
      await writeFile(tarball, Buffer.from(await res.arrayBuffer()));
      const tar = spawnSync("tar", ["-xzf", tarball, "-C", this.tmpRoot], {
        encoding: "utf8",
      });
      if (tar.status !== 0) {
        throw new Error(tar.stderr || "tar extraction failed");
      }
    });
    // The tarball extracts to a single "<repo>-<branch>" directory.
    const entries = await readdir(this.tmpRoot, { withFileTypes: true });
    const dir = entries.find(e => e.isDirectory());
    if (!dir) {
      this.io.error("Fetched source tarball contained no directory.");
    }
    this.sourceRoot = join(this.tmpRoot, dir.name);
    return this.sourceRoot;
  }

  async cleanupSource() {
    if (this.tmpRoot) {
      await rm(this.tmpRoot, { recursive: true, force: true });
      this.tmpRoot = null;
      this.sourceRoot = null;
    }
  }

  // ── rendering ────────────────────────────────────────────────────────────

  // Copy one plugin's skills/ + assets/ into <configDir>/virajp-plugins/<name>/,
  // rewrite ${CLAUDE_PLUGIN_ROOT}, stamp .version, and (re)write the command
  // wrappers for its user-invoked skills.
  async renderPlugin(sourceRoot, name, scope) {
    const src = join(sourceRoot, "plugins", name);
    if (!existsSync(join(src, "skills"))) {
      this.io.log(
        yellow(`${name}: no skills/ directory — nothing to install, skipped.`),
      );
      return;
    }
    const configDir = configDirFor(scope);
    const dest = join(configDir, BUNDLE_DIR, name);

    await step(this.io, `Installing ${name} skills (${scope})`, async () => {
      await rm(dest, { recursive: true, force: true });
      await mkdir(dest, { recursive: true });
      for (const part of ["skills", "assets"]) {
        if (existsSync(join(src, part))) {
          await cp(join(src, part), join(dest, part), { recursive: true });
        }
      }
      await this.rewritePluginRoot(dest);
      await this.segregateWorkflowSkills(dest);

      const market = JSON.parse(
        await readFile(
          join(sourceRoot, ".claude-plugin", "marketplace.json"),
          "utf8",
        ),
      );
      const version = (market.plugins || [])
        .find(p => p.name === name)
        ?.version;
      await writeFile(join(dest, ".version"), `${version || "unknown"}\n`);

      // Stamp the OpenCode lsp entries this plugin contributes, so updateConfig
      // applies them and a later uninstall knows exactly what to remove.
      const pj = JSON.parse(
        await readFile(join(src, ".claude-plugin", "plugin.json"), "utf8"),
      );
      const lsp = lspEntriesFor(pj);
      if (lsp) {
        await writeFile(
          join(dest, ".lsp.json"),
          `${JSON.stringify(lsp, null, 2)}\n`,
        );
      }
    });

    await this.writeWrappers(name, dest, configDir);
  }

  // Expand ${CLAUDE_PLUGIN_ROOT} to the installed plugin dir in every markdown
  // file under it (Claude Code expands the variable at runtime; OpenCode has no
  // such variable, so the rendered copy carries absolute paths).
  async rewritePluginRoot(pluginDir) {
    const walk = async dir => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(p);
        }
        else if (entry.name.endsWith(".md")) {
          const text = await readFile(p, "utf8");
          if (text.includes("${CLAUDE_PLUGIN_ROOT}")) {
            await writeFile(p, text.replace(PLUGIN_ROOT_RE, pluginDir));
          }
        }
      }
    };
    await walk(pluginDir);
  }

  // Move user-invoked workflow skills (disable-model-invocation: true) out of
  // skill discovery: OpenCode ignores that flag and its skill tool would list
  // them to the model, which Claude deliberately prevents. Each moves from
  // skills/<n>/SKILL.md to commands/<n>/index.md — no SKILL.md filename means
  // the `**\/SKILL.md` discovery never sees it, while the command wrappers
  // still reach it by path (mirroring Claude's user-only semantics).
  async segregateWorkflowSkills(pluginDir) {
    const skillsDir = join(pluginDir, "skills");
    if (!existsSync(skillsDir)) {
      return;
    }
    for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillPath = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) {
        continue;
      }
      const fm = frontmatter(await readFile(skillPath, "utf8"));
      if (fm["disable-model-invocation"] !== "true") {
        continue;
      }
      const destDir = join(pluginDir, "commands", entry.name);
      await mkdir(dirname(destDir), { recursive: true });
      await rename(join(skillsDir, entry.name), destDir);
      await rename(join(destDir, "SKILL.md"), join(destDir, "index.md"));
    }
  }

  // One command wrapper per workflow skill: OpenCode commands are user-typed
  // (`/<file-stem>`), so `/vwf-blueprint` etc. keep working there. Doctrine
  // skills need no wrapper — OpenCode's skill tool loads them from the
  // description.
  async writeWrappers(name, pluginDir, configDir) {
    const commandsDir = join(pluginDir, "commands");
    if (!existsSync(commandsDir)) {
      return;
    }
    const cmdDir = join(configDir, "command");
    let count = 0;
    for (const entry of await readdir(commandsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillPath = join(commandsDir, entry.name, "index.md");
      if (!existsSync(skillPath)) {
        continue;
      }
      const fm = frontmatter(await readFile(skillPath, "utf8"));
      await mkdir(cmdDir, { recursive: true });
      const description = stripQuotes(fm.description) || `${entry.name} skill`;
      const hint = stripQuotes(fm["argument-hint"]);
      const body = [
        "---",
        `description: ${description}`,
        "---",
        "",
        `Use the "${entry.name}" workflow skill installed at ${skillPath} — `
        + `read it and follow it for this request.`,
        ...(hint ? ["", `Arguments (${hint}):`] : [""]),
        "$ARGUMENTS",
        "",
      ]
        .join("\n");
      await writeFile(join(cmdDir, `${name}-${entry.name}.md`), body);
      count++;
    }
    if (count) {
      this.io.log(
        green(`  ${count} command wrapper(s) → ${cmdDir}/${name}-*.md`),
      );
    }
  }

  // ── the OpenCode config (opencode.jsonc / opencode.json) ─────────────────

  // The config file edits target: an existing jsonc first (it wins OpenCode's
  // merge), an existing json next, else a new opencode.jsonc.
  configFile(configDir) {
    for (const name of CONFIG_FILES) {
      const p = join(configDir, name);
      if (existsSync(p)) {
        return p;
      }
    }
    return join(configDir, CONFIG_FILES[0]);
  }

  async readConfig(configDir) {
    const path = this.configFile(configDir);
    if (!existsSync(path)) {
      return {
        path,
        config: { $schema: OPENCODE_SCHEMA_URL },
        hadComments: false,
      };
    }
    const raw = await readFile(path, "utf8");
    if (!raw.trim()) {
      return {
        path,
        config: { $schema: OPENCODE_SCHEMA_URL },
        hadComments: false,
      };
    }
    try {
      const { data, hadComments } = parseJsonc(raw);
      return { path, config: data, hadComments };
    }
    catch {
      this.io.error(
        `${path} is not valid JSON/JSONC. Fix or remove it, then retry.`,
      );
    }
  }

  // Re-serializing drops JSONC comments; a commented config is only rewritten
  // after the user confirms (or with --yes). Returns false when skipped.
  async confirmRewrite(path, hadComments, yes) {
    if (!hadComments || yes) {
      return true;
    }
    this.io.log(
      yellow(`\n${path} contains comments — rewriting drops them.`),
    );
    if (await confirm(`Rewrite ${path}?`)) {
      return true;
    }
    this.io.log(
      yellow(
        `Skipped ${path} — apply the entries manually or re-run with --yes.`,
      ),
    );
    return false;
  }

  async writeConfig(path, config) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  }

  // Append the virajp-plugins dir to skills.paths (targeted array append — a deep
  // merge would replace the user's array), apply the installed plugins' lsp
  // entries, and add the context7 MCP server when that plugin was installed.
  // Preserves every unknown key; never overwrites an existing lsp/mcp entry.
  async updateConfig(scope, pluginNames, yes) {
    const configDir = configDirFor(scope);
    const { path, config, hadComments } = await this.readConfig(configDir);

    config.skills = isObject(config.skills) ? config.skills : {};
    const paths = Array.isArray(config.skills.paths)
      ? config.skills.paths
      : (config.skills.paths = []);
    const want = skillsPathFor(scope);
    if (!paths.includes(want)) {
      paths.push(want);
    }

    // The lsp entries each rendered plugin stamped (see renderPlugin).
    const lspWritten = [];
    for (const name of pluginNames) {
      const stamp = join(configDir, BUNDLE_DIR, name, ".lsp.json");
      if (!existsSync(stamp)) {
        continue;
      }
      const entries = JSON.parse(await readFile(stamp, "utf8"));
      config.lsp = isObject(config.lsp) ? config.lsp : {};
      for (const [id, entry] of Object.entries(entries)) {
        if (!config.lsp[id]) {
          config.lsp[id] = entry;
          lspWritten.push(id);
        }
      }
    }

    if (pluginNames.includes("context7")) {
      config.mcp = isObject(config.mcp) ? config.mcp : {};
      if (!config.mcp.context7) {
        // Mirrors plugins/context7/.claude-plugin/plugin.json (mcpServers).
        config.mcp.context7 = {
          type: "local",
          command: ["pnpm", "dlx", "@upstash/context7-mcp"],
        };
      }
    }

    if (!(await this.confirmRewrite(path, hadComments, yes))) {
      return;
    }
    await step(
      this.io,
      `Updating ${path}`,
      () => this.writeConfig(path, config),
    );
    if (lspWritten.length) {
      this.io.log(green(`  lsp: ${lspWritten.join(", ")}`));
    }
  }

  // Reverse updateConfig for uninstall: drop the lsp entries the removed
  // plugins stamped (only when unmodified), our mcp entry with context7, and
  // the skills.paths entry once no rendered plugin remains.
  async pruneConfig(scope, removedNames, lspEntries, yes) {
    const configDir = configDirFor(scope);
    if (!CONFIG_FILES.some(f => existsSync(join(configDir, f)))) {
      return;
    }
    const { path, config, hadComments } = await this.readConfig(configDir);
    let changed = false;

    // Only remove an lsp entry that still matches exactly what we wrote.
    if (isObject(config.lsp)) {
      for (const [id, entry] of Object.entries(lspEntries || {})) {
        if (JSON.stringify(config.lsp[id]) === JSON.stringify(entry)) {
          delete config.lsp[id];
          changed = true;
        }
      }
      if (!Object.keys(config.lsp).length) {
        delete config.lsp;
      }
    }

    if (removedNames.includes("context7") && isObject(config.mcp)) {
      const entry = config.mcp.context7;
      // Only remove the exact entry we wrote.
      if (
        isObject(entry)
        && entry.type === "local"
        && Array.isArray(entry.command)
        && entry.command.join(" ") === "pnpm dlx @upstash/context7-mcp"
      ) {
        delete config.mcp.context7;
        if (!Object.keys(config.mcp).length) {
          delete config.mcp;
        }
        changed = true;
      }
    }

    const root = join(configDir, BUNDLE_DIR);
    const empty = !existsSync(root)
      || !(await readdir(root)).filter(f => !f.startsWith(".")).length;
    if (
      empty && isObject(config.skills) && Array
        .isArray(config.skills.paths)
    ) {
      const want = skillsPathFor(scope);
      const kept = config.skills.paths.filter(p => p !== want);
      if (kept.length !== config.skills.paths.length) {
        changed = true;
        if (kept.length) {
          config.skills.paths = kept;
        }
        else {
          delete config.skills.paths;
          if (!Object.keys(config.skills).length) {
            delete config.skills;
          }
        }
      }
      if (existsSync(root)) {
        await rm(root, { recursive: true, force: true });
      }
    }

    if (changed) {
      if (!(await this.confirmRewrite(path, hadComments, yes))) {
        return;
      }
      await step(
        this.io,
        `Updating ${path}`,
        () => this.writeConfig(path, config),
      );
    }
  }
}

export { OpenCode };
