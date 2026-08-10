## 4. Request & Response Design

### Request bodies

- Use JSON as the default content type: `Content-Type: application/json`
- Accept only what you need — reject unknown fields with a `400` rather than
  silently ignoring them (prevents accidental data leaks in future versions)
- Validate all input server-side — never trust client-side validation alone
- MUST use tools like `Effect.Schema`, `Zod`, etc. to define and enforce
  request/response/params/query schemas

### Response bodies

Adopt a consistent envelope only if it genuinely adds value. Prefer flat
responses.

```json
// Single resource
{
  "id": "ride_abc123",
  "status": "ongoing",
  "startedAt": "2024-06-01T10:00:00Z"
}

// Collection
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6ImFiYyJ9",
    "hasMore": true
  }
}
```

Avoid deeply nested response bodies. Flat structures are easier to consume and
evolve.

### Field naming

- Pick one convention (**camelCase** or **snake_case**) and enforce it
  everywhere
- Use ISO 8601 for all timestamps: `2024-06-01T10:30:00Z`
- Use ISO 4217 for currency codes, ISO 3166 for country codes
- Represent monetary amounts as integers (cents/paise) — never floats
- Use explicit `null` only when a field is intentionally absent and meaningful;
  omit fields that are not applicable

---
