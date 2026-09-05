import path from "node:path/posix";

import {
  type DocEntry,
  buildNav,
  flatten,
} from "../nav.ts";
import { routeFor } from "./routes.ts";

/**
 * The markdown mirror. Every docs collection entry is also served as the
 * authored markdown at its source path plus `.md` — `plugins/vwf` →
 * `/plugins/vwf.md` — so an agent can read the manual without parsing the
 * rendered HTML. `/llms.txt` indexes those URLs and `/llms-full.txt`
 * concatenates them.
 *
 * The mirror is the body as authored, with one difference: relative links
 * are made absolute, because a fetched `.md` has no base to resolve against.
 */

/** The shape of a docs collection entry this module reads. */
export interface MirrorEntry extends DocEntry {
  body?: string;
}

/** The site-relative path of an id's mirror: `plugins/vwf` → `/plugins/vwf.md`. */
export function markdownPathFor(id: string): string {
  return `/${id}.md`;
}

/** The absolute URL of an id's mirror. */
export function markdownUrlFor(id: string, site: URL): string {
  return `${site.origin}${markdownPathFor(id)}`;
}

/**
 * Rewrites every relative link in a body to an absolute URL, resolved
 * against the entry's own source path — the same resolution
 * `remark-docs-links.ts` does for HTML, against ids rather than the disk.
 *
 * - `../../plugins/vwf.md#vwfplan` →
 *   `https://claude-plugins.virajp.dev/plugins/vwf.md#vwfplan`
 * - `../plugins/` (a bare directory) →
 *   `https://claude-plugins.virajp.dev/plugins/`
 *
 * Absolute URLs, root-relative paths and same-page anchors pass through. Any
 * other form throws, so a new kind of link fails the build loudly.
 */
export function rewriteLinks(body: string, id: string, site: URL): string {
  return body.replace(/\]\(([^)]+)\)/g, (whole, target: string) => {
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(target)
      || target.startsWith("/")
      || target.startsWith("#")
    ) {
      return whole;
    }

    const hash = target.indexOf("#");
    const href = hash === -1 ? target : target.slice(0, hash);
    const fragment = hash === -1 ? "" : target.slice(hash);
    const resolved = path.join(path.dirname(id), href);

    if (resolved === ".." || resolved.startsWith("../")) {
      throw new Error(
        `markdown: ${id}: "${target}" resolves outside the docs collection`,
      );
    }
    if (resolved.endsWith(".md")) {
      return `](${site.origin}/${resolved}${fragment})`;
    }
    if (resolved.endsWith("/")) {
      const route = routeFor(`${resolved.slice(0, -1)}/index`);
      return `](${site.origin}${route}${fragment})`;
    }
    throw new Error(
      `markdown: ${id}: "${target}" is neither a .md file nor a directory`,
    );
  });
}

/** One entry's mirror: its title as an H1, then the body, links absolute. */
export function mirrorOf(entry: MirrorEntry, site: URL): string {
  const body = rewriteLinks(entry.body ?? "", entry.id, site);
  return `# ${entry.data.title}\n\n${body.replace(/\n*$/, "")}\n`;
}

/**
 * The whole collection in nav order — the order the sidebar and `/llms.txt`
 * both read in. Every entry must appear exactly once; a collection file the
 * nav cannot place is a build failure, not a silently dropped page.
 */
export function orderedEntries<T extends MirrorEntry>(entries: T[]): T[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const ordered = flatten(buildNav(entries)).map(nav => {
    const entry = byId.get(nav.id);
    if (!entry) {
      throw new Error(`markdown: nav yielded an unknown id "${nav.id}"`);
    }
    return entry;
  });
  if (ordered.length !== entries.length) {
    throw new Error(
      `markdown: nav ordered ${ordered.length} of ${entries.length} entries`,
    );
  }
  return ordered;
}
