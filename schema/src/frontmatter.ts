/**
 * Order-preserving, value-verbatim YAML frontmatter.
 *
 * Renderers must be able to reproduce a source document byte-for-byte while
 * renaming keys and re-encoding a few of them. A full YAML round-trip cannot do
 * that: the authored descriptions are folded scalars wrapped at irregular
 * widths, and no serializer reproduces that folding faithfully.
 *
 * So frontmatter is modelled as an ordered list of `(key, raw)` pairs where
 * `raw` is the exact source text of the value — including any continuation
 * lines. Transformations rename keys and reorder pairs; values pass through
 * untouched unless a target genuinely needs a different one.
 *
 * The semantic view (see `skill.ts` / `agent.ts`) is derived from the same
 * pairs and is what zod validates. Two views, one parse.
 */

/** A single frontmatter entry, preserving the source text of its value. */
export interface Entry {
  readonly key: string;
  /**
   * Everything after `key:` — the remainder of that line plus any continuation
   * lines, joined with newlines. Leading space after the colon is preserved so
   * `emit` is a pure inverse of `parse`.
   */
  readonly raw: string;
}

export interface Document {
  readonly entries: readonly Entry[];
  /** Document body after the closing delimiter, verbatim. */
  readonly body: string;
}

/** A top-level frontmatter key: unindented, `name:`-shaped. */
const KEY_LINE = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/;

/**
 * Split a document into ordered frontmatter entries and its body.
 * Returns `null` when the file has no frontmatter block at all.
 */
export function parse(source: string): Document | null {
  if (!source.startsWith("---\n")) {
    return null;
  }
  // The closing delimiter is a line that is exactly `---`.
  const closing = source.indexOf("\n---\n", 3);
  if (closing === -1) {
    return null;
  }

  const block = source.slice(4, closing + 1);
  const body = source.slice(closing + 5);

  const entries: Entry[] = [];
  let key: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (key !== null) {
      entries.push({ key, raw: buffer.join("\n") });
    }
  };

  for (const line of block.split("\n")) {
    const match = KEY_LINE.exec(line);
    if (match) {
      flush();
      key = match[1]!;
      buffer = [match[2]!];
    }
    else if (key !== null) {
      // Continuation of the current value: folded scalar, block list, or blank.
      buffer.push(line);
    }
    // Lines before the first key (only possible for malformed input) are dropped.
  }
  flush();

  // A trailing newline inside the block leaves an empty final buffer line on the
  // last entry; strip it so `emit` does not accumulate blank lines on re-render.
  const trimmed = entries.map((e, i) =>
    i === entries.length - 1 ? { key: e.key, raw: e.raw.replace(/\n$/, "") } : e
  );

  return { entries: trimmed, body };
}

/** Rebuild a document. `emit(parse(x)) === x` for any well-formed input. */
export function emit(doc: Document): string {
  const block = doc.entries.map(e => `${e.key}:${e.raw}`).join("\n");
  return `---\n${block}\n---\n${doc.body}`;
}

/** Look up one entry's raw value. */
export function get(doc: Document, key: string): string | undefined {
  return doc.entries.find(e => e.key === key)?.raw;
}

/**
 * A scalar value, unfolded to a single logical string.
 *
 * YAML folded scalars join continuation lines with a space. This is lossy by
 * design — use it for the semantic view, never to re-emit.
 */
export function scalar(doc: Document, key: string): string | undefined {
  const raw = get(doc, key);
  if (raw === undefined) {
    return undefined;
  }
  const joined = raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join(" ");
  return unquote(joined);
}

/** A block- or flow-sequence value, as a list of unquoted strings. */
export function sequence(doc: Document, key: string): string[] | undefined {
  const raw = get(doc, key);
  if (raw === undefined) {
    return undefined;
  }

  const inline = raw.trim();
  if (inline.startsWith("[") && inline.endsWith("]")) {
    const inner = inline.slice(1, -1).trim();
    if (inner.length === 0) {
      return [];
    }
    return inner.split(",").map(s => unquote(s.trim()));
  }

  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("- "))
    .map(l => unquote(l.slice(2).trim()));
}

/** Boolean scalar, tolerant of YAML's spellings. */
export function bool(doc: Document, key: string): boolean | undefined {
  const value = scalar(doc, key);
  if (value === undefined) {
    return undefined;
  }
  if (value === "true" || value === "yes") {
    return true;
  }
  if (value === "false" || value === "no") {
    return false;
  }
  return undefined;
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Replace an entry's key, keeping its position and value. */
export function rename(doc: Document, from: string, to: string): Document {
  return {
    ...doc,
    entries: doc.entries.map(
      e => (e.key === from ? { key: to, raw: e.raw } : e),
    ),
  };
}

/** Drop entries by key. */
export function omit(doc: Document, ...keys: readonly string[]): Document {
  const drop = new Set(keys);
  return { ...doc, entries: doc.entries.filter(e => !drop.has(e.key)) };
}

/**
 * Replace one entry's value in place, or append it if absent.
 * `raw` must include the leading space that follows the colon.
 */
export function set(doc: Document, key: string, raw: string): Document {
  const exists = doc.entries.some(e => e.key === key);
  if (exists) {
    return {
      ...doc,
      entries: doc.entries.map(e => (e.key === key ? { key, raw } : e)),
    };
  }
  return { ...doc, entries: [...doc.entries, { key, raw }] };
}

/**
 * Reorder entries to match `order`, appending any key not named there in its
 * original relative position at the end.
 */
export function reorder(doc: Document, order: readonly string[]): Document {
  const rank = new Map(order.map((k, i) => [k, i]));
  const known = doc.entries.filter(e => rank.has(e.key));
  const rest = doc.entries.filter(e => !rank.has(e.key));
  known.sort((a, b) => rank.get(a.key)! - rank.get(b.key)!);
  return { ...doc, entries: [...known, ...rest] };
}
