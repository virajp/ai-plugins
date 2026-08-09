## Quick Reference

| Concern          | Decision                                           |
| ---------------- | -------------------------------------------------- |
| URL casing       | kebab-case paths, consistent query params          |
| IDs              | Opaque, non-sequential, URL-safe                   |
| Timestamps       | ISO 8601 UTC                                       |
| Amounts          | Integer (smallest currency unit)                   |
| Pagination       | Cursor-based preferred                             |
| Errors           | `{ error: { code, message, details, traceId } }`   |
| Versioning       | URL path (`/v1/`, `/v2/`)                          |
| Auth             | Bearer token in `Authorization` header, HTTPS only |
| Breaking changes | New major version + sunset old version             |
| Idempotency      | `Idempotency-Key` header on POST                   |
| Caching          | Explicit `Cache-Control` on every response         |
| Observability    | Trace ID on every request and error                |
