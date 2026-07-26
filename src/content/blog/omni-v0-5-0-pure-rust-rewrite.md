---
title: "The Native Era: OMNI v0.5.0 Rewritten Entirely in Rust"
description: "OMNI v0.5.0 is a ground-up rewrite in Rust: a sub-5MB binary, zero startup overhead, SQLite WAL persistence, and session-aware distillation."
date: 2026-03-23
tag: Release Note
author: OMNI Core Team
---

Scalability violently demands speed, and speed absolutely demands native execution. For months, OMNI operated as a hybrid architecture — a Zig core engine wrapped in a Node.js MCP server, connected by glue scripts and inter-process communication. It worked. It shipped. It saved millions of tokens. But we felt the ceiling pressing down. The V8 runtime added forty milliseconds of cold-start latency. The Zig-to-Node bridge introduced serialization overhead. The installation required both a native binary and a Node.js runtime. We had built something powerful, but we had also built something fragile.

So we made the hardest decision an engineering team can make: we threw it all away and started over.

## The Decision to Rewrite

Rewrites are famously dangerous. Joel Spolsky called them "the single worst strategic mistake that any software company can make." We wrestled with that warning for weeks. But our situation was different — we were not rewriting to add features. We were rewriting to remove an entire *category* of latency and complexity that no amount of incremental optimization could address. The Node.js runtime was a structural bottleneck, not a code-quality problem. The only way to eliminate it was to eliminate it entirely.

We chose Rust. Memory safety without garbage collection. Zero-cost abstractions. A single compiled binary with no runtime dependencies. And an ecosystem of battle-tested crates for everything from SQLite integration to ANSI processing. The decision was not trendy — it was thermodynamic. Rust gives us the performance ceiling we needed while ensuring that memory bugs cannot creep into infrastructure that sits in the critical path of every AI request.

## A 5-Megabyte Revolution

The result of this rewrite is breathtaking in its simplicity. OMNI v0.5.0 compiles to a single, statically-linked binary weighing under five megabytes. There is no Node.js. There is no Zig runtime. There is no V8 engine spinning up in the background. When you run `omni distill`, execution begins in microseconds — not the forty-plus milliseconds that the previous architecture imposed. For an AI agent making dozens of tool calls per minute, this latency elimination is the difference between seamless operation and perceptible lag.

## The RewindStore: Never Lose Context Again

One of the most transformative architectural decisions in the rewrite is the introduction of the **RewindStore** — a compressed content database powered by SQLite in WAL (Write-Ahead Logging) mode. Every piece of content that OMNI distills is now stored in a content-addressable archive, retrievable via `omni_retrieve(hash)`. This means your AI agent's context is never permanently lost. Even after aggressive distillation reduces a thousand-line build log to twenty lines of pure signal, the original content remains accessible if the agent needs to drill deeper.

WAL mode was chosen specifically for its concurrent read performance. Multiple processes — your build pipeline, your agent, your terminal — can simultaneously read from the RewindStore without locking or contention. Writes are serialized through the journal, ensuring data integrity even under heavy concurrent load.

## Session Continuity via Hooks

The rewrite introduced a fundamentally new approach to session management through the `SessionStart` and `PreCompact` hook system. When your AI agent begins a coding session, OMNI captures the session boundary and tracks continuity across commands. When the agent's context window approaches compaction, the `PreCompact` hook injects a snapshot of the most relevant distilled context, ensuring that critical state survives the context reduction. This is not just filtering — it is active context management.

## New Diagnostic and Learning Tools

Two new commands round out the v0.5.0 feature set. `omni doctor` provides comprehensive installation diagnostics — verifying hook presence, MCP registration, filter integrity, and database health in a single, beautifully formatted terminal report. `omni learn` auto-generates TOML filter rules from passthrough output, allowing the engine to continuously expand its semantic vocabulary based on the actual noise patterns in your specific workflow. Both commands leverage FTS5 (Full-Text Search 5) for session indexing, enabling sub-millisecond queries across your entire distillation history.

## Breaking Changes: A Clean Cut

This release carries three breaking changes, and we make no apology for any of them. The `omni monitor` command has been renamed to `omni stats` to better reflect its purpose. The hook format has changed entirely — users must run `omni init --hook` to reinstall. And the entire Node.js codebase has been removed. These breaks are the price of progress, and the performance gains they enable are worth every minute of migration effort.

## The Numbers That Matter

In our internal benchmarks, the Rust rewrite delivers a 94% reduction in cold-start latency, a 67% reduction in per-invocation memory usage, and a 100% elimination of runtime dependency requirements. The binary size dropped from a 45MB Node.js bundle to a 4.8MB native executable. These are not incremental improvements. This is a generational leap.

## What Comes Next

The native era begins now. With Rust as our foundation, every future feature — session awareness, predictive context, distributed caching — can be built on a platform that guarantees microsecond latency and zero-allocation hot paths. We have burned the boats. There is no going back to interpreted runtimes. The only direction is forward, and the speed limit just got removed.