/**
 * Wiring graphify, which vwf treats as mandatory.
 *
 * This is not a nicety. vwf's graphify protocol is enforced at its own entry
 * gate: `/vwf:doctor` reports a missing CLI or a missing graph as **blocking**,
 * and both `setup` and `execute` halt on one. So a vwf install that skips this
 * step succeeds and produces a plugin that refuses to run — the worst shape of
 * failure, because nothing connects it back to the install.
 *
 * Both commands are idempotent, so re-running on every install or upgrade
 * self-heals a setup the user has since broken.
 */
import { hasBin } from "./adapters/support.ts";
import type { AdapterContext } from "./adapters/types.ts";

/** The targets graphify itself knows how to install into. */
const SUPPORTED = new Set(["claude", "opencode"]);

/**
 * Run graphify's setup for each target that supports it.
 *
 * Soft-skips throughout. The dependency gate already refuses a vwf install with
 * no `graphify` on PATH, so reaching this without it means the gate was bypassed
 * (`--force`, or an upgrade), and failing the whole run at that point would undo
 * an install that otherwise succeeded.
 */
export function setupGraphify(
  context: AdapterContext,
  targets: readonly string[],
  // Injected so a test can decide graphify is absent without touching PATH —
  // it is installed on the machine this is developed on, which would make the
  // soft-skip path untestable.
  onPath: (bin: string) => boolean = hasBin,
): void {
  const applicable = targets.filter(t => SUPPORTED.has(t));
  if (applicable.length === 0) {
    return;
  }
  if (!onPath("graphify")) {
    context.log(
      "graphify is not on PATH — skipping its setup; vwf will report this as "
        + "blocking until you install it and re-run",
    );
    return;
  }

  for (const target of applicable) {
    const install = ["install", "--platform", target];
    const result = context.exec("graphify", install);
    if (result.status !== 0) {
      context.log(
        `graphify ${install.join(" ")} failed: ${
          result.stderr.trim() || result.stdout.trim()
        }`,
      );
      continue;
    }
    context.log(`graphify: wired for ${target}`);
  }

  // `graphify hook install` attaches a git post-commit hook, so it only means
  // anything inside a work tree. Outside one it is a skip, not a failure — the
  // CLI is frequently run from a home directory.
  if (!inGitRepo(context)) {
    context.log(
      "graphify: not inside a git repository — skipping the post-commit hook",
    );
    return;
  }
  const hook = ["hook", "install"];
  const result = context.exec("graphify", hook);
  context.log(
    result.status === 0
      ? "graphify: post-commit hook installed"
      : `graphify ${hook.join(" ")} failed: ${
        result.stderr.trim() || result.stdout.trim()
      }`,
  );
}

function inGitRepo(context: AdapterContext): boolean {
  return context
    .exec("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: context.cwd,
    })
    .status === 0;
}
