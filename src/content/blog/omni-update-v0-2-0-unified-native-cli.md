---
title: "The Native Transition Begins: OMNI Unified CLI v0.2.0"
description: "OMNI v0.2.0 replaces fragmented shell scripts with a unified, high-performance native CLI featuring distill, density, report, bench, and generate subcommands."
date: 2026-03-15
tag: Release Note
author: OMNI Core Team
---

Every ambitious software project reaches a moment where its skeletal prototype must either evolve into a proper architecture or collapse under the weight of its own accumulated workarounds. OMNI reached that moment during the v0.1.x development cycle. What started as a collection of bash scripts, a Zig compression engine, and a Node.js MCP server had grown into a fragile web of inter-process communication held together by environment variables and hardcoded paths. It worked — barely — and every new feature threatened to break something unrelated. Version 0.2.0 is the architectural reset that saved the project.

### From Scripts to Subcommands

The centrepiece of this release is the consolidation of OMNI's entire surface area into a unified, high-performance native CLI. Every capability that previously existed as a standalone script — distillation, density analysis, metrics reporting, benchmarking, template generation — is now a proper subcommand of the `omni` binary.

`omni distill` replaces the old `omni-distill.sh` pipeline script. `omni density` provides real-time signal-to-noise analysis for arbitrary input. `omni report` generates the metrics dashboards that were previously buried in a separate Node.js analytics tool. `omni bench` runs the internal benchmark suite against your local installation. `omni generate` produces agent-specific configuration templates for both Antigravity and Claude Code. And `omni setup` handles post-installation configuration that was previously documented as a series of manual steps.

### The Zig Build System

This architectural unification was made possible by fully integrating the Zig build system (`build.zig`) for cross-platform native and WebAssembly compilation. A single `zig build` invocation now produces both the native CLI binary and the Wasm module used by the MCP server, from the same source code, with the same optimization flags. This eliminates an entire category of bugs where the native and Wasm paths produced different distillation results due to separate compilation configurations.

The build system also supports cross-compilation out of the box, enabling us to produce binaries for macOS, Linux, and Windows from a single CI machine — a capability that would have required three separate build environments under the old script-based approach.

### Agent Template Generation

The `omni generate` subcommand introduces a templating system for agent integration. Instead of manually editing MCP configuration files, you run `omni generate antigravity` or `omni generate claude-code` and receive a properly formatted, ready-to-use configuration block. The templates include all necessary tool definitions, filter configurations, and hook references — reducing the integration setup from a fifteen-minute documentation-reading exercise to a ten-second command.

### Legacy Migration

All previous shell scripts were preserved in `scripts/legacy/` for reference and gradual deprecation. The `install.sh` installer was rewritten to use the native build pipeline, producing a self-contained binary instead of a collection of scripts that required specific directory structures and path configurations.

### Why Architecture Matters

Version 0.2.0 does not add a single new AI capability. It does not improve distillation quality, expand filter coverage, or optimize performance. What it does is far more important: it creates the architectural foundation for everything that follows. Every feature from v0.3.0 onward — custom DSL rules, session awareness, the Rust rewrite — was only possible because v0.2.0 established clean boundaries, proper subcommand routing, and a unified build system. Architecture is not glamorous. But it is the difference between a project that scales and a project that suffocates.