---
title: "Pi Agent & Semantic Engine: OMNI v0.5.8-rc2"
description: "OMNI v0.5.8-rc2 brings Pi Agent integration, VS Code MCP initialization, and a refactored semantic classification engine."
date: 2026-05-28
tag: Release Note
author: OMNI Core Team
---

Release candidate 2 for v0.5.8 expands our agent roster and brings a massive structural upgrade to our classification engine.

## Pi Agent Integration

We are thrilled to announce first-class support for **Pi Agent**. This integration includes full init, reset, and doctor support, complete with hooks, extensions, and toggle functionality. Pi users can now enjoy the full benefits of OMNI's token distillation.

## Refactored Semantic Classification

The core pipeline filtering system has been deeply refactored. We've transitioned to a true **semantic classification engine** for segments, featuring tool-aware scoring logic. 

As part of this shift, filter definitions have been migrated from the legacy `filters/` directory to structured `signals/tools/` and `signals/domains/` configurations, mapping perfectly to our new MCP Framework Upgrade (`rmcp 1.7.0`).

## Enhanced Token Metrics

The `omni stats --detail` pipeline now accurately tracks and displays raw vs. filtered token counts in a dedicated "Tokens Reduced" column, providing precise, line-item visibility into your token savings.
