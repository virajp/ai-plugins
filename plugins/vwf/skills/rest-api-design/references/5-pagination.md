## 5. Pagination

### Cursor-based pagination (preferred)

Stable across inserts and deletes. Use for real-time data or large datasets.

```text
GET /rides?cursor=eyJpZCI6ImFiYyJ9&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6InhZeiJ9",
    "hasMore": true
  }
}
```

### Offset-based pagination

Simple, but unstable under concurrent mutations. Acceptable for admin/reporting
use cases.

```text
GET /rides?page=2&pageSize=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 843
  }
}
```

### Rules

- Always paginate collections — never return unbounded lists
- Enforce a maximum `limit`/`pageSize` server-side
- Default page size should be reasonable (20–50) and documented

---
