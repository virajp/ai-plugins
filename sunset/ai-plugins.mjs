#!/usr/bin/env node
// Sunset stub. @askviraj/ai-plugins moved to @virajp.dev/claude-plugins; this
// package installs nothing. Every argument is ignored, the pointer goes to
// stderr, and the exit code is 1 so no script mistakes it for a successful run.
import process from "node:process";

process.stderr.write(
  [
    "@askviraj/ai-plugins has moved to @virajp.dev/claude-plugins.",
    "",
    "  pnpx @virajp.dev/claude-plugins --all      # install the plugins",
    "  pnpx @virajp.dev/claude-plugins --help     # everything else",
    "",
    "Repo: https://github.com/virajp/claude-plugins",
    "This package installs nothing and will not be updated again.",
    "",
  ]
    .join("\n"),
);

process.exit(1);
