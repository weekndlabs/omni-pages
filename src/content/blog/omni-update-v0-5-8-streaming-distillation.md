---
title: "Streaming Distillation Pipeline: OMNI v0.5.8"
description: "OMNI v0.5.8 introduces the memory-efficient Streaming Distillation Pipeline, expanded semantic distillers for 9 developer tools, and advanced context analytics."
date: 2026-06-03
tag: Release Note
author: OMNI Core Team
---

We are excited to announce the official release of OMNI v0.5.8! This release finalizes Phase 1 of our Context Analytics roadmap by introducing a robust, memory-efficient streaming architecture.

### Streaming Distillation Pipeline

To handle long-running and piped commands without memory exhaustion, we've introduced a memory-efficient, line-by-line processing pipeline (`src/hooks/pipe.rs`). This ensures that even massive logs stream through OMNI seamlessly.

### Expanded Semantic Distillers

We have added new declarative TOML signal profiles for 9 critical developer tools. OMNI now provides deep semantic understanding for: `aws`, `az`, `bun`, `deno`, `docker`, `gcloud`, `npm`, `vite`, and `webpack`.

### Brand & Documentation Modernization

The English `README.md` and all 6 `i18n` localized versions have been completely overhauled! They now feature professional SVG visual assets (`hero.svg`, `architecture.svg`), and brand new "Under the Hood" and "Real-World Use Cases" sections.

### Advanced Context Analytics

For deeper visibility into token reduction and signal density, we've implemented context composition metrics in `omni stats` (`src/analytics/context_composition.rs`).

### Improved Storage & Hook Routing

- **SQLite Storage Enhancements**: Updated `src/store/sqlite.rs` to seamlessly support high-throughput, chunked streaming outputs from the new distillation pipeline.
- **MCP & Tooling Synchronization**: Refined `pre_tool` and `post_tool` hook routing to perfectly align with the new semantic models.
