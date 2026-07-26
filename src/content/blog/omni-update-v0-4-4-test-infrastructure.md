---
title: "Hardening the Core: Massive Test Infrastructure in v0.4.4"
description: "OMNI v0.4.4 adds a full test suite, fixes shell injection holes, eliminates Wasm memory leaks, and introduces dynamic signal-density scoring."
date: 2026-03-19
tag: Release Note
author: OMNI Core Team
---

Production reliability is not a feature — it is a baseline. You do not get to ship infrastructure that sits in the critical path of every AI request and treat testing as an afterthought. Yet until this release, OMNI's test coverage was embarrassingly thin. We had a handful of smoke tests, some manual verification scripts, and a lot of confidence that our code worked because it "seemed fine in production." Version 0.4.4 confronts that technical debt head-on with a massive test infrastructure build-out that touches every critical subsystem in the engine.

## The Test Suite Architecture

We implemented a comprehensive test suite in the `tests/` directory covering the four highest-traffic filter domains: Git, Docker, SQL, and Node. Each domain includes fixture-driven tests that feed real-world output through the distillation pipeline and assert exact semantic extraction results. We also built test coverage for the MCP server gateway — the communication layer between your AI agent and OMNI — verifying that tool requests are correctly routed, payloads are properly formatted, and error responses are semantically meaningful.

Supporting this suite, we shipped new test helpers and fixtures that make it trivial to add verification for future filters. A single function call sets up an isolated test context, feeds input through the pipeline, and returns structured assertions about what was preserved, what was stripped, and what score was assigned. This infrastructure investment pays compound dividends on every future release.

## CI/CD Integration

The test suite is not optional. We fully wired the semantic verification suite (`test-semantic.mjs`) and the unit test battery into both our Makefile and the GitHub Actions CI workflow. Every pull request, every commit to main, every release candidate — all must pass the complete test matrix before merging. This is automated quality gating, not optional code review suggestions. The pipeline fails loudly and blocks the build on any regression, forcing immediate attention to quality issues before they reach production.

## Closing the Shell Injection Gap

During the test infrastructure build, we discovered a critical security vulnerability hiding in plain sight. The `omni_grep_search` and `omni_find_by_name` MCP tools were constructing shell commands by string concatenation, creating a textbook shell injection vector. A carefully crafted search query could escape the argument boundary and execute arbitrary commands on the host system. We switched both tools to `execFileAsync` with properly escaped array arguments, completely eliminating the injection surface. This fix was shipped as a priority patch before the rest of the v0.4.4 features.

## Plugging the Wasm Memory Leak

The Wasm engine that powers OMNI's compression logic had a slow but persistent memory leak. Every invocation allocated a working buffer for the distillation computation, but the deallocation path was only reached on successful completion. If an error occurred mid-distillation — a malformed input, a filter timeout, an unexpected encoding — the buffer was orphaned. Over hundreds of invocations, this leaked memory accumulated and eventually triggered out-of-memory conditions in long-running agent sessions. We wrapped the entire Wasm compression logic in `try/finally` blocks, guaranteeing that allocated memory is always freed regardless of the execution path.

## Rethinking SQL Parsing

The SQL filter received a fundamental architectural fix. The previous implementation used space-based splitting to tokenize SQL statements, which catastrophically broke on `--` style comments. A query like `SELECT * FROM users -- get all users` would split incorrectly, causing the entire distillation to produce garbage output. We refactored `sql.zig` to use line-based splitting (`std.mem.splitAny`), which correctly handles inline comments, multi-line strings, and all other SQL syntax constructs. This seemingly simple change resolved a class of bugs that had been generating subtle, hard-to-diagnose distillation errors for months.

## Dynamic Signal-Density Scoring

One of the more architecturally significant changes in this release is the replacement of hardcoded confidence scores with dynamic signal-density calculations. Previously, the Git, Docker, SQL, and Node filters all returned a fixed `1.0` confidence score regardless of the actual content quality. This meant the engine could not distinguish between a highly informative three-line error message and a low-value twenty-line status dump — both received maximum confidence. The new dynamic scoring system analyzes the actual signal density of the distilled output, assigning proportional confidence scores that improve downstream LLM decision-making.

## MCP Exit Code Transparency

A subtle but impactful fix addressed the `omni_execute` tool and its aliases. Previously, these tools always returned a success status code in the MCP response metadata, even when the underlying command failed. This meant your AI agent could not programmatically distinguish between a successful build and a failed one — it had to parse the output text to infer the result. We modified the tool response to include the actual command exit code, enabling proper programmatic error handling in automated agent pipelines.

## The Testing Manifesto

This release represents a philosophical inflection point for OMNI. We are no longer a project that moves fast and trusts intuition. We are an infrastructure project that moves precisely and trusts evidence. Every filter, every tool, every communication pathway has a test that verifies its behavior. When we ship a release, we know — mathematically, deterministically — that it works. That is the standard we commit to from this point forward.