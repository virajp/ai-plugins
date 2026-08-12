/**
 * The flag surface, parsed by the platform.
 *
 * **This replaced `citty`, and the reason is a bug rather than a preference.**
 * citty's `ArgType` is `boolean | string | enum | positional` — there is no
 * array kind — so a repeated flag is not expressible in it at all and the last
 * occurrence silently wins. Three of the ten flags here are documented as
 * repeatable, so `--user vwf --user devtools` installed only `devtools` and
 * said nothing about the name it dropped. `index.ts` even carried a comment
 * asserting the opposite, most likely because citty's `ParsedArgs` includes
 * `string[]` in its index signature while no `ArgType` can ever produce one.
 *
 * `node:util`'s `parseArgs` has `multiple: true`, which is exactly the missing
 * feature, and it is verified working on **Node 18.20.8** — this package's
 * `engines.node` floor — so nothing had to move to gain it. It also drops a
 * runtime dependency from the published package rather than swapping one in.
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
 * a silent no-op. That is a real gain over what citty did — a retired flag like
 * `--upgrade` now says so instead of being ignored.
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
    display: "--all",
    description: "Install the default set at user scope: vwf, devtools",
  },
  {
    display: "--user <name>",
    description: "Install a plugin at user scope (repeatable)",
  },
  {
    display: "--project <name>",
    description: "Install a plugin at project scope (repeatable)",
  },
  {
    display: "--platform <target>",
    description:
      "Target an agent: claude, cursor, ohmypi, opencode (repeatable). "
      + "Defaults to every one installed",
  },
  {
    display: "--statusline",
    description:
      "Install the statusline, and consent to replacing one already there",
  },
  { display: "--no-statusline", description: "Skip the statusline" },
  {
    display: "--uninstall",
    description: "Undo a previous install, from its receipt",
  },
  {
    display: "--dry-run",
    description: "Show the full diff without writing anything",
  },
  {
    display: "--force",
    description: "Act on a target whose tool is not on PATH",
  },
  {
    display: "-v, --version",
    description: "Report this CLI's version and every plugin's, vs the latest",
  },
  { display: "-h, --help", description: "Show this help" },
];

const OPTIONS = {
  all: { type: "boolean" },
  user: { type: "string", multiple: true },
  project: { type: "string", multiple: true },
  platform: { type: "string", multiple: true },
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
  readonly all: boolean;
  readonly user: readonly string[];
  readonly project: readonly string[];
  readonly platform: readonly string[];
  /** Tri-state: `true` asks, `false` refuses, `undefined` defers to `--all`. */
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
 * The distinction is load-bearing twice over: unset defers to `--all`, and an
 * explicit `--statusline` is the *only* consent to replace a statusline this
 * installer did not write. Collapsing the pair to a plain boolean would lose
 * both, which is why citty's flag carried no `default` either.
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
    all: values.all === true,
    user: values.user ?? [],
    project: values.project ?? [],
    platform: values.platform ?? [],
    statusline: statuslineFlag(values.statusline, values["no-statusline"]),
    uninstall: values.uninstall === true,
    dryRun: values["dry-run"] === true,
    force: values.force === true,
    version: values.version === true,
    help: values.help === true,
  };
}

/** The help text, printed on `--help` and on any run that installs nothing. */
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
    "Install the virajp-plugins toolkit across AI coding agents",
    "",
    "USAGE",
    "  ai-plugins [options]",
    "",
    "OPTIONS",
    ...rows,
    "",
  ]
    .join("\n");
}
