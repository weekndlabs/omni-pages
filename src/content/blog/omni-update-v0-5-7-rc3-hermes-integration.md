---
title: "Hermes Agent Integration: OMNI v0.5.7-rc3"
description: "OMNI v0.5.7-rc3 adds native integration for the Hermes Agent and massive improvements to automated fix modes across all agents."
date: 2026-05-07
tag: Release Note
author: OMNI Core Team
---

The final release candidate for v0.5.7 brings native support for a new major agent platform: **Hermes**, while solidifying our integration ecosystem.

## Native Hermes Integration

We've added a new native plugin integration for the Hermes Agent. This features automatic `plugin.yaml` and Python hook script generation (`post_tool_call`, `pre_tool_call`, `on_session_start`), allowing OMNI to silently filter noise in the background of any Hermes workflow.

## Automated Doctor Fix Mode

We've massively refactored our agent integrations, spanning Cline, Codex, Cursor, Gemini, and Antigravity, to support a standardized configuration path management. 

Running `omni doctor --fix` is now more powerful than ever, handling automated `--fix` operations flawlessly across disparate environments.

## Cleanup & Portability

- **Claude Hook Cleanup**: Implemented robust `uninstall` logic in the Claude Code integration to completely scrub OMNI hooks and MCP server entries.
- **OpenClaw Portability**: Refactored the OpenClaw plugin's TypeScript configuration to use standard `Node16`/`ES2022` settings, removing reliance on sandbox-specific file paths.
