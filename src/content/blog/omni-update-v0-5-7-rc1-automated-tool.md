---
title: "Automated Tool Distillation: OMNI v0.5.7-rc1"
description: "OMNI v0.5.7-rc1 introduces automated tool distillation, context-aware token estimation, and positional priority boosting."
date: 2026-05-03
tag: Release Note
author: OMNI Core Team
---

The first release candidate for v0.5.7 focuses on deep architectural improvements to token estimation, positional scoring, and security.

### Automated Tool Distillation

We have implemented automated distillation for `MultiEdit` and unhandled tool outputs. This natively reduces token usage without requiring custom filters, keeping your context windows lean even during massive refactors.

### Context-Aware Token Estimation

A new token estimation utility provides highly accurate cost and usage calculations directly within the ROI monitor. This gives you precise insight into exactly how many tokens (and dollars) OMNI is saving you in real-time.

### Positional Priority & Security Hardening

- **Positional Boosting**: Extracted positional boost logic to the semantic scorer, implementing dynamic priority-based segment distillation.
- **Security Hardening**: Expanded the denylist of restricted environment variables in `sanitize_env` to prevent injection attacks.
- **Diagnostic Detection**: The `BuildDistiller` now natively detects and prioritizes single-line diagnostics, preserving crucial git commit hashes in the collapse pipeline.
