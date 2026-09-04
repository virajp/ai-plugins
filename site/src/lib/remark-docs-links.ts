import {
  existsSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { visit } from "unist-util-visit";

import { routeFor } from "./routes.ts";

// The collection root. Every relative link in the docs must resolve to a file
// or directory under it; one that does not fails the build.
const BASE = fileURLToPath(new URL("../content/docs/", import.meta.url));

interface LinkNode {
  type: "link";
  url: string;
  position?: { start: { line: number; }; };
}

interface Transformable {
  path?: string;
}

/**
 * Rewrites the docs' relative links to site routes at build time, so the
 * markdown keeps working on GitHub while the site serves `/plugins/vwf/`.
 *
 * - `../../plugins/vwf.md#vwfplan` → `/plugins/vwf/#vwfplan`
 * - `./usage.md` → `/installer/usage/`
 * - `../plugins/` (a bare directory) → `/plugins/`
 *
 * Absolute URLs, root-relative paths and same-page anchors pass through
 * untouched. A link that resolves outside `src/content/docs`, or to a file
 * that does not exist, throws with the source file, line and href.
 */
export function remarkDocsLinks() {
  return (tree: unknown, file: Transformable) => {
    visit(tree as any, "link", (node: LinkNode) => {
      const { url } = node;
      if (
        /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("/") || url
          .startsWith("#")
      ) {
        return;
      }

      const source = file.path;
      if (!source) {
        throw new Error(
          `remark-docs-links: no file path for a document linking to "${url}"`,
        );
      }
      const where = `${path.relative(BASE, source)}:${
        node.position?.start.line ?? "?"
      }`;

      const hash = url.indexOf("#");
      const target = hash === -1 ? url : url.slice(0, hash);
      const fragment = hash === -1 ? "" : url.slice(hash);

      const resolved = path.resolve(path.dirname(source), target);
      const rel = path.relative(BASE, resolved);
      if (
        rel === ".." || rel.startsWith(`..${path.sep}`) || path
          .isAbsolute(rel)
      ) {
        throw new Error(
          `remark-docs-links: ${where}: "${url}" resolves outside src/content/docs`,
        );
      }
      if (!existsSync(resolved)) {
        throw new Error(`remark-docs-links: ${where}: "${url}" does not exist`);
      }

      let id: string;
      if (resolved.endsWith(".md")) {
        id = rel.slice(0, -".md".length);
      }
      else if (statSync(resolved).isDirectory()) {
        id = rel === "" ? "index" : `${rel}/index`;
      }
      else {
        throw new Error(
          `remark-docs-links: ${where}: "${url}" is neither a .md file nor a directory`,
        );
      }

      node.url = routeFor(id.split(path.sep).join("/")) + fragment;
    });
  };
}
