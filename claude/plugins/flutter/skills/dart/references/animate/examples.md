## Examples

### Entrance animation (card)

```dart
Card(child: ListTile(title: Text(title)))
  .animate()
  .fadeIn(duration: 300.ms, curve: Curves.easeOut)
  .slideY(begin: 0.1, duration: 300.ms, curve: Curves.easeOut)
```

### Staggered list

```dart
ListView(
  children: items.map((item) => ItemCard(item)).toList()
    .animate(interval: 60.ms)
    .fadeIn(curve: Curves.easeOut)
    .slideX(begin: -0.05, curve: Curves.easeOut),
)
```

### Loading skeleton shimmer

```dart
Container(
  width: 200,
  height: 16,
  decoration: BoxDecoration(
    color: Colors.grey.shade300,
    borderRadius: BorderRadius.circular(4),
  ),
)
  .animate(onPlay: (c) => c.repeat())
  .shimmer(duration: 1200.ms, color: Colors.white54)
```

### Attention pulse

```dart
Icon(Icons.notifications)
  .animate(onPlay: (c) => c.repeat(reverse: true))
  .scale(
    begin: const Offset(1, 1),
    end: const Offset(1.15, 1.15),
    duration: 600.ms,
    curve: Curves.easeInOut,
  )
```

### Error shake (validation feedback)

```dart
TextFormField(...)
  .animate(controller: _shakeController, autoPlay: false)
  .shakeX(hz: 6, amount: 8, duration: 400.ms)

// On validation failure:
_shakeController
  ..reset()
  ..forward();
```

### Sequential reveal

```dart
Column(children: [
  Text('Step 1').animate().fadeIn(),
  Text('Step 2').animate().fadeIn(delay: 400.ms),
  Text('Step 3').animate().fadeIn(delay: 800.ms),
])

// Or with .then() on one widget:
widget
  .animate()
  .fadeIn(duration: 300.ms)
  .then()
  .slideY(begin: -0.05, duration: 200.ms)
  .then(delay: 100.ms)
  .scale(end: const Offset(1.02, 1.02), duration: 150.ms)
```

### Scroll-driven fade-in

```dart
final _scroll = ScrollController();

ListView(
  controller: _scroll,
  children: items.map((item) =>
    ItemWidget(item)
      .animate(adapter: ScrollAdapter(_scroll, animated: true))
      .fade()
      .slideY(begin: 0.15)
  ).toList(),
)
```
