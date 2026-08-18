/**
 * The flag surface, parsed by the platform.
 *
 * **`node:util`'s `parseArgs` replaced `citty`, and the reason was a bug rather
 * than a preference.** citty's `ArgType` is `boolean | string | enum |
 * positional` — no array kind — so a repeated flag is not expressible in it at
 * all and the last occurrence silently wins. `--user vwf --user devtools`
 * installed only `devtools` and said nothing about the name it dropped.
 *
 * **No flag here is repeatable any more**, because the three that were —
 * `--user`, `--project`, `--platform` — all named plugins or targets, and this
 * CLI installs neither. `parseArgs` stays regardless: it is the platform, it
 * costs no dependency, and it works on this package's `engines.node` floor
 * (verified on 18.20.8). Should a repeatable flag return, `multiple: true` is
 * already the answer.
 *
 * Two things citty did that the platform does not, both handled here:
 *
 * - **Boolean negation.** There is no `negativeDescription`, so `--no-statusline`
 *   is declared as its own flag and the pair is folded back into one tri-state
 *   by `statuslineFlag`.
 * - **Usage rendering.** `renderUsage` below is ours. It is not a loss: the
 *   no-request path has to print help anyway, so this was going to exist.
 *
 * `strict` is on, so an unknown flag is an **error naming itself** rather than
 * a silent no-op. That is what makes a retired flag legible instead of ignored,
 * and five have now been retired at once — `--all`, `--user`, `--project`,
 * `--platform` and `--force` — so the failure mode matters more than it did.
 */
import { parseArgs } from "node:util";

/** One row of the flag table: what it does, and how it is spelled in help. */
interface FlagDoc {
  readonly display: string;
  readonly description: string;
}

/**
 * The single source for both parsing and help.
 *
 * Kept as one table so a flag cannot be parsed but undocumented, or documented
 * but unparsed — the drift citty's separate `description` field invited.
 */
const FLAGS: readonly FlagDoc[] = [
  {
    display: "--statusline",
    description:
      "Install the statusline, and consent to replacing one already there",
  },
  { display: "--no-statusline", description: "Skip the statusline" },
  {
    display: "--uninstall",
    description:
      "List everything this toolkit installed and remove what you do not "
      + "deselect",
  },
  {
    display: "--dry-run",
    description: "Show the full diff without writing anything",
  },
  {
    display: "--force",
    description: "Act even though Claude Code is not on PATH",
  },
  {
    display: "-v, --version",
    description:
      "Report this CLI's version, the statusline installed on disk, and the "
      + "plugins available on main",
  },
  { display: "-h, --help", description: "Show this help" },
];

const OPTIONS = {
  statusline: { type: "boolean" },
  "no-statusline": { type: "boolean" },
  uninstall: { type: "boolean" },
  "dry-run": { type: "boolean" },
  force: { type: "boolean" },
  version: { type: "boolean", short: "v" },
  // Declared rather than special-cased: `strict` rejects anything undeclared,
  // so an undeclared `--help` would error instead of helping.
  help: { type: "boolean", short: "h" },
} as const;

export interface Args {
  /**
   * Tri-state: `true` asks, `false` refuses, `undefined` is unset.
   *
   * Unset used to defer to `--all`; with `--all` retired there is nothing left
   * to defer to, so unset now means "the run said nothing about the bar" — which
   * on an install run is a request for the help text.
   */
  readonly statusline: boolean | undefined;
  readonly uninstall: boolean;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly version: boolean;
  readonly help: boolean;
}

/**
 * Fold `--statusline` / `--no-statusline` back into one tri-state.
 *
 * The distinction is still load-bearing: an explicit `--statusline` is the only
 * consent to replace a statusline this installer did not write, and it is also
 * what clears a refusal remembered by an earlier version. Collapsing the pair to
 * a plain boolean would lose both.
 *
 * Both at once is a contradiction, and refusal wins: it is the answer that
 * changes nothing on the machine.
 */
export function statuslineFlag(
  yes: boolean | undefined,
  no: boolean | undefined,
): boolean | undefined {
  if (no === true) {
    return false;
  }
  return yes === true ? true : undefined;
}

/**
 * Parse argv, or throw with a message worth printing.
 *
 * Defaults are applied here rather than declared per flag, so every consumer
 * sees settled values and never `undefined` for a boolean.
 */
export function parse(argv: readonly string[]): Args {
  const { values } = parseArgs({
    args: [...argv],
    options: OPTIONS,
    strict: true,
    allowPositionals: false,
  });
  return {
    statusline: statuslineFlag(values.statusline, values["no-statusline"]),
    uninstall: values.uninstall === true,
    dryRun: values["dry-run"] === true,
    force: values.force === true,
    version: values.version === true,
    help: values.help === true,
  };
}

/** The help text, printed on `--help` and on any run that does nothing. */
export function renderUsage(): string {
  const width = Math.max(...FLAGS.map(f => f.display.length));
  const wrap = (text: string, indent: number): string => {
    const limit = 78 - indent;
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      if (line.length > 0 && line.length + 1 + word.length > limit) {
        lines.push(line);
        line = word;
      }
      else {
        line = line.length === 0 ? word : `${line} ${word}`;
      }
    }
    lines.push(line);
    return lines.join(`\n${" ".repeat(indent)}`);
  };

  const rows = FLAGS.map(flag =>
    `  ${flag.display.padEnd(width)}  ${wrap(flag.description, width + 4)}`
  );
  return [
    "Install the virajp-plugins statusline, and wire graphify for it",
    "",
    "USAGE",
    "  ai-plugins [options]",
    "",
    "OPTIONS",
    ...rows,
    "",
    "PLUGINS",
    "  Installed by Claude Code itself, from this repo on GitHub:",
    "",
    "    claude plugin marketplace add virajp/ai-plugins",
    "    claude plugin install vwf@virajp-plugins",
    "",
    "  Installing vwf pulls in devtools. Upgrade with",
    "  `claude plugin marketplace update virajp-plugins` then",
    "  `claude plugin update <name>`.",
    "",
  ]
    .join("\n");
}
