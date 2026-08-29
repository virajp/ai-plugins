import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  check,
  prescribes,
  resolveRootRef,
} from "./check.ts";
import type { Finding } from "./check.ts";

const repoRoot = join(import.meta.dirname, "..", "..");

describe("check", () => {
  it("finds nothing wrong with the committed tree", () => {
    // The whole-corpus regression gate. Printed in full on failure, because a
    // bare count tells you nothing about which invariant broke.
    expect(check(repoRoot)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The failure directions, against a throwaway tree
// ---------------------------------------------------------------------------

/**
 * A fixture is a whole `plugins/` tree.
 *
 * The predecessor could only unit-test its pure helpers: `check` took a parsed
 * workspace and rendering it needed the renderer, so every rule that touched
 * disk was covered by the corpus assertion alone — which proves the rules pass
 * on a clean tree and says nothing about whether they would fire on a dirty one.
 * A checker that never fires is indistinguishable from one that was deleted, so
 * each rule below is pinned in the direction that matters.
 */
interface Fixture {
  readonly manifest?: Record<string, unknown>;
  /** Files under the plugin root, by relative path. */
  readonly files?: Record<string, string>;
  /** Relative paths to mark executable. */
  readonly executable?: readonly string[];
}

function tree(plugins: Record<string, Fixture>): string {
  const root = mkdtempSync(join(tmpdir(), "ai-plugins-check-"));

  for (const [dir, fixture] of Object.entries(plugins)) {
    const pluginRoot = join(root, "plugins", dir);
    write(
      join(pluginRoot, ".claude-plugin", "plugin.json"),
      JSON.stringify(
        fixture.manifest ?? {
          name: dir,
          version: "1.0.0",
          description: `the ${dir} plugin`,
        },
        null,
        2,
      ),
    );
    for (const [path, contents] of Object.entries(fixture.files ?? {})) {
      write(join(pluginRoot, path), contents);
    }
    for (const path of fixture.executable ?? []) {
      chmodSync(join(pluginRoot, path), 0o755);
    }
  }

  return root;
}

function write(absolute: string, contents: string): void {
  mkdirSync(join(absolute, ".."), { recursive: true });
  writeFileSync(absolute, contents);
}

/** A skill with valid frontmatter, so a fixture only states what it is testing. */
function skill(name: string, extra = "", body = "prose"): string {
  return `---\nname: ${name}\ndescription: does something\n${extra}---\n\n${body}\n`;
}

const messages = (findings: readonly Finding[]) => findings.map(f => f.message);

describe("the manifest", () => {
  it("flags a name that disagrees with the directory", () => {
    // The directory is what the marketplace `source` points at; the name is what
    // dependency lists use. A disagreement installs a plugin nothing refers to.
    const root = tree({
      alpha: { manifest: { name: "beta", version: "1.0.0", description: "x" } },
    });
    expect(messages(check(root))).toEqual([
      "plugin.json name \"beta\" != directory \"alpha\"",
    ]);
  });

  it("flags a missing or non-semver version", () => {
    const root = tree({
      alpha: { manifest: { name: "alpha", version: "1.0", description: "x" } },
      beta: { manifest: { name: "beta", description: "x" } },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("version \"1.0\" is not semver"),
      expect.stringContaining("version undefined is not semver"),
    ]);
  });

  it("flags an empty description", () => {
    const root = tree({
      alpha: {
        manifest: { name: "alpha", version: "1.0.0", description: "  " },
      },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("declares no `description`"),
    ]);
  });
});

describe("dependencies", () => {
  it("accepts a dependency on a sibling plugin", () => {
    const root = tree({
      alpha: {
        manifest: {
          name: "alpha",
          version: "1.0.0",
          description: "x",
          dependencies: [{ marketplace: "virajp-plugins", name: "beta" }],
        },
      },
      beta: {},
    });
    expect(check(root)).toEqual([]);
  });

  it("flags a dependency on a plugin that is not here", () => {
    const root = tree({
      alpha: {
        manifest: {
          name: "alpha",
          version: "1.0.0",
          description: "x",
          dependencies: [{ marketplace: "virajp-plugins", name: "gone" }],
        },
      },
    });
    expect(messages(check(root))).toEqual([
      "dependency \"gone\" is not a plugin in this marketplace",
    ]);
  });

  it("flags a dependency pointing at another marketplace", () => {
    // Claude would look in a marketplace the user has very likely not
    // registered, and it is the install of the *parent* that then fails.
    const root = tree({
      alpha: {
        manifest: {
          name: "alpha",
          version: "1.0.0",
          description: "x",
          dependencies: [{ marketplace: "somewhere-else", name: "beta" }],
        },
      },
      beta: {},
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("names marketplace \"somewhere-else\""),
    ]);
  });
});

describe("hook scripts", () => {
  const hooks = (command: string) =>
    JSON.stringify({
      hooks: { PreToolUse: [{ hooks: [{ command, type: "command" }] }] },
    });

  it("accepts an executable script and an inline command", () => {
    // vwf's guarded `rtk` hook is inline and names no bundled file, so a rule
    // that demanded a script would flag it on every run.
    const root = tree({
      alpha: {
        files: {
          "hooks/hooks.json": hooks("${CLAUDE_PLUGIN_ROOT}/hooks/run.sh"),
          "hooks/run.sh": "#!/usr/bin/env bash\n",
        },
        executable: ["hooks/run.sh"],
      },
      beta: {
        files: {
          "hooks/hooks.json": hooks("command -v rtk && rtk hook || true"),
        },
      },
    });
    expect(check(root)).toEqual([]);
  });

  it("flags a script that does not exist", () => {
    const root = tree({
      alpha: {
        files: {
          "hooks/hooks.json": hooks("${CLAUDE_PLUGIN_ROOT}/hooks/gone.sh"),
        },
      },
    });
    expect(messages(check(root))).toEqual([
      "PreToolUse hook names a missing script: hooks/gone.sh",
      // The root-reference pass sees the same path. Two rules, two findings:
      // suppressing one would mean a reference in prose to a missing hook script
      // reported nothing at all.
      expect.stringContaining("resolves to nothing"),
    ]);
  });

  it("flags a script that is not executable", () => {
    const root = tree({
      alpha: {
        files: {
          "hooks/hooks.json": hooks("${CLAUDE_PLUGIN_ROOT}/hooks/run.sh"),
          "hooks/run.sh": "#!/usr/bin/env bash\n",
        },
      },
    });
    expect(messages(check(root))).toEqual([
      "PreToolUse hook script is not executable: hooks/run.sh",
    ]);
  });
});

describe("frontmatter", () => {
  it("flags frontmatter a strict YAML parser rejects", () => {
    // Claude's parser is lenient and accepts this; a strict host drops the whole
    // skill with no error and no warning, which is the failure this exists for.
    const root = tree({
      alpha: {
        files: {
          "skills/one/SKILL.md":
            "---\nname: one\ndescription: a: b\n---\n\nx\n",
        },
      },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("frontmatter is not valid YAML"),
    ]);
  });

  it("flags a skill with no frontmatter at all", () => {
    const root = tree({
      alpha: { files: { "skills/one/SKILL.md": "# One\n" } },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("no YAML frontmatter"),
    ]);
  });
});

describe("agent cross-references", () => {
  it("resolves a role-shaped token to a declared agent", () => {
    const root = tree({
      alpha: {
        files: {
          "agents/thing-writer.md": skill("thing-writer"),
          "skills/one/SKILL.md": skill("one", "", "delegate to `thing-writer`"),
        },
      },
    });
    expect(check(root)).toEqual([]);
  });

  it("flags a role-shaped token naming no agent", () => {
    // The rename direction: `-writer` is a known role because another agent
    // holds it, so a token wearing that suffix has to resolve.
    const root = tree({
      alpha: {
        files: {
          "agents/thing-writer.md": skill("thing-writer"),
          "skills/one/SKILL.md": skill(
            "one",
            "",
            "delegate to `thing-writer` then `other-writer`",
          ),
        },
      },
    });
    expect(messages(check(root))).toEqual([
      "reference `other-writer` names no agent under agents/",
    ]);
  });

  it("flags an agent nothing references", () => {
    // The direction the forward rule cannot cover: a rename that takes the last
    // holder of a suffix with it leaves the new name referenced by nothing.
    const root = tree({
      alpha: { files: { "agents/thing-writer.md": skill("thing-writer") } },
    });
    expect(messages(check(root))).toEqual([
      "agent \"thing-writer\" is referenced by no skill or asset",
    ]);
  });

  it("does not count a mention in its own frontmatter as a reference", () => {
    // An agent's `description:` is a folded scalar carrying the same backticked
    // vocabulary the body does. Counting it would make every agent look
    // referenced by its own file, and the orphan direction would never fire.
    const root = tree({
      alpha: {
        files: {
          "agents/thing-writer.md":
            "---\nname: thing-writer\ndescription: the `thing-writer` agent\n---\n\nx\n",
        },
      },
    });
    expect(messages(check(root))).toEqual([
      "agent \"thing-writer\" is referenced by no skill or asset",
    ]);
  });
});

describe("root-relative references", () => {
  it("resolves a file, a directory, and a sibling plugin", () => {
    const root = tree({
      alpha: {
        files: {
          "assets/doc.md": "x",
          "assets/topologies/repo.md": "x",
          "skills/one/SKILL.md": skill(
            "one",
            "",
            "read `${CLAUDE_PLUGIN_ROOT}/assets/doc.md`, then "
              + "`${CLAUDE_PLUGIN_ROOT}/assets/topologies/`, then "
              + "`${CLAUDE_PLUGIN_ROOT}/../beta/assets/other.md`",
          ),
        },
      },
      beta: { files: { "assets/other.md": "x" } },
    });
    expect(check(root)).toEqual([]);
  });

  it("flags a reference that resolves inside the wrong plugin", () => {
    // The false negative the predecessor shipped: with four render trees to
    // satisfy it matched a reference against the TAIL of every emitted path, so
    // `${CLAUDE_PLUGIN_ROOT}/assets/doc.md` in alpha passed on the strength of
    // beta's copy. One tree means one unambiguous resolution.
    const root = tree({
      alpha: {
        files: {
          "skills/one/SKILL.md": skill(
            "one",
            "",
            "read `${CLAUDE_PLUGIN_ROOT}/assets/doc.md`",
          ),
        },
      },
      beta: { files: { "assets/doc.md": "x" } },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("reference to assets/doc.md resolves to nothing"),
    ]);
  });

  it("flags a reference that climbs out of plugins/", () => {
    const root = tree({
      alpha: {
        files: {
          "skills/one/SKILL.md": skill(
            "one",
            "",
            "read `${CLAUDE_PLUGIN_ROOT}/../../readme.md`",
          ),
        },
      },
    });
    expect(messages(check(root))).toEqual([
      expect.stringContaining("climbs out of plugins/"),
    ]);
  });
});

describe("the design-adapter contract", () => {
  const adapter = (files: Record<string, string>) => ({
    "design-tools": {
      manifest: {
        name: "design-tools",
        version: "1.0.0",
        description: "x",
        keywords: ["vwf-design-adapter"],
      },
      files,
    },
  });

  // Unprefixed since the adapter merged into vwf: the caller is
  // `/vwf:import-screens`, not `/<plugin>:<plugin>-import-screens`.
  const three = (extra: string) => ({
    "skills/import-screens/SKILL.md": skill("import-screens", extra),
    "skills/import-design-system/SKILL.md": skill(
      "import-design-system",
      extra,
    ),
    "skills/import-conversations/SKILL.md": skill(
      "import-conversations",
      extra,
    ),
  });

  it("accepts all three skills at disable-model-invocation: false", () => {
    const root = tree(adapter(three("disable-model-invocation: false\n")));
    expect(check(root)).toEqual([]);
  });

  it("flags a missing import skill", () => {
    const files = Object.fromEntries(
      Object
        .entries(three("disable-model-invocation: false\n"))
        .filter(([path]) => !path.includes("import-conversations")),
    );
    expect(messages(check(tree(adapter(files))))).toEqual([
      "design adapter is missing its \"import-conversations\" skill",
    ]);
  });

  it("flags a skill the model cannot invoke", () => {
    // `true` removes the skill from the model's context entirely, so vwf's
    // delegation returns an empty payload rather than an error — which reads
    // exactly like a design nobody authored.
    const root = tree(adapter(three("disable-model-invocation: true\n")));
    expect(messages(check(root))).toHaveLength(3);
    expect(messages(check(root))[0]).toContain(
      "is not `disable-model-invocation: false`",
    );
  });

  it("flags a skill that is model-invocable but hidden from the user", () => {
    // `user-invocable: false` is the old `invocation: model`. The model can
    // invoke it, so a rule that only banned `true` would pass — but these three
    // are documented as user-runnable too, and only the explicit `false` means
    // both.
    const root = tree(adapter(three("user-invocable: false\n")));
    expect(messages(check(root))).toHaveLength(3);
  });

  it("does not apply to a plugin without the keyword", () => {
    const root = tree({ "design-tools": {} });
    expect(check(root)).toEqual([]);
  });
});

describe("the technology-free vwf guard", () => {
  const vwf = (files: Record<string, string>) => ({ vwf: { files } });

  it("flags vwf prose naming a tool", () => {
    const root = tree(
      vwf({ "assets/harness.md": "Run the suite with vitest.\n" }),
    );
    expect(messages(check(root))).toEqual([
      expect.stringContaining("names \"vitest\""),
    ]);
  });

  it("flags vwf shipping a stack template", () => {
    const root = tree(vwf({ "stacks/project/thing.md": "# Thing\n" }));
    expect(messages(check(root))).toEqual([
      expect.stringContaining(
        "ships a stack template at stacks/project/thing.md",
      ),
    ]);
  });

  it("flags a hardcoded design-tools MCP server", () => {
    // Names no tool, so it covers a fourth design tool the day one is added —
    // which the token list cannot.
    const root = tree(
      vwf({
        "assets/feedback.md": "Call mcp__plugin_design-tools_get_page.\n",
      }),
    );
    expect(messages(check(root))).toEqual([
      expect.stringContaining("references a design-tools MCP server directly"),
    ]);
  });

  it("exempts the two reviewed paths and the worked example bundle", () => {
    // The example bundle is a worked blueprint of somebody's product, and a
    // blueprint names its product's technology by design.
    const root = tree(vwf({
      "assets/stack-adapter.md": "e.g. vitest, playwright.\n",
      "skills/readme/SKILL.md": skill("readme", "", "Detect pnpm or bun."),
      "assets/examples/blueprint/flows/index.md": "Built on postgres.\n",
    }));
    expect(check(root)).toEqual([]);
  });

  it("ignores a tool named inside a fenced block", () => {
    const root = tree(
      vwf({ "assets/config.md": "```yaml\nrunner: vitest\n```\n" }),
    );
    expect(check(root)).toEqual([]);
  });

  it("does not police any other plugin", () => {
    // The guard is vwf's alone: naming the tool it owns is the whole job of a
    // stack plugin.
    const root = tree({
      typescript: { files: { "assets/x.md": "Use pnpm.\n" } },
    });
    expect(check(root)).toEqual([]);
  });
});

describe("prescription vs enumeration", () => {
  // The distinction the tool-name guard turns on: naming ONE tool tells the
  // reader what to use; listing the alternatives describes the domain of a
  // config key vwf owns. Both directions are pinned, because a guard that
  // exempts too much is indistinguishable from one that was deleted.

  it("flags a tool named on its own", () => {
    expect(prescribes("Load the claude-design MCP tool.", "claude-design"))
      .toBe(true);
    expect(prescribes("run it on cloud-run", "cloud-run")).toBe(true);
  });

  it("exempts a tool listed beside its alternatives", () => {
    expect(
      prescribes(
        "a token — `claude-design`, `lovable`, `stitch`",
        "claude-design",
      ),
    )
      .toBe(false);
  });

  it("exempts an enumeration that wraps mid-list", () => {
    // Every real enumeration in the corpus wraps, so a line-based rule would
    // flag the first line of each one. This is why the window is by character.
    expect(
      prescribes(
        "Which tool answers (`claude-design`,\n`lovable`, `stitch`, …) is the\nproduct's choice",
        "claude-design",
      ),
    )
      .toBe(false);
  });

  it("counts a peer that is not itself a banned token", () => {
    // `lovable` and `stitch` are ordinary English words and cannot be banned,
    // but their presence is still what proves a passage is a vocabulary.
    expect(prescribes("`claude-design` or `lovable`", "claude-design"))
      .toBe(false);
  });

  it("still flags a second, prescriptive mention elsewhere in the same file", () => {
    // The exemption is per occurrence, not per document — otherwise one
    // enumeration would licence every other mention in the file.
    const body = "the tokens `claude-design`, `lovable`, `stitch`.\n"
      + "x".repeat(400)
      + "\nDefault it to claude-design.";
    expect(prescribes(body, "claude-design")).toBe(true);
  });

  it("does not treat a distant token as a peer", () => {
    // The separators matter: the guard is anchored, so a token butted straight
    // against a letter is not a match at all.
    const body = `claude-design ${"x ".repeat(200)} lovable`;
    expect(prescribes(body, "claude-design")).toBe(true);
  });

  it("does not match a token inside a longer word", () => {
    // The unanchored form this list started as matched `hono` inside "honor"
    // and "honored" across a dozen files.
    expect(prescribes("we honor the contract, as honored elsewhere", "hono"))
      .toBe(false);
  });
});

describe("resolveRootRef", () => {
  it("resolves against the plugin that wrote the reference", () => {
    expect(resolveRootRef("/p/vwf", "assets/doc.md")).toBe(
      "/p/vwf/assets/doc.md",
    );
  });

  it("drops a trailing slash, so a directory reference resolves", () => {
    expect(resolveRootRef("/p/vwf", "assets/topologies/")).toBe(
      "/p/vwf/assets/topologies",
    );
  });

  it("follows a sibling hop out of the plugin root", () => {
    // Claude installs every plugin as a sibling, so a relative hop between them
    // survives whatever absolute path the client chose.
    expect(resolveRootRef("/p/design-tools", "../vwf/assets/doc.md")).toBe(
      "/p/vwf/assets/doc.md",
    );
  });
});
