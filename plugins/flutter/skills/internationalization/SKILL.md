---
name: internationalization
version: 0.1.0
category: development
description: How the Flutter app localizes — ARB files with English as the
  template, l10n.yaml config, the genarb → arb_translate → gen-l10n pipeline,
  GetMaterialApp delegate wiring, and L10n.of(context) usage. Auto-applies when
  editing ARB files or l10n.yaml.
license: MIT
user-invocable: false
paths:
  - "**/l10n.yaml"
  - "**/*.arb"
---

# Internationalization (l10n)

English is the source of truth; every other locale is generated from it. UI code
never hardcodes a string — it reads from the generated localizations.

## l10n.yaml

Controls generation. ARB sources live in `lib/config/lang/`, English is the
template, output goes to a directory excluded from analysis:

```yaml
arb-dir: lib/config/lang # source ARB files
template-arb-file: app_en.arb # English is the template
output-localization-file: app_localizations.dart
output-dir: lib/_shared/l10n/ # generated (excluded from analysis)
nullable-getters: false
preferred-supported-locales: [ en, hi, gu, mr, bn, ta, te, kn, ml, or, as, pa ]
```

`flutter.generate: true` must be set in `pubspec.yaml` for `gen-l10n` to run.

## ARB files

Author only `app_en.arb`. Each key pairs with an `@key` metadata entry carrying
a `description` (and `placeholders` for interpolation):

```json
{
  "@@locale": "en",
  "welcomeMessage": "Welcome to the app",
  "@welcomeMessage": {
    "description": "Greeting shown on the home screen"
  },
  "greeting": "Hello, {name}!",
  "@greeting": {
    "description": "Personalised greeting",
    "placeholders": { "name": { "type": "String" } }
  }
}
```

Add new strings to `app_en.arb` only — the other locales are filled by
translation (below). Always write a `description`; it's the context the
translator sees.

## The pipeline

Adding or changing a string runs three steps:

```text
genarb          # create empty app_<locale>.arb for any new locale in l10n.yaml
arb_translate   # auto-translate untranslated keys from app_en.arb (Gemini)
flutter gen-l10n# generate lib/_shared/l10n/app_localizations*.dart
```

`arb_translate` is installed globally from git and reads its API key from a
secret (`ARB_TRANSLATE_API_KEY`); it fills every non-English ARB from the
English template, then `gen-l10n` turns the ARBs into the typed
`AppLocalizations` class. A single project task usually chains all three — run
that rather than the steps by hand.

## Wiring

`GetMaterialApp` registers the generated delegate plus the Flutter global
delegates, and takes its supported locales from the generated class:

```dart
GetMaterialApp(
  localizationsDelegates: const [
    AppLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  supportedLocales: AppLocalizations.supportedLocales,
  // …
);
```

## Usage

Read every user-facing string from the localizations via `L10n.of(context)` —
never a hardcoded literal:

```dart
// ✅
MyText(L10n.of(context).welcomeMessage)
MyText(L10n.of(context).greeting(user.name))

// ❌
MyText('Welcome to the app')
```

`L10n.of(context)` resolves to the generated `AppLocalizations` for the active
locale. Because the getters are generated, a missing key is a **compile error**,
not a runtime surprise — which is why new strings always start in `app_en.arb`.
