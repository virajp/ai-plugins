## Anti-Patterns

| Anti-Pattern                                         | Why                                     | Fix                                               |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Requesting location without checking service enabled | `getCurrentPosition` hangs indefinitely | Always check `isLocationServiceEnabled()` first   |
| Using `getCurrentPosition` repeatedly in a loop      | Battery drain; high latency             | Use `getPositionStream` for continuous tracking   |
| Not cancelling `StreamSubscription` on dispose       | Memory leak and battery drain           | Cancel in `onClose` / `dispose`                   |
| Rebuilding `Set<Marker>` on every position update    | Causes full map re-render flicker       | Only update the moving marker; keep others stable |
| Leaving wakelock enabled after ride ends             | Drains battery; never sleeps            | `WakelockPlus.disable()` in `onClose`/`dispose`   |
| Hardcoding Google Maps API key in source             | Key exposed in version control          | Use environment variables / native secrets        |
| Not disposing `GoogleMapController`                  | Native resource leak                    | Call `controller.dispose()` in `dispose`          |

---
