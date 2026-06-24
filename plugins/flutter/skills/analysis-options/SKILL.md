---
name: analysis-options
version: 0.1.0
category: development
description: Opinionated analysis_options.yaml for Flutter — extends
  flutter_lints
  with an explicit strict linter rule set, the formatter block (page_width 120,
  automate trailing commas), analyzer error severities, and generated-code
  excludes. The concrete backing of the dart skill's style rules; a clean
  `flutter analyze` is the merge gate. Auto-applies when editing analysis_options.yaml.
license: MIT
user-invocable: false
paths:
  - "**/analysis_options.yaml"
---

# Analyzer & Lint Configuration

`analysis_options.yaml` at the package root is the **machine-enforced** form of
the **dart** skill's style rules: a clean `flutter analyze` is the merge gate.
Start from `flutter_lints`, then turn on an explicit, curated rule set — keep
the list spelled out (not a vague "all lints") so every rule is a deliberate
choice.

## Structure

```yaml
include: package:flutter_lints/flutter.yaml

# Reference: https://dart.dev/tools/linter-rules
linter:
  rules:
    # Style
    - prefer_single_quotes
    - always_use_package_imports
    - eol_at_end_of_file
    - require_trailing_commas
    - unnecessary_brace_in_string_interps
    - prefer_interpolation_to_compose_strings
    # Type safety & explicitness
    - always_declare_return_types
    - type_annotate_public_apis
    - specify_nonobvious_local_variable_types
    - prefer_typing_uninitialized_variables
    - avoid_bool_literals_in_conditional_expressions
    - unrelated_type_equality_checks
    # const / immutability
    - prefer_const_constructors
    - prefer_const_constructors_in_immutables
    - prefer_const_declarations
    - prefer_const_literals_to_create_immutables
    - prefer_final_fields
    - prefer_final_locals
    - prefer_final_in_for_each
    - prefer_final_parameters
    # Structure
    - sort_constructors_first
    - sort_unnamed_constructors_first
    - sort_child_properties_last
    - cascade_invocations
    - prefer_expression_function_bodies
    - prefer_mixin
    - use_enums
    # Flutter / widgets
    - use_key_in_widget_constructors
    - sized_box_for_whitespace
    - avoid_unnecessary_containers
    - use_build_context_synchronously
    - use_full_hex_values_for_flutter_colors
    # Safety / correctness
    - cancel_subscriptions
    - await_only_futures
    - avoid_void_async
    - control_flow_in_finally
    - throw_in_finally
    - empty_catches
    - depend_on_referenced_packages
    - secure_pubspec_urls
    - valid_regexps
    # …keep the full curated list explicit — these groups are representative.

formatter:
  page_width: 120
  trailing_commas: automate

# Reference: https://dart.dev/tools/analysis
analyzer:
  errors:
    todo: ignore
  exclude:
    - "lib/_shared/l10n/**"
```

## Notes

- **`formatter`** pins `page_width: 120` and `trailing_commas: automate` — the
  formatter inserts trailing commas, and the `require_trailing_commas` lint
  keeps them; the two agree by design. `dart format` reads these.
- **`analyzer.errors`** sets severities. `todo: ignore` silences TODO info; to
  make a lint blocking rather than a warning, raise it here (e.g.
  `invalid_annotation_target: error`).
- **`analyzer.exclude`** drops generated/non-authored code from analysis —
  generated l10n (`lib/_shared/l10n/**`) and any `*.g.dart`/`*.gen.dart` you
  don't hand-edit. Don't exclude product code to dodge a lint; fix the code.
- **Single source of truth.** In a monorepo, keep one root
  `analysis_options.yaml` and have member packages `include:` it rather than
  drifting per-package (see the **workspace** skill). Every rule here should
  match a rule the **dart** skill describes in prose — the two stay in lockstep.
