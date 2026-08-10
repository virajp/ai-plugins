# Renaming or Removing a Doc (§7)

Read this only when a pass **renames** or **removes** a flow or entity. A pass
that only adds or edits in place does not need it.

Grep `docs/blueprint/` (both catalogs, every flow and entity folder,
`conventions.md`, `environment.md`) and the active plans under `docs/plans/`
(including their `covers:` frontmatter) for inbound links to the old doc.

- **Rename** → update every inbound link (and the catalogs) in this same pass.
- **Delete** → list every inbound link and require the user to resolve each
  (re-point to another doc, or remove it) before the commit. A step or
  relationship pointing at a deleted doc is never left dangling.
