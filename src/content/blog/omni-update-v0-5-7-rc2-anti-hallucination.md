---
title: "Anti-Hallucination Guards: OMNI v0.5.7-rc2"
description: "OMNI v0.5.7-rc2 implements lightweight anti-hallucination guards, dependency context for file reads, and hot file mutation warnings."
date: 2026-05-06
tag: Release Note
author: OMNI Core Team
---

With v0.5.7-rc2, we are turning our attention to **Contextual Safety**. High compression is useless if it leads to LLM hallucinations. This release ensures agents stay grounded with factual context constraints.

### Lightweight Anti-Hallucination Guards

OMNI now injects factual warnings when it knows context is incomplete. Whether it's heavy-compression-without-rewind cases or high-impact file reads, agents are now explicitly warned about their blind spots, dramatically reducing hallucination rates.

### Dependency Context & Hot Files

- **ReadFile Dependency Context**: Distillation now surfaces dependency impact using graph-derived `imported_by` counts. Agents now know when a file change may have a broad blast radius.
- **Hot File Mutation Warnings**: The `PreToolUse` hook now warns agents *before* mutating commands touch files that are already heavily modified in the current session context.

### Improved Auto-Repair

Our diagnostics continue to improve. `omni doctor --fix` now auto-repairs missing integrations while preserving stronger validation for installed MCP entries, particularly around Cursor's structured JSON configuration.
