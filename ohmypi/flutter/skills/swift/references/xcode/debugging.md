## Debugging

### LLDB Commands

```text
po variable          # print object description
p variable           # print with type info
e expression         # evaluate expression
bt                   # backtrace (call stack)
frame variable       # local variables in current frame
thread list          # all threads
continue / c         # resume
step / s             # step into
next / n             # step over
finish / f           # step out
```

Conditional breakpoints: right-click breakpoint > Edit Breakpoint > Condition.

Swift Error Breakpoint: Debug > Breakpoints > Add > Swift Error Breakpoint.
Catches all thrown Swift errors at the throw site.

### SwiftUI View Debugger

Debug > View Hierarchy (or camera icon in debug bar). Shows 3D exploded view of
the view tree. Use to identify clipped/hidden views, inspect frames, and find
layout issues.

Log which `@Observable` properties caused a redraw:

```swift
var body: some View {
    #if DEBUG
    let _ = Self._logChanges()
    #endif
    // ...
}
```

### Memory Debugging

Debug > Memory Graph Debugger — visualize object references, find retain cycles.
Purple `!` icons indicate leaks.

Capture `[weak self]` in closures to break retain cycles:

```swift
Task { [weak self] in
    await self?.load()
}
```

### Instruments

Launch via Product > Profile (Cmd+I). Always profile **Release** builds for
accurate data (Debug has no optimization).

Key instruments:

- **Time Profiler** — CPU usage, find hot paths
- **Allocations** — memory allocations, find leaks and growth
- **Leaks** — detect reference cycles
- **Network** — HTTP/HTTPS traffic inspection
- **SwiftUI** — view body evaluations and layout passes (Xcode 14+)
