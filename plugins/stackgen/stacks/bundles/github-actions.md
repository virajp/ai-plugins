---
name: GitHub Actions
axis: cicd
kind: ci-system
components:
- ci-system/github-actions@0.1.0
---

# CI — GitHub Actions

vwf's delivery-pipeline contract, implemented on GitHub Actions: workflow
layout, toolchain installation through the repo's own manager, the gate
sequence, and the tag-triggered release shape.

**Exactly one CI system per repo.** Generating for a second produces a pipeline
nobody runs and nobody updates, which is worse than none — a green check that
means nothing.

This bundle exists because the pack behind it had **no way to be offered**. CI
is chosen by the `projects.<name>.cicd` config key, and until the `cicd` axis
the menu was the only door a template could come through — so a pack landed
that nothing could ever materialize, silently. The slug is that config token.
