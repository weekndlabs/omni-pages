---
title: "Multi-Agent Awareness & Outer Loop: OMNI v0.5.7"
description: "OMNI v0.5.7 brings multi-agent awareness, persistent project knowledge, and an automated outer loop for LLM filter optimization."
date: 2026-04-27
tag: Release Note
author: OMNI Core Team
---

We are thrilled to release OMNI v0.5.7, a major milestone that brings agents out of their silos. This release introduces **Multi-Agent Awareness**, persistent memory, and an automated outer loop for pattern discovery.

### Multi-Agent Awareness & Persistent Knowledge

Agents shouldn't have to relearn your project every time they start a session. 
- **`omni_agents`**: A new MCP tool allowing agents (like Claude, Cursor, and Copilot) to discover and interact with each other's state on the same project.
- **`omni_knowledge`**: Cross-session memory for agents to permanently learn and store project-specific quirks and filter preferences.

### Advanced ROI & Meta-Harness Outer Loop

We've integrated powerful diagnostics directly into the agent toolkit:
- **`omni_history` & `omni_budget`**: Direct MCP access to distillation logs and ROI simulators, empowering agents to track their own token efficiency.
- **`omni optimize`**: Our new Meta-Harness Outer Loop automatically validates generated LLM filters, closing the loop on autonomous pattern discovery.

### Distiller Enhancements

- **Non-Bash Tool Routing**: The engine now handles `ReadFile`, `Grep`, and `WebFetch` output seamlessly.
- **Context Preservation**: Build and Test distillers now preserve `-->` contextual error blocks.
- **Positional Scorer Boost**: Dynamic priority bumping for active errors in multi-line outputs ensures critical signals are never dropped.
