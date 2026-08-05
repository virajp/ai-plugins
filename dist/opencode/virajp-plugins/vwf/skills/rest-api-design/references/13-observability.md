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
