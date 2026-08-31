# Flutter — testing & coverage

## Flutter Testing Standards

Tests live under `test/` and **mirror `lib/`** — `lib/components/button.dart` →
`test/components/my_button_test.dart`. Each file is `void main()` with a
top-level `group('<Subject>', …)`. Cover **every new service, controller, and
product widget**; the general style rules (final params, single quotes, return
types) apply to test code too — see
[Standards & architecture](standards-and-architecture.md).

## The GetX harness (`test/helpers/`)

All widget/controller tests go through the shared harness, never raw `Get.put`
of a mock:

- `registerCommonServices()` — in `setUp`; registers the services every render
  needs (`MyColors` real; `MyPlatform`/`MyLocation` as channel-free stubs;
  `MyCrashlytics`/`MyFileCache` as no-op mocks).
- `putMockService<T extends GetxService>(mock)` — register a mockito mock with
  GetX. It stubs `onStart`/`onDelete` first, because GetX invokes those
  lifecycle callbacks and a raw mock returns a `SmartFake` that throws
  `FakeUsedError`. **Always** register service mocks through this, not
  `Get.put`.
- `pumpWithGetX(tester, child: …)` — pumps `child` inside a `GetMaterialApp`
  (l10n delegates wired) after `registerCommonServices()`, so `Get.find`
  resolves.
- `resetGetX()` — in `tearDown`; calls `Get.reset()` so registrations never leak
  between tests.

```dart
setUp(registerCommonServices);
tearDown(resetGetX);
```

## Mocking services

Mocks are **mockito nice mocks**, declared once in
`test/helpers/mock_services.dart`:

```dart
@GenerateNiceMocks([
  MockSpec<MyApi>(),
  MockSpec<MyUserService>(),
])
void main() {}
```

Add a `MockSpec<MyNewService>()` then regenerate (see
[Build, flavors & signing](build-flavors-signing.md)):

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Nice mocks return sensible defaults (`null`/`false`/`0`) for unstubbed calls;
stub with `when(...).thenReturn/thenAnswer` and assert with `verify(...)`. Use
`network_image_mock` when a widget loads network images. Static repositories
(`MyApi`-backed) are tested by mocking the network layer, not the repository.

## Fixtures

Shared test data comes from `TestFixtures` (`test/helpers/test_fixtures.dart`) —
static factory methods returning valid maps/entities with named params
defaulted, so fixture shapes are defined once rather than copied per file.

## Writing tests

- **Logic & controllers** → `test('…', () { … })`. Controllers that touch
  storage need their deps registered first:
  `SharedPreferences.setMockInitialValues({})`, `Get.putAsync`,
  `Get.put<MyConfig>`.
- **Widgets** → `testWidgets('…', (final WidgetTester tester) async { … })`,
  pumped via `pumpWithGetX`. Drive with `tester.tap` then
  `pump`/`pumpAndSettle`; query with `find.text` / `find.byType` /
  `find.byIcon`; assert with `findsOneWidget` / `findsNothing`. For a render
  smoke check, assert `tester.takeException()` is `isNull`.

```dart
testWidgets('shows progress while onPressed runs', (final WidgetTester tester) async {
  await pumpWithGetX(tester, child: MyButton(text: 'Save', onPressed: () async {}));
  await tester.tap(find.text('Save'));
  await tester.pump();
  expect(find.byType(MyCircularProgressBar), findsOneWidget);
});
```

## Integration tests

End-to-end flows live under `integration_test/<area>/…_test.dart` using the
`integration_test` SDK package. A single `integration_test/app_test.dart`
aggregates them — import each `as alias` and call `alias.main()` after
`IntegrationTestWidgetsFlutterBinding.ensureInitialized()`. Run the suite with
the env injected: `doppler run -- flutter test integration_test/app_test.dart`.

## Running & coverage

`flutter test test/ --coverage` writes `coverage/lcov.info`; the
`mise run tests:unit` task renders a per-file table and an HTML report. Coverage
is reported on **product code only** — generated files (`*.g.dart`,
`*.freezed.dart`, `*.gen.dart`) and non-product layers (`_shared/`,
`components/`, `themes/`) are excluded from the gate. A clean run with every new
service/controller/screen covered is the merge bar.

## Reading the report (lcov + genhtml)

`lcov.info` is a raw trace — turn it into a browsable HTML report with the
`lcov`/`genhtml` tools (`brew install --formulae lcov`). **Filter generated
output first** so codegen doesn't inflate the numbers, then render:

```sh
lcov --remove coverage/lcov.info \
  '*.g.dart' '*.freezed.dart' '*.gen.dart' '*.mocks.dart' '*/test/*' \
  --output-file coverage/lcov_filtered.info
genhtml coverage/lcov_filtered.info --output-directory coverage/html
open coverage/html/index.html
```

- `*.mocks.dart` (mockito), `*.g.dart`/`*.freezed.dart`/`*.gen.dart`
  (build_runner) and `*/test/*` are noise — `--remove` strips them.
- `genhtml` writes `coverage/html/index.html`; green lines ran, red lines
  didn't. Run it from the project root so source paths resolve.
- **`.gitignore` the whole `coverage/` dir** — both the trace files and the
  generated `html/` are throwaway:

```sh
coverage/
```

## Flutter Coverage Report

Generate an interactive HTML report from Flutter's `coverage/lcov.info` file
using the `genhtml` tool from the
[lcov project](https://github.com/linux-test-project/lcov).

## Prerequisites

`genhtml` must be installed via Homebrew:

```bash
brew install --formulae lcov
```

Verify it's available:

```bash
which genhtml   # should print /opt/homebrew/bin/genhtml
genhtml --version
```

## Generating Coverage Data

Run Flutter tests with coverage enabled first. The output lands at
`coverage/lcov.info` relative to the project root.

```bash
# Run all tests with coverage
flutter test --coverage

# Run a specific test file with coverage
flutter test --coverage test/modules/rides/rides_service_test.dart

# Run tests matching a pattern
flutter test --coverage --name 'MyService'
```

## Converting lcov.info to HTML

Use `genhtml` to convert the trace file into a browsable HTML report.

### Standard command (recommended)

```bash
genhtml coverage/lcov.info \
  --output-directory coverage/html \
  --title "My App Coverage" \
  --show-details \
  --highlight \
  --branch-coverage
```

### Quick one-liner (minimal flags)

```bash
genhtml coverage/lcov.info -o coverage/html
```

### Options explained

| Flag                        | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `-o` / `--output-directory` | Where to write the HTML files                                |
| `--title`                   | Title shown in the report header                             |
| `--show-details`            | Show per-file hit/found counts on the index page             |
| `--highlight`               | Colour-highlight the source lines (missed = red, hit = blue) |
| `--branch-coverage`         | Show branch coverage data (if present in lcov.info)          |
| `--prefix PATH`             | Strip a path prefix so file paths are shorter                |
| `--ignore-errors source`    | Continue if source files can't be found (useful in CI)       |
| `-j` / `--parallel`         | Use parallel processing for large projects                   |

## Opening the Report

```bash
open coverage/html/index.html
```

On macOS this opens the report in the default browser. The index page shows
per-directory and per-file hit rates. Click any file to see the annotated
source.

## Filtering Out Generated Files

Flutter projects typically contain generated files (`*.g.dart`,
`*.freezed.dart`, `*.gen.dart`) that inflate coverage numbers. Strip them from
the trace file before running `genhtml`:

```bash
# Remove generated files from the lcov data
lcov \
  --remove coverage/lcov.info \
  '*.g.dart' \
  '*.freezed.dart' \
  '*.gen.dart' \
  '*/test/*' \
  --output-file coverage/lcov_filtered.info

# Then generate HTML from the filtered file
genhtml coverage/lcov_filtered.info \
  --output-directory coverage/html \
  --title "My App Coverage" \
  --show-details \
  --highlight
```

## Full Workflow (copy-paste)

```bash
# 1. Run tests with coverage
flutter test --coverage

# 2. Filter out generated/test files
lcov \
  --remove coverage/lcov.info \
  '*.g.dart' '*.freezed.dart' '*.gen.dart' '*/test/*' \
  --output-file coverage/lcov_filtered.info

# 3. Generate HTML report
genhtml coverage/lcov_filtered.info \
  --output-directory coverage/html \
  --title "My App Coverage" \
  --show-details \
  --highlight

# 4. Open in browser
open coverage/html/index.html
```

## Output Structure

```text
coverage/
├── lcov.info              # Raw trace file from flutter test --coverage
├── lcov_filtered.info     # Filtered trace file (after lcov --remove)
└── html/
    ├── index.html         # Summary with per-directory hit rates
    ├── amber.png          # Status icons
    ├── [module]/
    │   ├── index.html     # Per-directory summary
    │   └── [file].dart.gcov.html  # Annotated source view
    └── ...
```

## Reading the Report

- **Green** lines — executed (hit) during tests
- **Red** lines — not executed (missed) during tests
- **Blue** (with `--highlight`) — recently changed lines
- The index shows `Lines: X%  (hit/found)` per file

## .gitignore Reminder

The `coverage/` directory (including the generated HTML) is typically
git-ignored. Confirm this is in `.gitignore`:

```text
coverage/
```

## Troubleshooting

**`genhtml: command not found`**

```bash
brew install lcov
```

**`lcov.info` is empty or missing**

```bash
# Make sure you ran flutter test --coverage, not just flutter test
flutter test --coverage
```

**Source files not found warnings** Run `genhtml` from the project root
directory, or pass `--source-directory`:

```bash
cd /path/to/flutterApp
genhtml coverage/lcov.info -o coverage/html
```

**`lcov --remove` flags a version mismatch** Both `lcov` and `genhtml` come from
the same brew package — make sure only one version is installed:

```bash
brew list lcov
lcov --version
genhtml --version
```
