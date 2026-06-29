# Maps & Location

Display maps and track user location in a Flutter app using google_maps_flutter,
geolocator, and wakelock_plus — permissions, position streams, markers,
polylines, camera control, and keeping the screen awake.

Covers: `google_maps_flutter`, `geolocator`, `wakelock_plus`

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                          | When to read                                                      |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/setup.md)                               | Adding the packages, API keys, and platform permissions           |
| [Location Permissions](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/location-permissions.md) | Always check and request permissions before calling location APIs |
| [Current Position](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/current-position.md)         | Getting the user's location once (one-shot fix)                   |
| [Position Stream](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/position-stream.md)           | Continuously tracking location as the user moves                  |
| [Google Maps Widget](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/google-maps-widget.md)     | Rendering the map widget and its options                          |
| [Map Controller](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/map-controller.md)             | Moving the camera or fitting route bounds programmatically        |
| [Markers](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/markers.md)                           | Placing pins or custom marker icons on the map                    |
| [Polylines (Routes)](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/polylines-routes.md)       | Drawing a route line connecting points on the map                 |
| [Circles & Polygons](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/circles-polygons.md)       | Drawing a radius circle or geo-fenced area                        |
| [Camera Control](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/camera-control.md)             | Panning, zooming, or tilting the map camera                       |
| [Custom Map Style](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/custom-map-style.md)         | Applying a custom (e.g., dark) map theme                          |
| [Wakelock (Screen On)](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/wakelock-screen-on.md)   | During active navigation keep the screen awake                    |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/anti-patterns.md)               | Avoiding common maps and location mistakes                        |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/maps-and-location/examples.md)                         | Full navigation-tracking controller and map widget                |
