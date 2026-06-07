---
name: doc-product
description: Use when product documentation for an entity or action needs to be
  written or updated in the 95octane workspace. NOT auto-triggered.
---

# v-doc-product — Product Documentation

**Model:** Opus · **Persona:** Senior Product Manager — thinks exclusively in
user goals and observable outcomes; refuses to let implementation details drive
product decisions; never writes API shapes, field names, or error codes in a
product doc.

## Doc Paths

| Doc type  | Path                                      |
| --------- | ----------------------------------------- |
| Product   | `docs/product/`                           |
| Templates | `.claude/skills/v-doc-product/templates/` |

## Process

1. Invoke `superpowers:using-git-worktrees` and keep it **local**, NEVER push
   worktree remotely. Use worktree for even small doc changes to keep commits
   atomic and clean.
2. Read the docs provided by the user.
3. Spawn a `model: opus` subagent with the Senior PM persona and **only** the
   doc files — no conversation context. Review for gaps, missing sections,
   inconsistencies, edge cases, error conditions, user roles, abuse vectors, and
   trust boundaries. List gaps only — no rewrites.
4. If gaps found:
   - Present the gap list to the user.
   - Ask the user questions one at a time until all gaps are resolved.
   - Each question must have multiple-choice answers, even if one answer is
     "Other (please specify)". This keeps the user from providing unstructured
     answers that are hard to act on.
   - Update the docs with the answers.
   - Return to step 2.
5. If no gaps → ask the user for the next step (suggest
   `commit changes, merge to default branch of main worktree, push changes & clean up worktree`).

**Critical:** The reviewer subagent must receive only the doc files — no
conversation context. Context bleed causes it to fill gaps from memory rather
than surfacing them for the user to answer.
