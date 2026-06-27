---
name: coverage-report
version: 0.1.0
category: development
description: >
  Generate an interactive HTML coverage report from a Flutter test coverage
  lcov.info file using the lcov tool (genhtml), including filtering out generated
  files. Use when you want to view test coverage, convert lcov.info to HTML, open
  a coverage report in the browser, check which lines are covered or uncovered,
  or run flutter test with coverage.
license: MIT
user-invocable: false
---

# Flutter Coverage Report

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
