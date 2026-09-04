import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// The one collection: the markdown that moved in from docs/{plugins,how-to,
// installer}. Ids are the file path under the base without `.md`
// (`plugins/vwf`, `how-to/index`, `how-to/greenfield/single-repo`); routes.ts
// turns an id into its URL. `generateId` keeps the `index` segment the
// loader's default would strip, so an id always names its file.
const docs = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/docs",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int(),
  }),
});

export const collections = { docs };
