# import-conversations — Lovable

The project's design tool resolved to `lovable`. **Lovable exposes no review
conversation**, so this path returns `n/a` rather than a payload.

## Why, precisely

Lovable produces a **running application** from a chat that builds it. Its MCP
surface exposes the workspace, the projects, the generated source and
`list_edits` — the record of what *changed*. There is no transcript of design
review: no per-screen comment thread, no annotation surface, nothing that holds
what the user said *about* a design as distinct from what they asked to be
built.

## What to do

Return exactly:

```yaml
harvested: n/a
reason: Lovable exposes no design review conversation — its MCP surface offers
  generated source and an edit history, neither of which is a transcript of
  review remarks.
source:
  tool: lovable
```

That is the whole run. Do not call the Lovable MCP server: there is nothing to
reach, and a call that succeeds at listing projects would still not have found a
conversation.

## Why `list_edits` is not substituted

It is the closest thing Lovable has, and it is still the wrong thing. An edit
record says a component changed; it does not say why, and vwf's pipeline routes
on the *why* — a remark is classified as a bug, a blueprint hole, a UX complaint
or an idea, and an edit's diff supports none of those readings on its own.
Feeding it in would produce a stream of confident-looking items whose
classification was invented here rather than read.

`/skill:feedback` does hold that an edit request is itself a signal — but that
holds where the request was **said**, in a conversation, alongside the reasoning
that makes it routable. A bare commit is not that.

If this changes — Lovable adding a comment or review surface — this file is
where it lands, and `harvested: ok` becomes reachable for it without vwf
changing at all. That is the point of the adapter.
