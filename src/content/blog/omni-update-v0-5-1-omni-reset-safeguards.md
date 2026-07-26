---
title: "Backup and reset safeguards: OMNI v0.5.1"
description: "OMNI v0.5.1 ships omni reset for safe configuration removal, automated release workflows, omni learn stability fixes, and sub-50ms latency assertions."
date: 2026-03-24
tag: Release Note
author: OMNI Core Team
---

Control over your workspace is paramount. When you integrate a tool that modifies your shell hooks, injects MCP server configurations, and intercepts your agent's communication layer, you need an absolute guarantee that you can cleanly remove it without leaving ghost artifacts behind. OMNI v0.5.1 introduces the `omni reset` architecture, a comprehensive, safe, and transparent disengagement mechanism that treats uninstallation as a first-class feature.

## The `omni reset` Philosophy

Most developer tools treat uninstallation as an afterthought, a neglected shell script buried in a forgotten documentation page. We believe the exit experience is just as important as the onboarding experience. The new `omni reset` command safely archives your local configurations to `~/.omni.<timestamp>.bak` before removing any agent integrations. Your MCP server registrations, hook injections, and filter configurations are cleanly unwired from Claude, Antigravity, and any other connected agent platform. If you ever want to come back, your backup is waiting exactly where you left it.

The reset operation is explicitly designed to *never* risk your existing bash logic. It identifies and removes only OMNI-specific hooks and configurations, leaving every other line of your shell profile, MCP settings, and IDE configuration completely untouched. This surgical precision required careful reverse-engineering of every integration point to ensure zero collateral damage.

## Automated Release Pipeline

For our internal development velocity, we shipped the `make release` command, a single-invocation release pipeline that handles version bumping across all manifest files, creates a signed commit, and pushes a tagged release. What previously required six manual steps and careful copy-pasting is now a single, deterministic, idempotent command. This workflow improvement has already reduced our release cycle time from twenty minutes to under two, and it eliminates an entire class of human error around version mismatches.

## Stabilizing `omni learn`

The `omni learn` command (which auto-generates TOML filter rules from passthrough output) received critical stability fixes in this release. The most impactful was a fix for stdin "hanging" when the command was run interactively without piped input. The engine would block indefinitely waiting for data that would never arrive, forcing users to manually kill the process. We added proper timeout detection and a graceful fallback message explaining that `omni learn` requires piped input.

We also fixed TOML parsing errors that occurred when the generated filter rules contained unescaped quotes, and improved the deduplication logic so that `omni learn` now intelligently skips patterns that already exist in your `learned.toml` file. Running the same command twice no longer produces duplicate filter entries.

## The TOML Generation Quality Problem

A deeper fix addressed the generation of filter rules containing invisible ANSI control characters. When terminal output with color codes was fed into `omni learn`, the generated TOML patterns would contain raw escape sequences that looked correct in a text editor but failed to match actual runtime output (which has the ANSI codes stripped). We implemented proper escaping at the generation boundary, ensuring that learned patterns match the *semantic* content of the output, not its visual representation.

## Project-Scoped MCP Detection

The `omni doctor` diagnostic was enhanced to correctly identify and validate nested project keys in `~/.claude.json`. Previously, the doctor only checked for top-level MCP server registrations, missing project-scoped configurations that are increasingly common in monorepo environments. The detection now recursively scans the configuration tree, providing accurate diagnostic coverage regardless of how your MCP server is registered.

## Sub-50ms: The Latency Contract

Perhaps the most important addition in this release is not a feature but a *contract*. We added deterministic benchmark tests that assert OMNI's distillation pipeline completes in under fifty milliseconds for a standard input payload. If a code change causes the pipeline to exceed this threshold, the CI build fails. This is not a performance suggestion. It is a hard, automated guarantee. Your AI agent will never wait for OMNI. The distillation is faster than the network round-trip to the model API, making it effectively invisible in the request lifecycle.

## The Resilience Standard

With safe reset, stable learning, accurate diagnostics, and enforced latency contracts, v0.5.1 establishes OMNI's resilience baseline. Every feature can be cleanly removed. Every generated artifact is correct. Every diagnostic is accurate. Every operation completes in guaranteed time. This is the level of engineering rigor we demand from infrastructure that sits in the critical path of AI-assisted development.