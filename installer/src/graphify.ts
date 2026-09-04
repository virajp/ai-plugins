/**
 * Wiring graphify, which vwf treats as mandatory.
 *
 * This is not a nicety. vwf's graphify protocol is enforced at its own entry
 * gate: `/vwf:doctor` reports a missing CLI or a missing graph as **blocking**,
 * and both `setup` and `execute` halt on one. So a machine with vwf and no
 * graphify wiring has a plugin that refuses to run — the worst shape of failure,
 * because nothing connects it back to the install.
 *
 * Both commands are idempotent, so re-running self-heals a setup the user has
 * since broken.
 *
 * **It used to run only for targets that had just taken a vwf install**, and
 * neither half of that condition exists any more: plugins are installed by
 * `claude plugin install`, which this CLI never sees, and
 * `graphify install --platform opencode` went with the OpenCode support. So this
 * runs whenever a run reaches it, for Claude alone. Wiring graphify on a machine
 * with no vwf costs an idempotent no-op; *not* wiring it on a machine that has
 * vwf costs every vwf command.
 */
import type { Context } from "./context.ts";
import { hasBin } from "./context.ts";

/**
 * Run graphify's own setup.
 *
 * Soft-skips throughout, and that matters more than it did. The `requires:`
 * install gate used to refuse a vwf install with no `graphify` on PATH, so
 * reaching this without it meant the gate had been bypassed; that gate is gone
 * with the plugin installs, so an absent graphify is now the ordinary case on a
 * machine installing a plugin that does not need it. Failing the run for it
 * would refuse an install that otherwise succeeded, over a tool the user may not
 * want. `/vwf:doctor` is what reports it as blocking, for the plugin that does.
 */
export function setupGraphify(
  context: Context,
  // Injected so a test can decide graphify is absent without touching PATH —
  // it is installed on the machine this is developed on, which would make the
  // soft-skip path untestable.
  onPath: (bin: string) => boolean = hasBin,
): void {
  if (!onPath("graphify")) {
    context.log(
      "graphify is not on PATH — skipping its setup; vwf will report this as "
        + "blocking until you install it and re-run",
    );
    return;
  }

  const install = ["install", "--platform", "claude"];
  const installed = context.exec("graphify", install);
  context.log(
    installed.status === 0
      ? "graphify: wired for claude"
      : `graphify ${install.join(" ")} failed: ${
        installed.stderr.trim() || installed.stdout.trim()
      }`,
  );

  // `graphify hook install` attaches a post-commit hook, so it only means
  // anything inside a work tree. Outside one it is a skip, not a failure — the
  // CLI is frequently run from a home directory.
  if (!inGitRepo(context)) {
    context.log(
      "graphify: not inside a git repository — skipping the post-commit hook",
    );
    return;
  }
  const hook = ["hook", "install"];
  const hooked = context.exec("graphify", hook);
  context.log(
    hooked.status === 0
      ? "graphify: post-commit hook installed"
      : `graphify ${hook.join(" ")} failed: ${
        hooked.stderr.trim() || hooked.stdout.trim()
      }`,
  );
}

function inGitRepo(context: Context): boolean {
  return context
    .exec("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: context.cwd,
    })
    .status === 0;
}
