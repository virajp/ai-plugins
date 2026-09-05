import type { APIContext } from "astro";
import { getCollection } from "astro:content";

import {
  mirrorOf,
  orderedEntries,
} from "../lib/markdown.ts";

// /llms-full.txt: every mirror concatenated in sidebar order, the same order
// /llms.txt lists, so one fetch is the whole manual.
export async function GET({ site }: APIContext): Promise<Response> {
  if (!site) {
    throw new Error("llms-full.txt: astro.config.ts has no `site`");
  }
  const entries = orderedEntries(await getCollection("docs"));
  const body = entries.map(entry => mirrorOf(entry, site)).join("\n---\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
