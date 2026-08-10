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
