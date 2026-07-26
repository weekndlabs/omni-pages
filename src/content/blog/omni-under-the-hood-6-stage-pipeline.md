---
title: "Under the Hood: OMNI's 6-Stage Distillation Pipeline"
description: "A technical deep dive into the Rust-powered engine that intercepts, scores, and collapses your terminal output in sub-milliseconds."
date: 2026-05-29
tag: Engineering
author: OMNI Core Team
---

OMNI is fundamentally a fast, highly-optimized **Rust binary**. It sits entirely locally between your terminal and your AI agent (like Claude Code, Cursor, or Cline). 

But what actually happens when an agent executes a command? How does OMNI decide what is noise and what is signal? 

It goes through our lightning-fast **6-Stage Pipeline**.

## Stage 1: Normalize
AI agents send commands and outputs in drastically different formats. Claude Code uses `{stdout, stderr}`, Cursor uses `{content: [...]}`, and Codex uses `{action, result}`. 
OMNI first catches this payload and normalizes it into a standard `NormalizedHook` structure, giving us a clean slate.

## Stage 2: Tool Router
Before analysis, OMNI routes the data. 
- If the tool is `Bash`, it goes to the main pipeline. 
- If it's a `ReadFile` command, it goes to a specialized graph context distiller. 
- Edits and file creations bypass distillation completely to ensure code integrity.

## Stage 3: TOML Filters (Priority Override)
We check our extensive registry of `.toml` filters. If a developer has defined a custom rule (e.g., "always ignore warnings from `legacy_module`"), this filter takes precedence and skips the heavy Rust pipeline. This makes OMNI infinitely extensible.

## Stage 4: The Scorer
This is where the magic happens. Every single line of output is evaluated and assigned a score from `0.0` to `1.0`.
- **Critical (0.85 to 1.0):** Errors, exceptions, panics, `FAILED`.
- **Important (0.60 to 0.84):** Warnings, deprecations.
- **Noise (0.0 to 0.29):** Downloading, Compiling, progress bars.

*Crucially*, the Scorer is context-aware. If a line mentions a file that is "hot" (frequently edited in this session), its score is artificially boosted so the agent doesn't miss it.

## Stage 5: Collapse
Before finalizing, OMNI collapses repetitive noise. Two hundred lines of `Compiling xxx` are algorithimically folded into a single line: `[Compiling: 200 packages]`.

## Stage 6: Distiller Dispatch
Finally, the output is handed to one of 12 specialized Distillers based on the command. A `cargo` command goes to the `build.rs` distiller. A `kubectl` command goes to `cloud.rs`. These specialized modules format the final output perfectly for LLM consumption.

## The Route System

The final output is assigned a route:
- **Keep:** Clean signal, sent to the agent.
- **Rewind:** Too much noise. The raw output is saved locally to SQLite (RewindStore). The agent is given a hash (e.g., `omni_retrieve("a3f8")`) and can request the full logs via MCP if it really needs them.

All of this happens in less time than it takes your terminal to render the text. Pure signal, zero lag.
