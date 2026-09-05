// The link gate over the built site, in two passes.
//
// HTML: every site-internal `href` and `src` in dist/**/*.html must resolve to
// a built file, and every `#fragment` to an `id` in its target.
//
// Markdown: every absolute site URL in the mirror (dist/**/*.md, dist/llms.txt
// and dist/llms-full.txt) must resolve the same way, and every docs page must
// point back at its own mirror with a `rel="alternate"` link.
//
// Node built-ins only; attributes are found by a regex scan, which is enough
// for HTML this site writes itself.
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

/** The origin the markdown mirror writes its links against. */
const SITE = "https://claude-plugins.virajp.dev";

/** Pages with no mirror, so no `rel="alternate"` link is expected at all. */
const NO_ALTERNATE = new Set([
  "index.html",
  "404.html",
  "brand/social-preview.html",
]);

/** The generated section index: a page with no source file, so no mirror. */
const NO_MIRROR = "plugins/index.html";

function walk(
  dir: string,
  keep: (name: string) => boolean,
  out: string[] = [],
): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, keep, out);
    }
    else if (keep(name)) {
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

/** A built file's path under `dist/`, slash-separated. */
function distLabel(file: string): string {
  return path.relative(DIST, file).split(path.sep).join("/");
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

/**
 * The `href` of every `<link rel="alternate" type="text/markdown">` in a page.
 * Attributes are matched individually, so their order does not matter.
 */
function markdownAlternates(html: string): string[] {
  const hrefs: string[] = [];
  for (const tag of html.matchAll(/<link\b[^>]*>/g)) {
    const attrs = tag[0];
    if (
      !/\srel="alternate"/.test(attrs)
      || !/\stype="text\/markdown"/.test(attrs)
    ) {
      continue;
    }
    hrefs.push(decode(/\shref="([^"]*)"/.exec(attrs)?.[1] ?? ""));
  }
  return hrefs;
}

const failures: string[] = [];
let checked = 0;
let fragments = 0;

const pages = walk(DIST, name => name.endsWith(".html"));
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

// The markdown pass. A mirror is fetched on its own, so its links are absolute
// site URLs rather than relative paths: strip the origin and resolve what is
// left exactly as the HTML pass does. A `#fragment` is only checkable when the
// target is a built page; on a `.md` target there are no ids to check against.
const mirrors = [
  ...walk(DIST, name => name.endsWith(".md")),
  path.join(DIST, "llms.txt"),
  path.join(DIST, "llms-full.txt"),
];
let markdownLinks = 0;

for (const file of mirrors) {
  const label = distLabel(file);
  if (!existsSync(file)) {
    failures.push(`${label}: not built`);
    continue;
  }

  for (const m of readFileSync(file, "utf8").matchAll(/\]\(([^)]+)\)/g)) {
    const raw = m[1] ?? "";
    if (!raw.startsWith(`${SITE}/`)) {
      continue;
    }

    markdownLinks += 1;
    const url = new URL(raw);
    const target = fileFor(url.pathname);
    if (!target) {
      failures.push(`${label}: ${raw}`);
      continue;
    }
    if (url.hash.length > 1 && target.endsWith(".html")) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!idsIn(target).has(id)) {
        failures.push(`${label}: ${raw}`);
      }
    }
  }
}

// Every page built from a docs entry points at its own mirror. The landing, the
// 404 and the social-preview render source have no mirror, and neither does the
// generated `/plugins/` index — it has no source file to mirror.
let alternates = 0;

for (const file of pages) {
  const label = distLabel(file);
  if (NO_ALTERNATE.has(label)) {
    continue;
  }

  const hrefs = markdownAlternates(readFileSync(file, "utf8"));
  const want = label === NO_MIRROR ? 0 : 1;
  if (hrefs.length !== want) {
    failures.push(
      `${label}: ${hrefs.length} markdown alternate link(s), expected ${want}`,
    );
    continue;
  }
  for (const href of hrefs) {
    const url = new URL(href, `https://site.invalid${pagePath(file)}`);
    if (fileFor(url.pathname)) {
      alternates += 1;
    }
    else {
      failures.push(`${label}: ${href}`);
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
  `check-links: ${pages.length} pages, ${checked} internal links, ${fragments} fragments, `
    + `${mirrors.length} markdown files, ${markdownLinks} markdown links, `
    + `${alternates} alternate links, all resolve.`,
);
