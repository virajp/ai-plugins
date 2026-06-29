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
