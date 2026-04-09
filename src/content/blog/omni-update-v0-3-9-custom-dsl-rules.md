---
title: "Token Surgery: Custom Filtering DSL in v0.3.9"
description: "OMNI v0.3.9 exposes the semantic stripping engine to users via a JSON-based DSL, ships omni uninstall, and introduces dynamic confidence scoring."
date: 2026-03-16
tag: Release Note
author: OMNI Core Team
---

Your codebase is unique. Your internal tooling is unique. The error messages your proprietary build system produces are unique. And that means no matter how many generic filters we ship, there will always be noise patterns that only *you* encounter. OMNI v0.3.9 addresses this fundamental reality by exposing our semantic stripping engine to end users via a highly tuned, JSON-based configuration DSL. For the first time, you are not limited to the filters we provide — you can write your own.

### The Custom Rules DSL

The new `omni_config.json` DSL allows developers to define precise, regex-based extraction and deletion rules that operate alongside OMNI's built-in filter system. Each rule specifies a command pattern to match against, a set of regex patterns to preserve (extraction rules), and a set of regex patterns to eliminate (deletion rules). The syntax is deliberately minimal — a three-line JSON object can eliminate an entire category of proprietary noise that has been polluting your AI's context for months.

Consider a real-world scenario: your company uses a custom build system that prefixes every line with a sixteen-character build ID and a timestamp. This noise is meaningless to the AI but consumes tokens on every single build invocation. A single DSL deletion rule strips it instantly, and the rule travels with your project in version control so every team member benefits automatically.

### Dynamic Confidence Scoring

Under the hood, the filter system received a significant architectural upgrade with the introduction of semantic confidence scoring. Instead of applying all matching filters with equal weight, the engine now dynamically calculates a confidence score based on how strongly the input matches each filter's activation patterns. A weak match — say, a generic text filter that triggers on any terminal output — receives a low confidence score, while a strong match — a Docker filter that detects a Dockerfile build log — receives a high score. The distillation strategy adapts accordingly, applying more aggressive compression to high-confidence matches and conservative preservation to uncertain ones.

### The `omni uninstall` Command

We shipped the `omni uninstall` command for clean, comprehensive removal of the entire OMNI installation. Running this command removes the `~/.omni` directory and automatically cleans up MCP configurations from Antigravity, Claude Code CLI, and Claude Desktop. Unlike a manual `rm -rf`, the uninstall command understands the full topology of OMNI's integration surface and surgically removes every artifact without risking collateral damage to other tools' configurations.

### Agent Autopilot Documentation

Alongside the technical features, we invested heavily in documentation for the **Agent Autopilot** workflow — a dedicated guide that walks AI agent users through the integration process step by step. The documentation covers initial setup, filter customization, performance tuning, and troubleshooting common integration issues. Clear documentation is not an optional nice-to-have — it is a force multiplier that reduces our support burden and increases user confidence.

### Resolving the Use-After-Free

This release also includes a critical fix for a use-after-free segmentation fault in the JSON config parser. When loading custom DSL rules, the engine was storing string references into a parser buffer that could be freed during config reloading. We allocated owned copies of all config strings, making the parsed configuration completely self-contained and safe against buffer lifecycle issues. This bug had been causing intermittent, impossible-to-reproduce crashes for users who frequently modified their config files.

### Automatic CI for Pull Requests

We added the `.github/workflows/ai-pr-describer.yml` workflow for automated pull request descriptions. Every PR now receives an AI-generated summary of the changes, making code review faster and more informed. The descriptions are generated from the diff content using semantic analysis, providing reviewers with context that would otherwise require manually reading every changed file.

### The Extensibility Thesis

With custom DSL rules, confidence scoring, and clean lifecycle management, OMNI v0.3.9 marks the transition from a fixed-function filter to an extensible platform. We provide the engine, the built-in intelligence, and the infrastructure — but you control the semantic decisions. This balance between opinionated defaults and user extensibility is the design principle that will guide every future release.