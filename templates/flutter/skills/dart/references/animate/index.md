# flutter_animate

Declarative widget animations with the flutter_animate package — the .animate()
extension, effect reference, timing/sequencing with .then(), staggered list
animations, controllers, and adapters.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                            | When to read                                                                |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Setup](<%= it.root %>/skills/dart/references/animate/setup.md)                                           | Adding the dependency and hot-reload restart                                |
| [Core Concepts](<%= it.root %>/skills/dart/references/animate/core-concepts.md)                           | Call .animate() on any widget to wrap it in an Animate widget               |
| [Effect Reference](<%= it.root %>/skills/dart/references/animate/effect-reference.md)                     | Picking an effect: fade, slide, scale, blur, shimmer, shake                 |
| [Timing & Sequencing](<%= it.root %>/skills/dart/references/animate/timing-sequencing.md)                 | All effects start at t=0                                                    |
| [List Animations](<%= it.root %>/skills/dart/references/animate/list-animations.md)                       | Apply staggered animations to a List<Widget> using the .animate() extension |
| [Controller & Lifecycle](<%= it.root %>/skills/dart/references/animate/controller-lifecycle.md)           | Callbacks, external AnimationController, target/value control               |
| [Adapters (Scroll / Notifier)](<%= it.root %>/skills/dart/references/animate/adapters-scroll-notifier.md) | Adapters drive the animation from an external source instead of a timer     |
| [Anti-Patterns](<%= it.root %>/skills/dart/references/animate/anti-patterns.md)                           | Avoiding restart-on-rebuild, delay vs .then(), jank                         |
| [Examples](<%= it.root %>/skills/dart/references/animate/examples.md)                                     | Entrance, staggered, shimmer, pulse, shake, sequential recipes              |
