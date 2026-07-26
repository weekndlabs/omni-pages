---
title: "Engrams & Session Health: OMNI v0.5.9"
description: "OMNI v0.5.9 introduces Engrams for subtask digests, a Session Health Dashboard, Smart PreCompact v2, and Session Handoff capabilities."
date: 2026-06-04
tag: Release Note
author: OMNI Core Team
---

We are thrilled to announce the release of OMNI v0.5.9! This update focuses on enhancing long-term session stability, context portability, and deeper visibility into agent health.

## Engrams (Automatic Subtask Digest)

To prevent context amnesia during long development sessions, we've introduced **Engrams**. These are rule-based state snapshots capturing subtask progress (e.g., error resolved, commits, test passes) to ensure your AI agents maintain a consistent memory of what has been accomplished.

## Session Health Dashboard

Keep your finger on the pulse of your agent's context with the new **Session Health Dashboard**. By running `omni session --health`, you can instantly visualize context pressure, token savings, engrams, tool activity, and hot files.

## Smart PreCompact v2

Context packing is now more intelligent and priority-aware. The Smart PreCompact v2 engine prioritizes Critical Errors, Engrams, Tool Summaries, and Hot Files. It also includes SHA-256 delta detection to safely skip redundant context injections.

## Session Handoff & Portability

Switching terminal sessions or environments? The new `omni_handoff` MCP tool allows you to export the entire session state as portable markdown, enabling seamless context transfer between terminal sessions.

## Advanced Context Re-injection & Summaries

- **Rolling Tool Call Summary**: Automatically aggregates the last 50 tool calls, including success/error rates, exposed via the `omni_session("summary")` tool for agent reference when context pressure gets high.
- **Periodic Context Re-injection**: Vital rules and pinned files (like `AGENTS.md`) are now automatically re-injected into the agent's context when pressure is elevated and after a set interval to ensure absolute adherence to development protocols.
