## Anti-Patterns

| Anti-Pattern                                                 | Why                                                              | Fix                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Calling `.animate()` inside `build()` on every rebuild       | Creates a new `Animate` widget each time, restarting animation   | Move to a `StatefulWidget` or ensure a stable key                |
| Using `delay` when you need sequential ordering              | `delay` is absolute from `t=0`, not relative to previous effects | Use `.then()` for relative sequencing                            |
| Forgetting `onPlay: (c) => c.repeat()` for shimmer/pulse     | Animation plays once then stops                                  | Add `onPlay` callback to loop                                    |
| Using `.animate()` on `Spacer` in lists                      | `Spacer` doesn't render anything; wrapping breaks layout         | `AnimateList` ignores `Spacer` by default — don't fight it       |
| Animating expensive widgets (e.g. `CustomPaint`) repeatedly  | Causes jank                                                      | Prefer compositing effects (fade, slide) over rebuild-heavy ones |
| Building static subtrees inside an `AnimatedBuilder` builder | The whole subtree rebuilds on every animation tick               | Pass animation-independent widgets via the `child` parameter     |
| Large blur values (`blurXY(begin: 20)`)                      | Expensive ImageFilter on every frame                             | Keep blur values below `~8`; test on low-end devices             |
| Shimmer on mobile web                                        | Known Flutter limitation                                         | Use a fallback or skip shimmer on `kIsWeb`                       |

---
