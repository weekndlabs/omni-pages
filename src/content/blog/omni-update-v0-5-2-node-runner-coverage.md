---
title: "Deep JS/TS package runner coverage: OMNI v0.5.2"
description: "OMNI v0.5.2 adds native filter support for npm, yarn, pnpm, bun test runners and Python pytest variants, with improved test diff preservation."
date: 2026-03-25
tag: Release Note
author: OMNI Core Team
---

JavaScript monorepos generate an absolutely staggering amount of terminal noise. A single `npm run build` on a medium-complexity Next.js application can produce hundreds of lines of Webpack progress bars, chunk summaries, tree-shaking reports, and sourcemap diagnostics, none of which carry any value for an AI agent trying to debug a type error on line forty-seven. Until now, OMNI's filter coverage for the JavaScript ecosystem had significant gaps in how it handled package runner invocations. Version 0.5.2 closes those gaps comprehensively.

## First-Class Package Runner Support

This release introduces native TOML filter support for every major JavaScript package runner variant: `npm run`, `yarn run`, `pnpm run`, and `bun run`. Each runner produces subtly different output formatting (Yarn wraps output in its own progress indicators, pnpm prefixes lines with workspace labels, Bun strips colors differently than Node), and OMNI now handles each dialect correctly. The filters are tuned to preserve error output, failed assertion messages, and runtime exceptions while aggressively stripping build progress noise, bundle size reports, and dependency resolution logs.

## Python Test Runner Coverage

The coverage expansion extends beyond JavaScript. We added explicit support for `python -m pytest` and `python3 -m pytest` command patterns, the canonical way pytest is invoked in virtual environment workflows. Previously, OMNI recognized bare `pytest` commands but missed the module-invocation syntax that most CI systems and Poetry-managed projects use. This gap was silently allowing thousands of lines of pytest collection output (the verbose `collecting...` and fixture setup logs) to pass through to the AI unfiltered.

We also added first-class support for `bun test` and `bun run test`, the rapidly growing Bun test runner that is becoming the default choice for performance-conscious TypeScript teams.

## Preserving What Matters: Multi-Line Test Diffs

One of the more nuanced improvements in this release addresses a problem specific to modern test frameworks. When Vitest or Jest reports a failing assertion, it produces a multi-line diff showing the expected versus actual values. These diffs often contain empty lines for visual formatting. Our previous empty-line stripping rules were inadvertently munching these meaningful blank lines, collapsing test diffs into incomprehensible single-line blobs. We refined the stripping logic to detect when a sequence of text is inside a test failure diff block and preserve its internal whitespace structure. The result is dramatically improved readability for AI agents trying to understand test failures.

## Precision Analytics

The token savings calculations in `omni stats` received an accuracy pass in this release. We discovered that the previous formula was slightly overestimating savings for commands that produced very short output (under fifty tokens), because the fixed overhead of the distillation metadata was not being accounted for. The corrected formula now accurately reflects net savings after overhead, giving you numbers you can trust for ROI reporting.

## Compiler Compliance

On the code quality front, we resolved all remaining Clippy warnings across the codebase, including a subtle `implicit-saturating-sub` lint in the distillation hooks that was performing an unnecessary bounds check on unsigned integer subtraction. These are the kinds of imperceptible performance drains that accumulate over millions of invocations and eventually become measurable, eliminating them now prevents that entropy from ever taking hold.

## The Ecosystem Coverage Thesis

Every filter we ship represents a bet on the tools our users rely on. When we invest engineering time into supporting `pnpm run` or `bun test`, we are saying: "We understand your workflow, and we optimize for it." This release brings our total ecosystem coverage to over a hundred distinct command patterns across seven programming language ecosystems. The noise has fewer and fewer places to hide.