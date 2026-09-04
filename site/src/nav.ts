import { routeFor } from "./lib/routes.ts";

/**
 * The sidebar model. Three sections in a fixed order, each mirroring one
 * directory of the docs collection; the Guides section has three groups, one
 * per subdirectory. Entries come from the collection at build time and sort
 * by their frontmatter `order`. A section's `index.md` is the section's own
 * link, never a child.
 */

export interface NavEntry {
  id: string;
  route: string;
  title: string;
  description: string;
  order: number;
}

export interface NavGroup {
  key: string;
  label: string;
  entries: NavEntry[];
}

export interface NavSection {
  key: string;
  label: string;
  route: string;
  index: NavEntry | null;
  entries: NavEntry[];
  groups: NavGroup[];
}

/** The shape of a docs collection entry this module reads. */
export interface DocEntry {
  id: string;
  data: { title: string; description: string; order: number; };
}

const SECTIONS: {
  key: string;
  label: string;
  groups: { key: string; label: string; }[];
}[] = [
  { key: "plugins", label: "Plugins", groups: [] },
  {
    key: "how-to",
    label: "Guides",
    groups: [
      { key: "greenfield", label: "Starting fresh" },
      { key: "brownfield", label: "Adopting vwf" },
      { key: "operate", label: "Operating" },
    ],
  },
  { key: "installer", label: "Installer", groups: [] },
];

const byOrder = (a: NavEntry, b: NavEntry) => a.order - b.order;

export function buildNav(entries: DocEntry[]): NavSection[] {
  const sections: NavSection[] = SECTIONS.map(s => ({
    key: s.key,
    label: s.label,
    route: routeFor(`${s.key}/index`),
    index: null,
    entries: [],
    groups: s.groups.map(g => ({ key: g.key, label: g.label, entries: [] })),
  }));

  for (const entry of entries) {
    const parts = entry.id.split("/");
    const section = sections.find(s => s.key === parts[0]);
    if (!section) {
      throw new Error(
        `nav: "${entry.id}" is not under a known section (${
          SECTIONS
            .map(s => s.key)
            .join(", ")
        })`,
      );
    }
    const nav: NavEntry = {
      id: entry.id,
      route: routeFor(entry.id),
      title: entry.data.title,
      description: entry.data.description,
      order: entry.data.order,
    };
    if (parts.length === 2 && parts[1] === "index") {
      section.index = nav;
    }
    else if (parts.length === 2) {
      section.entries.push(nav);
    }
    else if (parts.length === 3) {
      const group = section.groups.find(g => g.key === parts[1]);
      if (!group) {
        throw new Error(
          `nav: "${entry.id}" is under an unknown group of ${section.key}`,
        );
      }
      group.entries.push(nav);
    }
    else {
      throw new Error(
        `nav: "${entry.id}" nests deeper than section/group/page`,
      );
    }
  }

  for (const section of sections) {
    section.entries.sort(byOrder);
    for (const group of section.groups) {
      group.entries.sort(byOrder);
    }
  }
  return sections;
}

/** Every entry in reading order: section by section, index first, then groups. */
export function flatten(nav: NavSection[]): NavEntry[] {
  const out: NavEntry[] = [];
  for (const section of nav) {
    if (section.index) {
      out.push(section.index);
    }
    out.push(...section.entries);
    for (const group of section.groups) {
      out.push(...group.entries);
    }
  }
  return out;
}

export interface Located {
  section: NavSection;
  group: NavGroup | null;
  entry: NavEntry | null;
}

/** Where an id sits: its section, its group if any, and its entry. */
export function locate(nav: NavSection[], id: string): Located | null {
  const [key, ...rest] = id.split("/");
  const section = nav.find(s => s.key === key);
  if (!section) {
    return null;
  }
  const group = rest.length === 2
    ? section.groups.find(g => g.key === rest[0]) ?? null
    : null;
  const entry = flatten([section]).find(e => e.id === id) ?? null;
  return { section, group, entry };
}

/** The previous and next entries in reading order, or null at either end. */
export function prevNext(
  nav: NavSection[],
  id: string,
): { prev: NavEntry | null; next: NavEntry | null; } {
  const all = flatten(nav);
  const i = all.findIndex(e => e.id === id);
  if (i === -1) {
    return { prev: null, next: null };
  }
  return { prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}
