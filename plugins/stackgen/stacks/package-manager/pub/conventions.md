# pub — conventions

`pubspec.yaml` is the manifest, and it is more than a dependency list: it
declares **both** the Dart and Flutter SDK constraints, and it configures the
native package managers — including toggling Swift Package Manager for iOS. The
native build files configure native dependencies only.

**The lockfile is committed** for an application. CI resolves from it rather
than re-resolving.

**Dependencies get no reference of their own** beyond wiring — their API surface
is Context7's at use time. What a dependency does earn is an integration wiring
reference where it needs platform configuration.

Full judgment: the `pub` skill.
