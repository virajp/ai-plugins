/**
 * The flag surface, parsed by the platform.
 *
 * **`node:util`'s `parseArgs` replaced `citty`, and the reason was a bug rather
 * than a preference.** citty's `ArgType` is `boolean | string | enum |
 * positional` — no array kind — so a repeated flag is not expressible in it at
 * all and the last occurrence silently wins. `--user vwf --user stackgen`
 * installed only `stackgen` and said nothing about the name it dropped.
 *
 * **`--user` and `--project` are repeatable again**, and `multiple: true` is
 * the sanctioned mechanism — the array kind citty could not express, which is
 * how `--user vwf --user stackgen` once installed only `stackgen` and said
 * nothing about the name it dropped. `parseArgs` stays regardless: it is the
 * platform, it costs no dependency, and it works on this package's
 * `engines.node` floor (verified on 18.20.8).
 *
 * The one thing citty did that the platform does not is **usage rendering**, so
 * `renderUsage` below is ours. It is not a loss: the no-request path has to
 * print help anyway, so this was going to exist.
 *
 * `strict` is on, so an unknown flag is an **error naming itself** rather than
 * a silent no-op. That is what makes a retired flag legible instead of ignored
 * — which is how `--platform`, `--upgrade`, `--force` and `--statusline` all
 * answer.
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
    description:
      "Install the default plugin set (vwf, user scope) via claude plugin "
      + "install",
  },
  {
    display: "--user <name>",
    description: "Install a plugin at user scope; repeatable",
  },
  {
    display: "--project <name>",
    description: "Install a plugin at project scope, for this repo only; "
      + "repeatable",
  },
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
    display: "-v, --version",
    description: "Report this CLI's version and the plugins available on main",
  },
  { display: "-h, --help", description: "Show this help" },
];

const OPTIONS = {
  all: { type: "boolean" },
  user: { type: "string", multiple: true },
  project: { type: "string", multiple: true },
  uninstall: { type: "boolean" },
  "dry-run": { type: "boolean" },
  version: { type: "boolean", short: "v" },
  // Declared rather than special-cased: `strict` rejects anything undeclared,
  // so an undeclared `--help` would error instead of helping.
  help: { type: "boolean", short: "h" },
} as const;

export interface Args {
  /** Install the default plugin set (`DEFAULT_INSTALL`) at user scope. */
  readonly all: boolean;
  /** Plugins to install at user scope, in the order given. */
  readonly user: readonly string[];
  /** Plugins to install at project scope, in the order given. */
  readonly project: readonly string[];
  readonly uninstall: boolean;
  readonly dryRun: boolean;
  readonly version: boolean;
  readonly help: boolean;
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
    uninstall: values.uninstall === true,
    dryRun: values["dry-run"] === true,
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
    "Install the virajp-plugins plugins, and wire graphify",
    "",
    "USAGE",
    "  claude-plugins [options]",
    "",
    "OPTIONS",
    ...rows,
    "",
    "PLUGINS",
    "  Installed by driving Claude Code's own commands, from this repo on",
    "  GitHub — the manual equivalent of --user vwf is:",
    "",
    "    claude plugin marketplace add virajp/claude-plugins",
    "    claude plugin install vwf@virajp-plugins",
    "",
    "  Installing vwf pulls in stackgen. Upgrade with",
    "  `claude plugin marketplace update virajp-plugins` then",
    "  `claude plugin update <name>`.",
    "",
  ]
    .join("\n");
}
