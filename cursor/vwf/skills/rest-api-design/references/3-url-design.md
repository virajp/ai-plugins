## 3. URL Design

### Casing

- Use **kebab-case** for URL path segments: `/ride-sessions`, `/active-routes`
- Use **camelCase** for query parameters and be consistent

### IDs

- Prefer opaque, non-sequential IDs (preferably NanoIDs) — never expose
  auto-increment integers
- IDs must be URL-safe
- Keep IDs stable forever — never recycle or reuse

### Filtering, sorting, searching

Use query parameters:

```text
GET /rides?status=ongoing&userId=abc123
GET /rides?sort=startedAt:desc
GET /rides?q=highway+route
GET /rides?startedAfter=2024-01-01T00:00:00Z
```

Avoid encoding filters in path segments unless they fundamentally identify a
sub-resource.

---
