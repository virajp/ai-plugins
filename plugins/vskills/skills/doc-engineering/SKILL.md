---
name: v-doc-engineering
description: Use when backend or frontend engineering documentation needs to be
  written or updated for an entity in the 95octane workspace. Requires product
  docs to exist. NOT auto-triggered.
---

# v-doc-engineering — Engineering Documentation

Writes or updates engineering docs for an entity. Covers backend (schemas, API
spec, workflows) and frontend (screens, state, navigation). Each path runs
independently — run one, both, or neither depending on feature scope.

## Doc Paths

| Doc type       | Path                                                   |
| -------------- | ------------------------------------------------------ |
| Product        | `docs/product/` (prerequisite — read-only here)        |
| Backend Engr.  | `docs/engineering/` (common/, service/, worker/, web/) |
| Frontend Engr. | `docs/engineering/frontend/<entity>.md`                |
| Schema         | `docs/engineering/common/schemas/<entity>.md`          |
| API spec       | `docs/engineering/service/api/<entity>.md`             |
| Workflows      | `docs/engineering/worker/workflows/<entity>.md`        |
| Templates      | `.claude/skills/v-doc-engineering/templates/`          |

## Halt Condition

**Both paths:** halt if `docs/product/<entity>/` does not exist. Tell the user:
"No product doc found. Run `v-doc-product` first."

## Which Path to Run

| User request          | Run                 |
| --------------------- | ------------------- |
| Backend-only feature  | Backend only        |
| Frontend-only feature | Frontend only       |
| Full-stack feature    | Both (either order) |
| Unclear               | Ask one question    |

**Before executing:** read the corresponding sub-file listed below.

| Path     | Sub-file      |
| -------- | ------------- |
| Backend  | `backend.md`  |
| Frontend | `frontend.md` |
