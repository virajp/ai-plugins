/**
 * Format-preserving edits to YAML files.
 *
 * `parse()` discards everything that is not data — comments, key order,
 * quoting style, blank lines — so writing a config back through it would
 * rewrite the user's file wholesale. `parseDocument()` keeps the CST, and edits
 * against the Document only disturb the nodes they touch.
 */
import {
  type Document,
  parseDocument,
} from "yaml";

/**
 * Parse a YAML document, or `undefined` when it cannot be read.
 *
 * Unreadable is treated as absent rather than fatal: a malformed config is the
 * user's to fix, and `toString()` would throw on it anyway.
 */
export function readYamlDocument(text: string): Document | undefined {
  const doc = parseDocument(text);
  return doc.errors.length > 0 ? undefined : doc;
}

/** Read a YAML document to plain data, or `undefined` if unreadable. */
export function readYaml<T = unknown>(text: string): T | undefined {
  return readYamlDocument(text)?.toJS() as T | undefined;
}

/**
 * Set one value at `path`, returning the new document text.
 *
 * An empty document is created rather than refused, so a first install does not
 * need a separate "file does not exist" branch.
 */
export function setYamlPath(
  text: string,
  path: readonly (string | number)[],
  value: unknown,
): string {
  const doc = parseDocument(text.length === 0 ? "{}\n" : text);
  if (doc.errors.length > 0) {
    throw new Error(
      `refusing to edit malformed YAML: ${doc.errors[0]?.message}`,
    );
  }
  doc.setIn([...path], value);
  return doc.toString();
}

/** Remove the key at `path`. A path that is not there is not an error. */
export function deleteYamlPath(
  text: string,
  path: readonly (string | number)[],
): string {
  const doc = parseDocument(text);
  if (doc.errors.length > 0) {
    throw new Error(
      `refusing to edit malformed YAML: ${doc.errors[0]?.message}`,
    );
  }
  doc.deleteIn([...path]);
  return doc.toString();
}

/** Read one value out of a YAML document without materialising the whole thing. */
export function getYamlPath(
  text: string,
  path: readonly (string | number)[],
): unknown {
  const doc = readYamlDocument(text);
  return doc?.getIn([...path], false);
}
