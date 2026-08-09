import {
  globSync,
  readFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  join,
} from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  fromFrontmatter as agentFrom,
  isReadOnly,
} from "./agent.ts";
import * as fm from "./frontmatter.ts";
import { fromFrontmatter as skillFrom } from "./skill.ts";

const root = join(import.meta.dirname, "..", "..");
const read = (p: string) => fm.parse(readFileSync(join(root, p), "utf8"))!;

const skills = globSync("templates/**/SKILL.md", { cwd: root }).sort();
const agents = globSync("templates/*/agents/*.md", { cwd: root }).sort();

describe("skills", () => {
  it.each(skills)("parses %s", path => {
    const skill = skillFrom(read(path));
    // The directory name is the skill's identity everywhere downstream.
    expect(skill.name).toBe(basename(dirname(path)));
    expect(skill.description.length).toBeGreaterThan(0);
  });

  // Corpus is `templates/`, the authored source, since the frozen `plugins/`
  // tree went with the installer cutover. That also moves this off the legacy
  // Claude encoding onto the neutral `invocation:` key the templates carry.
  it("classifies every skill's invocation", () => {
    const byInvocation = { model: 0, user: 0, both: 0 };
    for (const p of skills) {
      byInvocation[skillFrom(read(p)).invocation]++;
    }

    // Doctrine skills are model-only; the user-only set is the five workflow
    // skills nothing delegates to, plus each plugin's own entry commands.
    expect(byInvocation.model).toBeGreaterThan(0);
    expect(byInvocation.user).toBeGreaterThan(0);
    expect(byInvocation.both).toBeGreaterThan(0);
    expect(byInvocation.model + byInvocation.user + byInvocation.both).toBe(
      skills.length,
    );
  });

  it("gives every path-scoped skill model invocation", () => {
    // A skill scoped by `paths:` exists to auto-apply. If it were user-only the
    // scoping would be dead weight — worth failing the build over.
    for (const p of skills) {
      const skill = skillFrom(read(p));
      if (skill.paths !== undefined) {
        expect(skill.invocation).toBe("model");
      }
    }
  });
});

describe("agents", () => {
  it.each(agents)("parses %s", path => {
    const agent = agentFrom(read(path));
    expect(agent.name).toBe(basename(path, ".md"));
    expect(agent.tools?.length ?? 0).toBeGreaterThan(0);
  });

  it("derives read-only status for targets without a tool allowlist", () => {
    // Cursor collapses the allowlist to a single boolean, so this derivation
    // decides what a subagent may do there. Bash counts as mutating: Cursor's
    // own `readonly` blocks "state-changing shell", and the reviewers that
    // carry Bash use it to run builds and test suites.
    const byName = (n: string) =>
      agentFrom(read(agents.find(p => p.endsWith(`${n}.md`))!));

    // Pure-read: Read/Grep/Glob only.
    for (
      const n of [
        "blueprint-reviewer",
        "blueprint-surveyor",
        "product-reviewer",
      ]
    ) {
      expect(isReadOnly(byName(n)), n).toBe(true);
    }

    // Writers and anything holding Bash are not.
    for (
      const n of [
        "execute-coder",
        "flow-writer",
        "plan-surveyor",
        "execute-ux-reviewer",
      ]
    ) {
      expect(isReadOnly(byName(n)), n).toBe(false);
    }
  });

  it("reports how much agent tool restriction each target can carry", () => {
    // Documents the known degradation rather than asserting parity: on Cursor
    // the six Bash-holding agents lose their allowlist entirely, and only the
    // pure-read ones keep a meaningful restriction.
    const parsed = agents.map(p => agentFrom(read(p)));
    const readOnly = parsed.filter(isReadOnly);
    // The five pure-read gates: blueprint-{coherence-reviewer,reviewer,surveyor},
    // design-system-reviewer, product-reviewer.
    expect(readOnly.map(a => a.name).sort()).toEqual([
      "blueprint-coherence-reviewer",
      "blueprint-reviewer",
      "blueprint-surveyor",
      "design-system-reviewer",
      "product-reviewer",
    ]);
    expect(parsed.length - readOnly.length).toBe(11);
  });
});
