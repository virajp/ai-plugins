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
