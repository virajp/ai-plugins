/**
 * The route for a docs collection id. The tree is mirrored with no `docs`
 * prefix, one route per file, trailing slash; a section's `index.md` is the
 * section's own route.
 *
 *   how-to/index                 → /how-to/
 *   plugins/vwf                  → /plugins/vwf/
 *   how-to/greenfield/single-repo → /how-to/greenfield/single-repo/
 *
 * Both the page and the remark link plugin call this, so the two can never
 * disagree.
 */
export function routeFor(id: string): string {
  // Only a whole `index` segment is stripped: `how-to/index` → `how-to`, a
  // bare `index` → the root, and `how-to/reindex` is left alone.
  const stripped = id === "index" ? "" : id.replace(/\/index$/, "");
  return stripped === "" ? "/" : `/${stripped}/`;
}
