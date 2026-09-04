// The link gate over the built site: every site-internal `href` and `src` in
// dist/**/*.html must resolve to a built file, and every `#fragment` to an
// `id` in its target. Node built-ins only; attributes are found by a regex
// scan, which is enough for HTML this site writes itself.
//
// Run from site/ after `astro build` and `pagefind --site dist`:
//   pnpm exec tsx scripts/check-links.ts

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    }
    else if (name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** The URL path of a built page, as the browser sees it. */
function pagePath(file: string): string {
  const rel = path.relative(DIST, file).split(path.sep).join("/");
  return "/"
    + (rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel);
}

/** The file a URL path is served from, or null when nothing is built there. */
function fileFor(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  const candidates = decoded.endsWith("/")
    ? [path.join(DIST, decoded, "index.html")]
    : [
      path.join(DIST, decoded),
      path.join(DIST, decoded, "index.html"),
      path.join(DIST, `${decoded}.html`),
    ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) {
      return c;
    }
  }
  return null;
}

const idCache = new Map<string, Set<string>>();
function idsIn(file: string): Set<string> {
  let ids = idCache.get(file);
  if (!ids) {
    ids = new Set();
    for (
      const m of readFileSync(file, "utf8").matchAll(/\s(?:id|name)="([^"]*)"/g)
    ) {
      ids.add(decode(m[1] ?? ""));
    }
    idCache.set(file, ids);
  }
  return ids;
}

const failures: string[] = [];
let checked = 0;
let fragments = 0;

const pages = walk(DIST);
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const from = pagePath(file);
  const label = path.relative(DIST, file);

  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const raw = decode(m[1] ?? "");
    if (
      raw === "" || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw
        .startsWith("//")
    ) {
      continue;
    }

    checked += 1;
    const url = new URL(raw, `https://site.invalid${from}`);
    const target = fileFor(url.pathname);
    if (!target) {
      failures.push(`${label}: ${raw}`);
      continue;
    }
    if (url.hash.length > 1) {
      fragments += 1;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!target.endsWith(".html") || !idsIn(target).has(id)) {
        failures.push(`${label}: ${raw}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(
    `check-links: ${failures.length} broken link(s) in ${pages.length} page(s):`,
  );
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  process.exit(1);
}
console.log(
  `check-links: ${pages.length} pages, ${checked} internal links, ${fragments} fragments, all resolve.`,
);
