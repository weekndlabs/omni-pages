---
title: "Semantic Session Guardrails: OMNI v0.5.8-rc1"
description: "OMNI v0.5.8-rc1 introduces hot file detection, build failure preservation, and a massive test suite modernization."
date: 2026-05-08
tag: Release Note
author: OMNI Core Team
---

Kicking off the v0.5.8 release cycle, rc1 brings major advancements in session safety and test suite reliability.

## Semantic Session Guardrails

We are taking proactive steps to protect your codebase during autonomous operations:
- **Hot File Detection**: Automatically triggers a `SessionEnd` hook when active files show abnormal mutation frequency, prompting agents to review before committing.
- **Build Failure Preservation**: The `BuildDistiller` now preserves full `CommandOutput` for build failures (non-zero exit codes) in the collapse pipeline, ensuring agents see exact errors.
- **Diagnostic Context**: The `PreBuild` hook now runs `cargo check` to surface compiler errors early in the session, reducing wasted tokens on broken states.

## Passthrough & Smart Thresholding

- **OMNI_PASSTHROUGH**: We've added support for raw output emission via environment variables for manual debugging.
- **Smart Bypass**: Automatic distillation bypass for small configuration files and content under a 2000-token minimum threshold, keeping fast tasks fast.

## Test Suite Modernization

Under the hood, we've systematically refactored the entire Rust test suite (~300 tests) to align with modern idiomatic standards. This includes transitioning to behavioral function names (`returns_*`, `preserves_*`) and purging all remaining mixed-language legacy code.
