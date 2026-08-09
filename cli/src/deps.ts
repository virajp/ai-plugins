/**
 * The external-tool gate.
 *
 * Plugins declare skills and servers that shell out — vwf drives `graphify` and
 * `rtk`, context7's MCP server runs through `pnpm dlx`, flutter's LSPs are
 * system binaries. Installing one whose tools are absent succeeds and then
 * fails later, somewhere with no connection to the install, so this refuses up
 * front and says what to run.
 *
 * **The list is derived, not maintained.** Each plugin declares its own
 * `requires:` in `plugin.yaml`, the build projects it into `plugins.json`,
 * and the union over the dependency-expanded set is what gets checked. The old
 * installer kept the same facts as a hand-written `PLUGIN_EXTRA_DEPS` map whose
 * entries had to roll their dependencies' tools up by hand — vwf listing
 * context7's `pnpm` and mempalace's `uv`. Expansion does that now, and the
 * derived union reproduces every one of those hand-rolled entries exactly.
 *
 * There is no equivalent of the old `CORE_DEPS`. That existed to require
 * `claude`, the one install mechanism; with four targets each adapter's
 * `detect()` answers it, and the executor skips a target whose tool is absent
 * rather than failing the whole run.
 */
import type { PluginIndex } from "./plan.ts";

/**
 * How to install each tool.
 *
 * Keyed by tool name and kept here rather than in `plugin.yaml`, because it
 * describes *this toolchain* (mise drives runtime tools; rtk ships as a brew
 * formula), not the plugin. A tool with no entry still reports as missing — it
 * just cannot suggest a command, which is why nothing has to keep the two in
 * sync.
 */
export const DEP_HINTS: Readonly<Record<string, string>> = {
  brew:
    "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
  mise: "brew install mise",
  claude: "mise use -g claude-code@latest",
  opencode: "mise use -g opencode@latest",
  rtk: "brew install --formulae rtk",
  pnpm: "mise use -g pnpm@latest",
  node: "mise use -g node@latest",
  graphify: "mise use -g pipx:graphifyy@latest",
  uv: "mise use -g uv@latest",
  "kotlin-lsp":
    "install a kotlin-lsp binary on PATH — https://github.com/Kotlin/kotlin-lsp",
  "sourcekit-lsp":
    "ships with Xcode or a swift.org toolchain — https://www.swift.org/install",
};

/**
 * Every tool the named plugins need, dependencies included.
 *
 * Expanded regardless of target: Claude installs its own dependencies rather
 * than letting `resolvePlan` expand them, but their tools are needed either
 * way — who performs the install does not change what the plugin runs.
 */
export function requiredTools(
  index: PluginIndex,
  names: readonly string[],
): string[] {
  const byName = new Map(index.plugins.map(p => [p.name, p]));
  const seen = new Set<string>();
  const tools = new Set<string>();

  const visit = (name: string): void => {
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    const entry = byName.get(name);
    if (entry === undefined) {
      return;
    }
    for (const tool of entry.requires ?? []) {
      tools.add(tool);
    }
    for (const dependency of entry.dependencies) {
      visit(dependency);
    }
  };

  for (const name of names) {
    visit(name);
  }
  return [...tools].sort();
}

/** Which of `tools` are not on PATH. */
export function missingTools(
  tools: readonly string[],
  onPath: (tool: string) => boolean,
): string[] {
  return tools.filter(tool => !onPath(tool));
}

/** The refusal message: what is missing, and the command that fixes each. */
export function renderMissing(missing: readonly string[]): string {
  const lines = [
    `missing required tool(s): ${missing.join(", ")}`,
    "",
    "Install them, then re-run:",
  ];
  for (const tool of missing) {
    lines.push(
      `  ${tool.padEnd(16)} ${DEP_HINTS[tool] ?? "no install hint on record"}`,
    );
  }
  return lines.join("\n");
}
