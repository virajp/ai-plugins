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
