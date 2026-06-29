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
