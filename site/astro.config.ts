import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import { remarkDocsLinks } from "./src/lib/remark-docs-links.ts";

export default defineConfig({
  // `site` is what @astrojs/sitemap and the canonical URLs are built from.
  site: "https://claude-plugins.virajp.dev",
  // The default, stated: every route is prerendered to dist/ and served by
  // Cloudflare Workers Static Assets with no Worker script (wrangler.jsonc).
  output: "static",
  // One route per file, always `/x/`. Cloudflare's default html_handling
  // redirects the bare form to the slashed one, so a link never 404s on it.
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    // Rewrites every relative `.md` link in the docs collection to its route
    // and fails the build on one that leaves the collection.
    remarkPlugins: [remarkDocsLinks],
    // Heading ids stay Astro's default: GitHub-compatible, trailing hyphens
    // kept, so the docs' cross-links resolve unchanged.
    shikiConfig: {
      theme: "github-dark-default",
      transformers: [
        {
          // Shiki writes the theme's background inline on every <pre>, which
          // no stylesheet rule can beat without `!important`. Drop that one
          // declaration so global.css's `--ink-3` applies; the token colours
          // stay inline on their spans.
          name: "site:strip-pre-background",
          pre(node) {
            const style = String(node.properties.style ?? "");
            const rest = style.replace(/background-color:[^;]*;?/, "").trim();
            node.properties.style = rest === "" ? undefined : rest;
          },
        },
      ],
    },
  },
});
