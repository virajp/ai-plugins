## 9. Rate Limiting

### Expose limits via headers

```text
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 732
X-RateLimit-Reset: 1717200000
Retry-After: 60
```

Return `429 Too Many Requests` when the limit is exceeded, always with
`Retry-After`.

### Strategy

- Limit by **caller identity** (user, API key, IP) — not globally
- Apply different limits per endpoint category (reads vs. writes vs. expensive
  operations)
- Use a **sliding window** or **token bucket** algorithm — fixed windows create
  burst cliffs
- Separate rate limits from quota limits (per-minute vs. per-month)

---
