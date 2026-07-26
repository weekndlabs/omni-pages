---
title: "Scaling Intelligence: 60+ New Polyglot Filters in v0.4.5"
description: "OMNI v0.4.5 delivers 60+ polyglot semantic filters, SHA256 hook integrity verification, project trust boundaries, and autonomous filter discovery."
date: 2026-03-20
tag: Release Note
author: OMNI Core Team
---

An AI context filter is only as intelligent as its parser coverage. You can build the most elegant distillation architecture in the world, but if it does not understand the output format of Playwright, or Prisma, or Terraform, then it is just a generic text compressor with a fancy name. OMNI v0.4.5 is our most aggressive ecosystem expansion to date, shipping over sixty new highly specialized semantic filters that span the entire modern development landscape.

## The Polyglot Expansion

Let us talk about the scale of this release. Sixty-plus new filters is not a marketing number — it is a meticulous, hand-tuned collection of semantic extraction rules spanning seven ecosystems. For **Node and TypeScript**, we added dedicated filters for npm, yarn, pnpm, bun, tsc, eslint, prettier, vitest, jest, cypress, playwright, next.js, vite, webpack, and nx. For **Python**, we covered pytest, ruff, mypy, black, isort, pip, and poetry. **Rust, Go, and Zig** received filters for cargo, rustfmt, clippy, go build, go test, zig build, and zig test. The **DevOps and cloud** category exploded with support for docker, docker-compose, kubectl, terraform, terragrunt, helm, ansible, skaffold, and argocd. We even covered **security scanning** tools — semgrep, trivy, gitleaks, snyk, hadolint, and kubesec — and **mobile platforms** including flutter, react-native, android-build, composer, gradle, and make.

Every single one of these filters was tested against real-world output captured from production development environments. We did not guess what Playwright's failure output looks like — we ran thousands of test suites and analyzed the actual noise patterns.

## Codex CLI and OpenCode AI Integration

For the first time, OMNI natively supports the top-tier AI agent platforms beyond Claude. Running `omni generate codex` or `omni generate opencode` automatically registers OMNI's MCP server and injects specialized filter bundles optimized for each ecosystem's specific tool-calling patterns. This is not a generic "works with everything" claim — each integration is purpose-built to handle the unique output formats and error patterns of its target platform.

## Hook Integrity: Trust but Verify

Security in the AI agent toolchain is a topic that the industry has largely ignored. When your agent executes shell commands through an MCP hook, that hook script has access to your entire terminal environment. A compromised hook could silently exfiltrate data, modify command output, or inject malicious context into your AI's reasoning chain. OMNI v0.4.5 addresses this with SHA256-based hook integrity verification.

Every OMNI hook script now carries a cryptographic hash. On startup, the engine validates that the installed hooks match their expected hashes via the `omni_trust_hooks` command. If a hook has been modified — whether by an attacker, a buggy update script, or accidental manual editing — OMNI refuses to execute it and alerts the user. This is the same cryptographic verification pattern used by package managers and firmware update systems, applied to the AI context layer.

## Project Trust Boundaries

Complementing hook verification, we introduced the `omni_trust` command for project-level configuration security. When OMNI discovers a project-specific `omni_config.json` in a repository, it does not blindly apply those rules. Instead, it prompts you to review and explicitly trust the configuration before it takes effect. This prevents a malicious repository from injecting custom filter rules that could suppress security warnings or exfiltrate sensitive output patterns. Trust is earned, not assumed.

## Autonomous Filter Discovery

In an experimental preview, we shipped the `omni_learn` tool via Wasm — an autonomous discovery engine that analyzes passthrough output and suggests new filter rules for repetitive noise patterns. When the engine detects that the same twenty lines of webpack progress output are appearing in every build, it proposes a filter rule to eliminate them. This self-improving feedback loop is the first step toward a truly adaptive context engine that learns from your specific development patterns.

## Test Suite Migration to TypeScript

The entire test suite was migrated from JavaScript to TypeScript using the Bun runtime, adding over fifty new ecosystem fixtures for robust verification. Each filter is now tested against multiple output variants — success cases, failure cases, edge cases — ensuring that distillation accuracy remains high across the full spectrum of real-world scenarios. The migration also uncovered several subtle parsing bugs in the old JavaScript tests that were silently passing due to loose type coercion.

## The Coverage Imperative

With this release, OMNI's filter coverage now spans over a hundred and sixty distinct command patterns across seven programming ecosystems, three cloud platforms, and six security scanning tools. Every filter we ship represents a commitment: if your workflow uses this tool, OMNI will understand its output. That commitment is not theoretical — it is backed by thousands of test fixtures and continuous integration verification on every single commit.