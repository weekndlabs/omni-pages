---
title: "OpenClaw Integration & Command Grouping: OMNI v0.5.6-rc2"
description: "OMNI v0.5.6-rc2 introduces native support for the OpenClaw agent framework and intelligent command grouping in telemetry reports."
date: 2026-04-12
tag: Release Note
author: OMNI Core Team
---

Today we are releasing the second release candidate for v0.5.6, focusing on ecosystem integration and telemetry refinement. This update bridges the gap between OMNI's raw distillation power and the agent frameworks that consume it, starting with our most requested integration to date.

## Native OpenClaw Support

The highlight of this release is the official **OpenClaw Integration Plugin**. OpenClaw has quickly become a favorite for developers building autonomous shell agents, and OMNI is now a first-class citizen in that ecosystem.

We've introduced two new tools designed specifically for the Agent Loop:
- **`omni_shell`**: This tool allows an OpenClaw agent to execute commands and receive perfectly distilled, semantic-heavy output. This keeps the agent's context window lean and focused.
- **`omni_rewind`**: We understand that agents sometimes need the "missing pieces." If an agent feels it's missing critical detail, it can call `omni_rewind` to retrieve the hidden raw logs instantly.

This duo transforms OMNI from a simple terminal filter into a vital sensory organ for your AI agents.

## Command Grouping & Aggregation

If you use `omni stats`, you know that repetitive commands can sometimes clutter your impact report. v0.5.6-rc2 introduces **Intelligent Command Grouping**.

The engine now understands structural similarity. Running `ls -la /src/componentA` and `ls -la /src/componentB` will now be grouped into a single actionable entry in your telemetry. This provides a significantly cleaner signal report, allowing you to see exactly which *categories* of work are costing you the most in tokens. 

By aggregating these semantic patterns, you get a bird's-eye view of your project's noise profile that was previously impossible to see.

## Refined Logic & UI Clarity

As we move closer to the stable v0.5.6 release, we are polishing every interaction. We've renamed the `omni learn` flag `--status` to **`--discover`**. We realized "Status" was too generic; "Discover" accurately reflects the tool's power in identifying new noise patterns in your workflow.

Under the hood, we've hardened our storage layer with null-safe telemetry handling and fully synchronized our release automation across both the core engine and the new OpenClaw plugin.

## Looking Ahead

With rc2, the infrastructure for a truly "Agent-Aware" OMNI is in place. We are spending the next few days listening to the OpenClaw community and refining the command grouping heuristics before we move to the final release phase.

The agent just got a better pair of eyes.
