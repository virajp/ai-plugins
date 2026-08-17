# Flutter Testing Standards

Tests live under `test/` and **mirror `lib/`** — `lib/components/button.dart` →
`test/components/my_button_test.dart`. Each file is `void main()` with a
top-level `group('<Subject>', …)`. Cover **every new service, controller, and
product widget**; the general style rules (final params, single quotes, return
types) apply to test code too — see the **dart** skill.

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

Add a `MockSpec<MyNewService>()` then regenerate (see the **build** reference):

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
