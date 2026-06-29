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

Comprehensive, technology-agnostic principles and best practices for designing
REST APIs. These principles apply at the contract level — independent of
language, framework, or runtime.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                                    | When to read                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [1. Resource Modeling](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/1-resource-modeling.md)                                   | URLs identify resources                                                   |
| [2. HTTP Methods](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/2-http-methods.md)                                             | Use HTTP methods with their standard semantics                            |
| [3. URL Design](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/3-url-design.md)                                                 | Use kebab-case for URL path segments                                      |
| [4. Request & Response Design](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/4-request-response-design.md)                     | Use JSON as the default content type                                      |
| [5. Pagination](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/5-pagination.md)                                                 | Stable across inserts and deletes                                         |
| [6. Error Handling](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/6-error-handling.md)                                         | Every error response must follow the same shape                           |
| [7. Authentication & Authorization](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/7-authentication-authorization.md)           | Choosing auth schemes, token scopes, and 401-vs-403 rules                 |
| [8. Versioning & Backward Compatibility](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/8-versioning-backward-compatibility.md) | Version in the URL path for major breaking changes                        |
| [9. Rate Limiting](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/9-rate-limiting.md)                                           | Designing rate-limit headers and 429 responses                            |
| [10. Idempotency](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/10-idempotency.md)                                             | Supporting Idempotency-Key for safe POST retries                          |
| [11. Caching](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/11-caching.md)                                                     | Set Cache-Control explicitly on every response — never leave it undefined |
| [12. Security](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/12-security.md)                                                   | Validate all inputs                                                       |
| [13. Observability](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/13-observability.md)                                         | A unique Trace ID (propagate via traceparent)                             |
| [14. API Documentation](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/14-api-documentation.md)                                 | Documenting endpoints with OpenAPI and changelogs                         |
| [15. Design Process](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/15-design-process.md)                                       | Contract-first workflow and pre-ship checklist                            |
| [Quick Reference](${CLAUDE_PLUGIN_ROOT}/skills/rest-api-design/references/quick-reference.md)                                            | At-a-glance checklist of all rules                                        |
