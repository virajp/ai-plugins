#!/usr/bin/env node
/**
 * Dev-only entrypoint for the renderer. End users never run this — they install
 * from the committed `dist/` tree — so it stays a plain argv switch rather than
 * pulling the CLI's command framework into a build tool.
 */
import { join } from "node:path";
import { check } from "./check.ts";
import { migrate } from "./codemod.ts";
import { renderAll } from "./render.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const command = process.argv[2];

switch (command) {
  case "codemod": {
    migrate(repoRoot);
    console.log("wrote templates/");
    break;
  }
  case "render": {
    for (const result of renderAll(repoRoot)) {
      console.log(`${result.target}: ${result.files} files`);
      for (const gap of result.emission.gaps) {
        console.log(
          `  ${gap.severity}: ${gap.plugin} — ${gap.capability}: ${gap.detail}`,
        );
      }
    }
    break;
  }
  case "check": {
    const { findings, coverage, counts } = await check(repoRoot);

    for (const { scope, message } of findings) {
      console.error(`  FAIL ${scope}: ${message}`);
    }

    console.log(
      `\nchecked ${counts.plugins} plugins, ${counts.skills} skills, `
        + `${counts.agents} agents`,
    );

    console.log("\ncoverage");
    for (const t of coverage) {
      const lost = t.degraded + t.dropped;
      console.log(
        `  ${t.target.padEnd(9)} ${String(t.outputs).padStart(4)} files`
          + (lost === 0
            ? "   full parity"
            : `   ${t.dropped} dropped, ${t.degraded} degraded`),
      );
      for (const [capability, plugins] of [...t.byCapability].sort()) {
        console.log(`      ${capability}: ${plugins.join(", ")}`);
      }
    }

    if (findings.length > 0) {
      console.error(`\n${findings.length} finding(s)`);
      process.exit(1);
    }
    console.log("\nAll checks passed.");
    break;
  }
  default: {
    console.error(`usage: ai-plugins-build <codemod|render|check>`);
    process.exit(1);
  }
}
