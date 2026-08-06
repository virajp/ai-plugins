/**
 * Format-preserving edits to JSON and JSONC files.
 *
 * The CLI edits files it does not own — `~/.claude/settings.json`,
 * `opencode.jsonc`, `.mcp.json` — which hold the user's own keys, their
 * formatting, and (in JSONC) their comments. `JSON.parse` + `JSON.stringify`
 * would silently reformat all of it and drop every comment, so nothing here
 * round-trips through a plain object.
 *
 * `jsonc-parser` instead computes a minimal set of text edits and splices them
 * in, leaving every byte it did not have to touch exactly as it was.
 */
import {
  type ParseError,
  applyEdits,
  modify,
  parse as parseJsonc,
} from "jsonc-parser";

/**
 * Formatting for inserted content.
 *
 * **Omitted by default, deliberately.** Passing `formattingOptions` makes
 * `modify` run a formatting pass over the edited region, and that pass
 * normalises neighbouring inline objects — editing a top-level key is enough to
 * expand a sibling `"env": { "A": 1 }` onto four lines. With the options
 * omitted, `modify` emits a minimal splice and an add-then-remove round-trip is
 * byte-identical, which is exactly what uninstall has to guarantee.
 *
 * Pass this only when creating a document from nothing, where there is no
 * existing formatting to preserve and compact output would be unreadable.
 */
export interface FormatOptions {
  readonly insertSpaces?: boolean;
  readonly tabSize?: number;
  readonly eol?: string;
}

const NEW_DOCUMENT_FORMAT: Required<FormatOptions> = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

/** `modify` options: format only when the caller asked, or the doc is new. */
function modifyOptions(text: string, format?: FormatOptions) {
  if (format !== undefined) {
    return { formattingOptions: { ...NEW_DOCUMENT_FORMAT, ...format } };
  }
  return text.trim().length === 0
    ? { formattingOptions: NEW_DOCUMENT_FORMAT }
    : {};
}

/**
 * Read a JSONC document, tolerating comments and trailing commas.
 *
 * Returns `undefined` for an unreadable document rather than throwing: callers
 * treat "no usable config" and "no config" the same way, and a malformed file
 * is the user's to fix, not ours to crash on.
 */
export function readJsonc<T = unknown>(text: string): T | undefined {
  const errors: ParseError[] = [];
  const value = parseJsonc(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as T | undefined;
  return errors.length > 0 ? undefined : value;
}

/**
 * Set one value at `path`, returning the new document text.
 *
 * `path` is a key path, with numbers indexing arrays — `["mcp", "context7"]` or
 * `["hooks", "PostToolUse", 0]`. Setting `undefined` removes the key.
 */
export function setJsonPath(
  text: string,
  path: readonly (string | number)[],
  value: unknown,
  format?: FormatOptions,
): string {
  const edits = modify(text, [...path], value, modifyOptions(text, format));
  return applyEdits(text, edits);
}

/** Apply several path edits in order. Later edits see earlier ones applied. */
export function setJsonPaths(
  text: string,
  entries: readonly (readonly [readonly (string | number)[], unknown])[],
  format?: FormatOptions,
): string {
  let out = text;
  for (const [path, value] of entries) {
    out = setJsonPath(out, path, value, format);
  }
  return out;
}

/**
 * Append to an array, skipping values already present.
 *
 * Used for OpenCode's `skills.paths`, which the installer extends without
 * disturbing entries the user (or another tool) put there — the reason this is
 * a targeted append rather than writing the whole array back.
 */
export function appendToJsonArray(
  text: string,
  path: readonly (string | number)[],
  values: readonly unknown[],
  format?: FormatOptions,
): string {
  const existing = readJsonc<Record<string, unknown>>(text);
  const current = existing === undefined
    ? undefined
    : (getPath(existing, path) as unknown[] | undefined);
  const list = Array.isArray(current) ? [...current] : [];

  let changed = false;
  for (const value of values) {
    if (!list.some(item => deepEqual(item, value))) {
      list.push(value);
      changed = true;
    }
  }
  return changed ? setJsonPath(text, path, list, format) : text;
}

/** Remove values from an array, leaving anything else in it untouched. */
export function removeFromJsonArray(
  text: string,
  path: readonly (string | number)[],
  values: readonly unknown[],
  format?: FormatOptions,
): string {
  const existing = readJsonc<Record<string, unknown>>(text);
  const current = existing === undefined
    ? undefined
    : (getPath(existing, path) as unknown[] | undefined);
  if (!Array.isArray(current)) {
    return text;
  }
  const kept = current.filter(item =>
    !values.some(value => deepEqual(item, value))
  );
  return kept.length === current.length
    ? text
    : setJsonPath(text, path, kept, format);
}

/** Does this document carry comments a rewrite would destroy? */
export function hasComments(text: string): boolean {
  // Compare a comment-tolerant parse against a strict one: if the strict parse
  // fails while the tolerant one succeeds, something non-JSON — a comment or a
  // trailing comma — is in there.
  if (readJsonc(text) === undefined) {
    return false;
  }
  try {
    JSON.parse(text);
    return false;
  }
  catch {
    return true;
  }
}

export function getPath(
  root: unknown,
  path: readonly (string | number)[],
): unknown {
  let node = root;
  for (const key of path) {
    if (node === null || typeof node !== "object") {
      return undefined;
    }
    node = (node as Record<string | number, unknown>)[key];
  }
  return node;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }
  if (typeof a !== "object") {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
