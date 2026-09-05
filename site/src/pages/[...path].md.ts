import type {
  APIContext,
  InferGetStaticPropsType,
} from "astro";
import { getCollection } from "astro:content";

import { mirrorOf } from "../lib/markdown.ts";

// The markdown mirror: one route per docs entry, at the entry's own id plus
// `.md` — `plugins/vwf` → /plugins/vwf.md. An endpoint whose URL carries a
// file extension is served without a trailing slash whatever `trailingSlash`
// says. The generated `/plugins/` section index has no source file, so it
// has no mirror.
export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map(entry => ({
    params: { path: entry.id },
    props: { entry },
  }));
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export function GET({ props, site }: APIContext<Props>): Response {
  if (!site) {
    throw new Error("markdown mirror: astro.config.ts has no `site`");
  }
  return new Response(mirrorOf(props.entry, site), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
