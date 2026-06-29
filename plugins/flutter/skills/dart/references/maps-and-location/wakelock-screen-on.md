## Wakelock (Screen On)

During active navigation keep the screen awake:

```dart
import 'package:wakelock_plus/wakelock_plus.dart';

// Enable
await WakelockPlus.enable();

// Disable (call when leaving navigation screen)
await WakelockPlus.disable();

// Check state
final isEnabled = await WakelockPlus.enabled;

// Toggle
await WakelockPlus.toggle(enable: isActiveRide);
```

Always disable the wakelock when navigation ends or the screen is disposed.

---
