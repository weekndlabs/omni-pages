---
title: "Context Pressure Management: OMNI v0.5.8-rc3"
description: "OMNI v0.5.8-rc3 implements multi-stage context pressure warnings, critical file pinning, and fail-open pipeline architecture."
date: 2026-05-29
tag: Release Note
author: OMNI Core Team
---

Our third release candidate for v0.5.8 tackles one of the hardest problems in agentic workflows: context exhaustion.

### Context Pressure Management

Agents often lose track of their token budget until the context window abruptly crashes. OMNI v0.5.8-rc3 implements multi-stage context pressure warnings (**Normal, Warning, Critical**) to proactively manage session budgets before failure occurs.

### Critical File Pinning & Re-read Guards

- **Critical File Pinning**: Added automatic context pinning for critical rule files (e.g., `.cursorrules`, `AGENTS.md`) during session compaction, ensuring core instructions are never squeezed out.
- **File Re-read Guard**: Introduced preventive warnings and hot-file mutation protection to stop redundant reads of files already in context, a common source of wasted tokens.

### Performance Documentation

We have published a comprehensive `docs/PERFOMANCE.md` showcase. Furthermore, all global `README.md` and `i18n` translations have been updated with actual ROI and noise-reduction benchmarks, proving OMNI's value in real-world deployments.

### Fail-Open Architecture

Finally, we've reinforced our pipeline hooks (`pre_tool`, `post_tool`, `pre_compact`, `session_start`) with strict fail-open logic. If OMNI encounters a fatal error, it will fail gracefully and allow the native output through, ensuring zero disruption to agent operations.
