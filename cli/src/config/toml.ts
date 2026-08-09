/**
 * Edits to TOML files, for any target whose config is TOML.
 *
 * **No adapter uses it today** — the one that did has been dropped. It stays
 * beside the JSON and JSONC editors as the third config format an adapter may
 * meet.
 *
 * **This is not a format-preserving parser, and cannot be one.** `smol-toml`
 * parses to plain data and stringifies from it; a round-trip drops comments and
 * normalises layout, exactly like `JSON.parse`/`stringify`. The `yaml` and
 * `jsonc-parser` cases keep a CST, so they can splice. TOML has no equivalent
 * here.
 *
 * So this does surgical *text* edits instead: it locates the `[table]` a key
 * belongs to and rewrites or appends within it, leaving every other byte —
 * including every comment — untouched. `smol-toml` is used only to *read*, and
 * to validate that what we produced still parses.
 *
 * The trade-off is deliberate. Only whole-table writes are supported, which is
 * all this CLI needs (`[mcp_servers.<name>]` and friends). Anything more
 * elaborate should read, ask the user, and rewrite explicitly rather than
 * pretending a merge is lossless.
 */
import {
  parse as parseToml,
  stringify as stringifyToml,
} from "smol-toml";

/** Parse TOML, or `undefined` when it cannot be read. */
export function readToml<T = unknown>(text: string): T | undefined {
  try {
    return parseToml(text) as T;
  }
  catch {
    return undefined;
  }
}

/**
 * Insert or replace a whole `[header]` table, preserving the rest of the file.
 *
 * The table body is rendered by `smol-toml`, so only the block we own is
 * normalised. An existing table with the same header is replaced in place,
 * keeping its position — appending a duplicate would be a parse error.
 */
export function setTomlTable(
  text: string,
  header: string,
  table: Record<string, unknown>,
): string {
  const body = stringifyToml(table).trimEnd();
  const block = body.length > 0
    ? `[${header}]\n${body}\n`
    : `[${header}]\n`;

  const found = findTable(text, header);
  if (found === null) {
    const separator = text.length === 0 || text.endsWith("\n\n")
      ? ""
      : text.endsWith("\n")
      ? "\n"
      : "\n\n";
    return `${text}${separator}${block}`;
  }
  return text.slice(0, found.start) + block + text.slice(found.end);
}

/** Remove a `[header]` table entirely. Absent is not an error. */
export function deleteTomlTable(text: string, header: string): string {
  const found = findTable(text, header);
  if (found === null) {
    return text;
  }
  const before = text.slice(0, found.start);
  const after = text.slice(found.end);
  // Collapse the blank line the removed block leaves behind.
  return `${before.replace(/\n{2,}$/, "\n")}${after}`;
}

/** Does this document carry comments a rewrite would destroy? */
export function hasComments(text: string): boolean {
  return text
    .split("\n")
    .some(line => line.trimStart().startsWith("#"));
}

/**
 * The byte range of a `[header]` table: from its header line to just before the
 * next header at any level, or end of file.
 */
function findTable(
  text: string,
  header: string,
): { start: number; end: number; } | null {
  const lines = text.split("\n");
  const wanted = `[${header}]`;

  let start = -1;
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (start === -1) {
      if (trimmed === wanted) {
        start = offset;
      }
    }
    else if (trimmed.startsWith("[")) {
      return { start, end: offset };
    }
    offset += line.length + 1;
  }
  return start === -1 ? null : { start, end: text.length };
}
