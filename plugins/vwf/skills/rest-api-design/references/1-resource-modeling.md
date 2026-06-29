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
