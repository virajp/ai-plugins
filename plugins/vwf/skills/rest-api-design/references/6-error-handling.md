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
