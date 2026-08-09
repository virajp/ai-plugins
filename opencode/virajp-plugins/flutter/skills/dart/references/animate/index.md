# flutter_animate

Declarative widget animations with the flutter_animate package — the .animate()
extension, effect reference, timing/sequencing with .then(), staggered list
animations, controllers, and adapters.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                            | When to read                                                                |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Setup](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/setup.md)                                           | Adding the dependency and hot-reload restart                                |
| [Core Concepts](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/core-concepts.md)                           | Call .animate() on any widget to wrap it in an Animate widget               |
| [Effect Reference](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/effect-reference.md)                     | Picking an effect: fade, slide, scale, blur, shimmer, shake                 |
| [Timing & Sequencing](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/timing-sequencing.md)                 | All effects start at t=0                                                    |
| [List Animations](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/list-animations.md)                       | Apply staggered animations to a List<Widget> using the .animate() extension |
| [Controller & Lifecycle](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/controller-lifecycle.md)           | Callbacks, external AnimationController, target/value control               |
| [Adapters (Scroll / Notifier)](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/adapters-scroll-notifier.md) | Adapters drive the animation from an external source instead of a timer     |
| [Anti-Patterns](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/anti-patterns.md)                           | Avoiding restart-on-rebuild, delay vs .then(), jank                         |
| [Examples](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/examples.md)                                     | Entrance, staggered, shimmer, pulse, shake, sequential recipes              |
