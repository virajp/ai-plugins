#!/usr/bin/env node
/**
 * Dev-only entrypoint for the renderer. End users never run this — they install
 * from the committed `dist/` tree — so it stays a plain argv switch rather than
 * pulling the CLI's command framework into a build tool.
 */
import { join } from "node:path";
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
  default: {
    console.error(`usage: ai-plugins-build <codemod|render|check>`);
    process.exit(1);
  }
}
