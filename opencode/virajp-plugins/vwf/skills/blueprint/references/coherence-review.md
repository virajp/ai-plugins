# Coherence Review — Dispatch Shape (§8)

Read this at §8, when the worklist is otherwise empty and the whole-product
coherence review is about to run. A pass that is still working the worklist does
not need it.

Pass the reviewer **paths, not contents**: the `docs/blueprint/` root, the
goal-anchor list (names only), the registry block, the names-only flow and
entity lists, and the `apis/` file list (plus `apis/released/` when present). It
returns `NO GAPS` or a numbered gap list.

## Choose the shape by bundle size

- **≤ 6 flows** → one reviewer at scope `full`. Sharding a small bundle costs
  more than it saves.
- **more than 6 flows** → shard: one `flow-walk <flow>` reviewer per flow plus
  exactly one `bundle` reviewer, **all dispatched in a single message** so they
  run concurrently. The `flow-walk` shards each walk one flow end-to-end across
  its entities, schemas, and API contracts; the `bundle` shard owns every check
  that compares flows to each other (goal coverage, cross-flow consistency,
  entities and the `erDiagram`, API contracts, bundle hygiene). Merge the
  returns into one gap list — the shard prefixes keep them unambiguous.
