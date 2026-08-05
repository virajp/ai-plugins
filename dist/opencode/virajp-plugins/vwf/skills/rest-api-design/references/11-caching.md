## 11. Caching

### Use HTTP cache semantics

- Set `Cache-Control` explicitly on every response — never leave it undefined
- Use `ETag` and `Last-Modified` for conditional requests
- Use `Vary` header when response varies by header (e.g., `Accept-Language`,
  `Authorization`)

```text
Cache-Control: max-age=60, stale-while-revalidate=30
ETag: "abc123def456"
```

### Cacheability by method

- `GET` and `HEAD`: cacheable by default when `Cache-Control` permits
- `POST`, `PUT`, `PATCH`, `DELETE`: not cacheable — set
  `Cache-Control: no-store`

### Sensitive data

Always set `Cache-Control: no-store, no-cache` on responses containing
authentication tokens, PII, or financial data.

---
