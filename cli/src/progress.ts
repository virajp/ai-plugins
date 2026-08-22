/**
 * The live indicator, shown while a run is working.
 *
 * **Deliberately not an animated spinner.** Every step shells out through
 * `spawnSync`, which blocks the event loop for the whole of each `claude` or
 * `graphify` invocation — so a `setInterval` spinner would stop on one frame for
 * exactly the seconds it is meant to reassure you, and a frozen spinner reads
 * as a hang rather than as work. What moves here is the *step*, which advances
 * only when something real has finished.
 *
 * It writes to **stderr**, like the report it precedes, so stdout stays
 * parseable for `--dry-run | jq`.
 *
 * Off entirely when stderr is not a TTY. Piped or redirected output has no
 * cursor to rewrite, so the escape codes would land in the file as literal
 * junk and each transient step would be a permanent line — for a run whose
 * result is the table printed at the end anyway.
 */

/** Erase the current line and return the cursor to its start. */
const CLEAR = "\r\u001b[2K";

export interface Progress {
  /** Replace the visible step. */
  step: (label: string) => void;
  /** Erase it, before anything else is written. */
  clear: () => void;
}

export interface ProgressStream {
  write: (chunk: string) => unknown;
  isTTY?: boolean;
}

/** A no-op, so callers never branch on whether progress is on. */
export const SILENT: Progress = { step: () => {}, clear: () => {} };

export function createProgress(
  stream: ProgressStream,
  enabled: boolean = stream.isTTY === true,
): Progress {
  if (!enabled) {
    return SILENT;
  }
  let showing = false;
  return {
    step(label) {
      stream.write(`${showing ? CLEAR : ""}  ⋯ ${label}`);
      showing = true;
    },
    clear() {
      if (showing) {
        stream.write(CLEAR);
        showing = false;
      }
    },
  };
}
