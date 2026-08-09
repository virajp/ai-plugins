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
