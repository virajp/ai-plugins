---
name: swiftui
version: 0.1.0
category: development
description: Swift language and SwiftUI patterns for the iOS-native side of a
  Flutter app — optionals and typed errors, async/await, actors and @MainActor,
  structured concurrency, @Observable state, NavigationStack routing, the .task
  lifecycle, performance patterns, and Swift Package Manager. Use when writing
  Swift code, building SwiftUI views, managing state, handling concurrency, or
  adding SPM dependencies in a Flutter app's iOS project.
license: MIT
user-invocable: false
---

# Swift + SwiftUI Expert Skill

## Language Fundamentals

### Optionals

Prefer `guard let` over `if let` when the happy path continues:

```swift
guard let user = currentUser else { return }
// user is non-optional here
```

Never use `!` forced unwrap unless you have a compiler guarantee. For safe
fallbacks use `??`:

```swift
let name = user?.displayName ?? "Guest"
```

### Error Handling

Use typed errors with enums conforming to `Error`:

```swift
enum AppError: LocalizedError {
    case notFound(id: String)
    case networkFailure(underlying: Error)

    var errorDescription: String? {
        switch self {
        case .notFound(let id): "Resource \(id) not found"
        case .networkFailure(let err): "Network error: \(err.localizedDescription)"
        }
    }
}
```

Propagate with `throws`, catch specifically:

```swift
do {
    let result = try await fetchRide(id: rideId)
} catch AppError.notFound(let id) {
    // handle missing ride
} catch {
    // unexpected errors
}
```

### Protocols & Generics

Define behavior through protocols, not inheritance:

```swift
protocol RideProvider {
    func rides(for userId: String) async throws -> [Ride]
}

// Constrain generics at call site
func process<T: Identifiable & Sendable>(_ items: [T]) { ... }
```

Use `some` (opaque type) for return types where concrete type is hidden:

```swift
var body: some View { ... }
func makeProvider() -> some RideProvider { LiveRideProvider() }
```

Use `any` for existentials (Swift 5.7+):

```swift
let provider: any RideProvider = LiveRideProvider()
```

## Swift Concurrency

### async/await

Mark functions `async` and call with `await`. Throwing async: `async throws`:

```swift
func fetchProfile() async throws -> UserProfile {
    let data = try await networkClient.get("/profile")
    return try JSONDecoder().decode(UserProfile.self, from: data)
}
```

Start work from sync context with `Task`:

```swift
Task {
    do {
        profile = try await fetchProfile()
    } catch {
        errorMessage = error.localizedDescription
    }
}
```

Prefer `.task` modifier over bare `Task {}` — it auto-cancels when the view
disappears:

```swift
.task {
    await loadData()
}
```

### Actors

Use `actor` to protect shared mutable state across concurrent callers:

```swift
actor RideCache {
    private var cache: [String: Ride] = [:]

    func ride(for id: String) -> Ride? { cache[id] }
    func store(_ ride: Ride) { cache[ride.id] = ride }
}
```

`@MainActor` for types that must run on the main thread (ViewModels, state):

```swift
@Observable
@MainActor
final class RideViewModel {
    var rides: [Ride] = []
    var isLoading = false

    func load() async {
        isLoading = true
        defer { isLoading = false }
        rides = (try? await rideService.all()) ?? []
    }
}
```

### Structured Concurrency

Run independent tasks in parallel with `async let`:

```swift
async let profile = fetchProfile()
async let rides = fetchRides()
let (p, r) = try await (profile, rides)
```

Use `TaskGroup` for dynamic concurrency:

```swift
let results = try await withThrowingTaskGroup(of: Ride.self) { group in
    for id in rideIds {
        group.addTask { try await fetchRide(id: id) }
    }
    return try await group.reduce(into: []) { $0.append($1) }
}
```

## SwiftUI Patterns

### State Management (iOS 17+)

Use `@Observable` macro for view models (replaces `ObservableObject`):

```swift
@Observable
@MainActor
final class AppState {
    var isLoggedIn = false
    var currentUser: User?
}

// Inject at root
@main
struct MyApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}

// Access in child views
struct ProfileView: View {
    @Environment(AppState.self) private var appState
}
```

Use `@Bindable` to create bindings to `@Observable` models:

```swift
struct EditRideView: View {
    @Bindable var ride: RideDraft

    var body: some View {
        TextField("Title", text: $ride.title)
    }
}
```

Local ephemeral UI state: `@State private var`. Never share `@State` across
views — lift to a model instead.

Avoid legacy `@EnvironmentObject` — use `@Environment(MyType.self)` with
`@Observable`.

### Navigation (iOS 16+)

Use `NavigationStack` with typed `NavigationPath` for programmatic navigation:

```swift
@Observable
@MainActor
final class Router {
    var path = NavigationPath()

    func push(_ destination: AppDestination) { path.append(destination) }
    func popToRoot() { path.removeLast(path.count) }
}

enum AppDestination: Hashable {
    case rideDetail(Ride)
    case profile(User)
}

struct RootView: View {
    @State private var router = Router()

    var body: some View {
        NavigationStack(path: $router.path) {
            RideListView()
                .navigationDestination(for: AppDestination.self) { dest in
                    switch dest {
                    case .rideDetail(let ride): RideDetailView(ride: ride)
                    case .profile(let user): ProfileView(user: user)
                    }
                }
        }
        .environment(router)
    }
}
```

Dismiss sheets via environment action:

```swift
struct SheetView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Button("Done") { dismiss() }
    }
}
```

### Lifecycle & Side Effects

`.task` > `.onAppear` for async work (auto-cancels on disappear):

```swift
.task {
    await viewModel.load()
}
```

`.task(id:)` re-runs when dependency changes:

```swift
.task(id: selectedRideId) {
    await viewModel.loadRide(id: selectedRideId)
}
```

### Performance Patterns

Never compute in `body` — move heavy work to the model:

```swift
// BAD
var body: some View {
    List(rides.sorted { $0.date > $1.date }) { ... }
}

// GOOD - sort once in model, update on change
@State private var sortedRides: [Ride] = []
var body: some View {
    List(sortedRides) { ... }
        .onChange(of: rides) { _, new in
            sortedRides = new.sorted { $0.date > $1.date }
        }
}
```

Use `LazyVStack` / `LazyHStack` for large collections. Pass narrow values (not
entire models) to child views to minimize redraws:

```swift
// GOOD - child only redraws when these two values change
struct RideRow: View {
    let title: String
    let distance: Double
}
```

Debug unexpected redraws in DEBUG builds:

```swift
var body: some View {
    #if DEBUG
    let _ = Self._logChanges()
    #endif
    // ...
}
```

## Swift Package Manager

Add packages in Xcode: File > Add Package Dependencies.

`Package.swift` for library packages:

```swift
let package = Package(
    name: "MyFeature",
    platforms: [.iOS(.v17)],
    products: [.library(name: "MyFeature", targets: ["MyFeature"])],
    dependencies: [
        .package(url: "https://github.com/...", from: "1.0.0"),
    ],
    targets: [
        .target(name: "MyFeature", dependencies: [...]),
        .testTarget(name: "MyFeatureTests", dependencies: ["MyFeature"]),
    ]
)
```

## iOS Project Specifics

- Entry point: the `@main` struct in the app's Swift entry file
- UI framework: SwiftUI (not UIKit)
- Package manager: SPM only — no CocoaPods or Carthage
- Naming: PascalCase for types, camelCase for vars/funcs

## Common Gotchas

- `@State` must be `private` — it is owned by the view struct
- `@Observable` models must be reference types (`final class`), not structs
- `Task { }` detaches from structured concurrency — prefer `.task` modifier
- Swift 6 strict concurrency: mark all shared mutable state `@MainActor` or
  `actor`, or annotate `Sendable` conformances
