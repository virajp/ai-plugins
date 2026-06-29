## 7. Authentication & Authorization

### Authentication

- Use **short-lived Bearer tokens** (JWT or opaque) in the `Authorization`
  header
- Never accept tokens in query parameters — they end up in server logs and
  browser history
- Enforce HTTPS everywhere — no exceptions
- Tokens must have an expiry (`exp`). Provide a refresh mechanism
- For service-to-service calls, prefer mTLS or signed requests over long-lived
  API keys

### Authorization

- Enforce at the **service layer**, not just the API gateway
- Apply **least privilege** — scope tokens to the minimum permissions needed
- Validate resource ownership on every request: just because a user can access
  `/rides` doesn't mean they can access any `rideId`
- Distinguish `401` (who are you?) from `403` (I know who you are, but no) —
  never conflate them
- Do not expose the existence of a resource to an unauthorized caller: return
  `404` not `403` when the resource exists but the caller has no access (unless
  enumeration resistance is not a concern)

### API Keys (for server-to-server or third-party integrations)

- Treat API keys like passwords — hash them at rest, never log them
- Scope API keys to specific capabilities
- Support key rotation without downtime
- Include `keyId` metadata to identify keys without exposing the secret

---
