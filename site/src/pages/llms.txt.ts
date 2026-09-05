import type { APIContext } from "astro";
import { getCollection } from "astro:content";

import { markdownUrlFor } from "../lib/markdown.ts";
import {
  buildNav,
  flatten,
} from "../nav.ts";

// /llms.txt, per llmstxt.org: the site in one page an agent can read first —
// the same one-line pitch the landing carries, a pointer at the full text,
// and every manual page as its markdown URL, in sidebar order.
const DESCRIPTION =
  "An opinionated Claude Code plugin: Product, Blueprint, Plan, Execute. "
  + "Asks one question at a time, then builds unattended.";

export async function GET({ site }: APIContext): Promise<Response> {
  if (!site) {
    throw new Error("llms.txt: astro.config.ts has no `site`");
  }
  const nav = buildNav(await getCollection("docs"));

  const lines = [
    "# vwf",
    "",
    `> ${DESCRIPTION}`,
    "",
    `The whole manual in one file: ${site.origin}/llms-full.txt. Every page `
    + "below also exists at its .md URL.",
  ];
  for (const section of nav) {
    lines.push("", `## ${section.label}`, "");
    for (const entry of flatten([section])) {
      lines.push(
        `- [${entry.title}](${
          markdownUrlFor(entry.id, site)
        }): ${entry.description}`,
      );
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
