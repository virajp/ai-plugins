// Generated from templates/typescript/hooks/hooks.yaml — do not edit.
import { spawn } from "node:child_process";

const COMMAND = ["%%AI_PLUGINS_ROOT:typescript%%/hooks/npm-normalize.sh"];
const MATCHER = "bash";
const ACTION = "rewrite";
const CORRECTION = "This repo uses pnpm or bun, never npm. Reissue the command with the repo's package manager.";

export const typescriptNpmNormalize = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    if (MATCHER !== null && input.tool !== MATCHER) {
      return;
    }

    const args = output?.args ?? {};
    const response = await run(
      JSON.stringify({
        hook_event_name: "preToolUse",
        tool_name: input.tool,
        tool_input: args,
        cwd: directory,
      }),
      directory,
    );
    if (response === null) {
      return;
    }

    const decision = response.hookSpecificOutput ?? {};
    if (decision.permissionDecision === "deny") {
      throw new Error(decision.permissionDecisionReason ?? CORRECTION);
    }
    // Mutating `output.args` in place is the whole reason a rewrite needs no
    // correction message on this target.
    if (ACTION === "rewrite" && decision.updatedInput) {
      Object.assign(args, decision.updatedInput);
    }
  },
});

/** Run the hook command with the payload on stdin; null when it says nothing. */
function run(payload, cwd) {
  return new Promise(resolve => {
    const child = spawn(COMMAND[0], COMMAND.slice(1), {
      cwd,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let out = "";
    child.stdout.on("data", chunk => {
      out += chunk;
    });
    // A hook must never take the session down with it: an unreadable answer is
    // the same as no answer.
    child.on("error", () => resolve(null));
    child.on("close", () => {
      try {
        resolve(JSON.parse(out));
      }
      catch {
        resolve(null);
      }
    });
    child.stdin.end(payload);
  });
}
