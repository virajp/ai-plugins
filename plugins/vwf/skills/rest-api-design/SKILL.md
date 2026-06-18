---
name: rest-api-design
description:
  Comprehensive, technology-agnostic principles and best practices for designing
  REST APIs. Use this skill whenever designing new REST endpoints, reviewing API
  contracts, planning versioning strategy, defining error formats, or
  establishing API standards for a project. Also trigger when discussing
  backward compatibility, API security, pagination, rate limiting,
  authentication schemes, or OpenAPI spec authoring — even if the user doesn't
  say "REST API" explicitly. This skill is the authoritative guide for all API
  design decisions.
allowed-tools: Read Write
---

# REST API Design Principles

A technology-agnostic reference for designing consistent, secure, evolvable REST
APIs. These principles apply at the contract level — independent of language,
framework, or runtime.

---

## 1. Resource Modeling

### Resources are nouns, not verbs

URLs identify resources. Actions are expressed via HTTP methods, not path
segments.

```text
✅  GET    /rides
✅  POST   /rides
✅  GET    /rides/{rideId}
✅  PATCH  /rides/{rideId}
✅  DELETE /rides/{rideId}

❌  POST   /createRide
❌  GET    /getRideById
❌  POST   /rides/updateStatus
```

### Use plural nouns consistently

Collections are plural. Sub-resources nest naturally under their parent.

```text
/users/{userId}
/users/{userId}/rides
/users/{userId}/rides/{rideId}
/users/{userId}/rides/{rideId}/waypoints
```

### Limit nesting depth

Nest only when a resource only makes sense in the context of its parent. Beyond
two levels, prefer flat resources with query filters.

```text
✅  /rides/{rideId}/waypoints
✅  /rides?userId={userId}
❌  /users/{userId}/rides/{rideId}/waypoints/{waypointId}/photos
```

### Resource granularity

- A **resource** maps to a stable, identifiable business entity — not a database
  table or internal object.
- Avoid leaking implementation details (table names, internal IDs, ORM types)
  into the API surface.

---

## 2. HTTP Methods

Use HTTP methods with their standard semantics:

| Method  | Semantics                                 | Idempotent | Safe |
| ------- | ----------------------------------------- | ---------- | ---- |
| GET     | Retrieve a resource or collection         | ✅         | ✅   |
| POST    | Create a new resource / trigger an action | ❌         | ❌   |
| PUT     | Full replace of a resource                | ✅         | ❌   |
| PATCH   | Partial update of a resource              | ✅\*       | ❌   |
| DELETE  | Remove a resource                         | ✅         | ❌   |
| HEAD    | Same as GET without response body         | ✅         | ✅   |
| OPTIONS | Describe allowed methods (used for CORS)  | ✅         | ✅   |

\*PATCH is idempotent if the operation is described in terms of absolute values,
not relative deltas (e.g., "set status to X" vs. "increment counter by 1").

### Action endpoints (use sparingly)

When an operation is a state transition or command that doesn't map cleanly to
CRUD, use a verb sub-resource:

```text
POST /rides/{rideId}/cancel
POST /rides/{rideId}/complete
POST /payments/{paymentId}/refund
```

Do **not** mix command semantics into `PATCH` when the side-effects matter more
than the field change.

---

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

## 6. Error Handling

### Consistent error structure

Every error response must follow the same shape:

```json
{
  "error": {
    "code": "RIDE_NOT_FOUND",
    "message": "No ride exists with the given ID.",
    "details": [
      {
        "field": "rideId",
        "issue": "Resource does not exist"
      }
    ],
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
  }
}
```

- `code`: machine-readable string constant — used by clients for programmatic
  handling
- `message`: human-readable, safe to display in logs — **never** include PII or
  stack traces
- `details`: optional array for validation errors (field-level feedback)
- `traceId`: always include — essential for cross-service debugging

### HTTP status codes

Use status codes precisely:

| Code | Usage                                                           |
| ---- | --------------------------------------------------------------- |
| 200  | OK — successful GET, PATCH, PUT                                 |
| 201  | Created — successful POST that creates a resource               |
| 202  | Accepted — async operation queued                               |
| 204  | No Content — successful DELETE or action with no body           |
| 400  | Bad Request — invalid input, validation failure                 |
| 401  | Unauthorized — missing or invalid authentication                |
| 403  | Forbidden — authenticated but not authorized                    |
| 404  | Not Found — resource does not exist                             |
| 409  | Conflict — state conflict (duplicate, concurrency violation)    |
| 410  | Gone — resource permanently deleted                             |
| 422  | Unprocessable Entity — valid format but business rule violation |
| 429  | Too Many Requests — rate limit exceeded                         |
| 500  | Internal Server Error — unexpected server fault                 |
| 503  | Service Unavailable — temporary overload or maintenance         |

Never return `200` with an error payload — clients rely on status codes.

---

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

## 8. Versioning & Backward Compatibility

### Versioning strategy

Version in the **URL path** for major breaking changes:

```text
/v1/rides
/v2/rides
```

Avoid header-based versioning for public APIs — it's harder to test, cache, and
share.

### What constitutes a breaking change

**Breaking (requires new major version):**

- Removing or renaming a field
- Changing a field's type or format
- Removing an endpoint
- Changing HTTP method semantics
- Changing error code values
- Requiring a new mandatory request field
- Changing authentication mechanism

**Non-breaking (safe to ship):**

- Adding new optional fields to responses
- Adding new optional request parameters
- Adding new endpoints
- Adding new enum values (clients must handle unknown values gracefully)
- Changing field order in JSON

### Backward compatibility rules

1. **Clients must ignore unknown fields** — design clients this way; design
   servers to add fields freely
2. **Never remove fields** — deprecate with `X-Deprecated-Field` or
   documentation, then sunset with advance notice
3. **Additive changes only** on stable versions
4. Maintain previous major version for a documented **sunset period** (minimum 6
   months for public APIs)
5. Communicate deprecation via `Deprecation` and `Sunset` response headers:

   ```text
   Deprecation: Sat, 01 Jan 2025 00:00:00 GMT
   Sunset: Mon, 01 Jul 2025 00:00:00 GMT
   Link: <https://api.example.com/v2/rides>; rel="successor-version"
   ```

### Experimental / beta endpoints

Use a prefix to signal instability:

```text
/beta/rides/{rideId}/ai-suggestions
```

Callers of beta endpoints accept no stability guarantees.

---

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

## 10. Idempotency

### Idempotency keys for non-idempotent operations

For `POST` operations that create resources or trigger side effects, support
client-supplied idempotency keys:

```text
POST /rides
Idempotency-Key: 7f9c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

If the same key is received again within a TTL window, return the original
response without re-executing the operation. This allows safe retries on network
failures.

### Implementation

- Store idempotency key + response for a defined TTL (e.g., 24 hours)
- Return `409 Conflict` if the same key is reused with a different request body
- Document which endpoints support idempotency keys

---

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

## 12. Security

### Input validation

- Validate all inputs: types, ranges, lengths, formats, enumerations
- Reject requests with unknown fields (strict mode) or strip them (lenient mode)
  — be consistent
- Limit request body size to prevent DoS via large payloads
- Validate `Content-Type` on all requests with bodies

### Transport security

- Enforce HTTPS — redirect HTTP to HTTPS or reject it outright
- Use TLS 1.2 minimum; prefer TLS 1.3
- Set `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Response security headers

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'
Referrer-Policy: no-referrer
```

### CORS

- Whitelist specific origins — never use `Access-Control-Allow-Origin: *` for
  authenticated APIs
- Only expose headers clients actually need in `Access-Control-Expose-Headers`

### Sensitive data

- Never log request/response bodies in production (they may contain tokens or
  PII)
- Redact sensitive fields in error messages and logs
- Do not include stack traces in API error responses
- Mask/truncate sensitive fields in responses (e.g., card numbers, passwords)

### Injection & abuse

- Sanitize all string inputs used in queries, commands, or templates
- Enforce maximum lengths to prevent buffer overruns and DoS
- Protect against mass assignment — never blindly pass request body to a data
  store

---

## 13. Observability

### Every request should produce

- A unique **Trace ID** (propagate via `traceparent`)
- Structured logs with: method, path, status code, latency, caller identity
- Metrics: request count, error rate, p50/p95/p99 latency, per endpoint

### Correlation

- Accept and propagate `traceparent` (W3C Trace Context) for distributed tracing
- Include `traceId` in every error response body
- Log the authenticated user/service identity on every request

### Health endpoints

Provide machine-readable health endpoints:

```text
GET /health          → 200 { "status": "ok" }
GET /health/ready    → 200/503 (readiness — is the service able to serve traffic?)
GET /health/live     → 200/503 (liveness — is the process alive?)
```

These must not require authentication and must respond within 100ms.

---

## 14. API Documentation

### OpenAPI / AsyncAPI spec

- Maintain a machine-readable spec (OpenAPI 3.x recommended) as the source of
  truth
- Generate it from code when possible — never let spec and implementation
  diverge
- Include: description, request/response schemas, error codes, authentication
  requirements, examples

### Every endpoint must document

- Purpose and semantics
- Required and optional fields with types and constraints
- All possible HTTP status codes and error `code` values
- Rate limit tier
- Deprecation status and successor if applicable

### Changelog

Maintain a public changelog for every API version: what changed, when, and
migration guidance.

---

## 15. Design Process

### Contract-first

Define the API contract (OpenAPI spec or equivalent) **before** writing
implementation code. This forces consumer-perspective thinking and prevents
implementation details from leaking into the API surface.

### Consumer-driven

Validate your API design against real consumer use cases. Ask: can the client
accomplish its goal in ≤3 API calls? If not, consider adding a purpose-built
endpoint.

### Consistency checklist

Before shipping any new endpoint, verify:

- [ ] Resource noun is plural and in kebab-case
- [ ] HTTP method matches semantics
- [ ] Request/response fields follow the project's naming convention
- [ ] All timestamps are ISO 8601 in UTC
- [ ] Error responses follow the standard error schema
- [ ] Authentication and authorization are enforced
- [ ] Rate limiting is applied
- [ ] Health of the endpoint is observable (logs, traces, metrics)
- [ ] OpenAPI spec is updated
- [ ] Backward compatibility is maintained or a new version is introduced

---

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
