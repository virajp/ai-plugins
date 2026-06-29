# webview_flutter

Embedding and controlling web content in a Flutter app with webview_flutter —
the controller/widget split, loading URLs/HTML/assets/files, running JavaScript
and Dart↔JS channels, the navigation delegate, cookie management, scroll
control, and Android/iOS platform-specific configuration.

Supported platforms: **Android** (API 24+), **iOS** (13.0+), **macOS** (10.15+).

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                      | When to read                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/setup.md)                                                     | Add dependencies to pubspec.yaml                                          |
| [Basic Usage](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/basic-usage.md)                                         | The package has two components that always work together                  |
| [Loading Content](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/loading-content.md)                                 | Loading URLs, POST bodies, HTML strings, assets, files                    |
| [JavaScript](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/javascript.md)                                           | Running JS, return values, Dart↔JS channels, console/dialogs              |
| [Navigation Delegate](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/navigation-delegate.md)                         | Progress, page events, blocking navigation, errors, back/forward          |
| [Cookie Management](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/cookie-management.md)                             | Pre-load cookies before calling loadRequest, otherwise they won't be sent |
| [Scroll Control](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/scroll-control.md)                                   | Programmatic scroll, position tracking, hiding scrollbars                 |
| [Platform-Specific Configuration](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/platform-specific-configuration.md) | Android/iOS controller tweaks: debugging, media, gestures                 |
| [Anti-Patterns & Migration Notes](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/anti-patterns-migration-notes.md)   | v3→v4 deprecated API and common mistakes                                  |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webview/examples.md)                                               | Loading bar, nav bar, JS callbacks, cookie session, transparent bg        |
