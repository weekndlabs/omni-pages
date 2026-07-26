---
title: "Databases, Security Scanners & VCS: OMNI v0.5.6-rc3"
description: "OMNI v0.5.6-rc3 brings intelligent distillation for databases, security scanners (Trivy, Snyk), VCS tools, and robust RegEx generation."
date: 2026-04-14
tag: Release Note
author: OMNI Core Team
---

We are excited to announce the third release candidate for v0.5.6. While the previous RCs focused on the engine and ecosystem, rc3 is about **reach**. We are massively expanding our tool registry with dedicated distillers for databases, security scanners, and legacy version control systems.

## Intelligent Database Distillation

If you've ever piped the output of a SQL query into an AI agent, you know the frustration. Hundreds of lines of headers, ASCII borders, and verbose connection status messages consume your tokens before the agent ever sees the data.

v0.5.6-rc3 introduces a specialized **Database Distiller** for PostgreSQL, MySQL, and SQLite. It understands the specific output formats of these CLI tools, stripping away the tabular noise and keeping only the actionable result sets or specific error signals. Your agent can now "see" your database state without getting lost in the formatting.

## Security Scanners & VCS Expansion

Security is a high-signal domain with extremely high-noise logs. Toolsets like **Trivy, Snyk, and Semgrep** often produce thousands of lines of scan reports just to highlight three critical vulnerabilities. 

Our new **Security Distiller** collapses these verbose reports into concise vulnerability summaries. Instead of paying for a list of 500 "Low" priority items, your agent receives a curated signal of what actually needs fixing.

In this update, we’ve also extended our version control support. While Git is the industry standard, many enterprise projects still rely on **Mercurial or SVN**. OMNI now includes a **VcsDistiller** with heuristics specifically tuned for these tools, ensuring zero signal loss regardless of your stack.

## Robust Pattern Learning (`omni learn`)

We’ve also overhauled the `omni learn` workflow to be more robust. We fixed a critical bug in our RegEx generation where numeric patterns were being interpreted literally instead of using proper `\d+` matches. 

The new **Verify Report** (`omni learn --verify`) now provides a much clearer breakdown of your filters. It separates built-in filters from your custom-learned ones, giving you pass/fail counts and actionable tips if a filter you've learned isn't performing as expected.

## Polish & Stability

As we approach the final stable release of v0.5.6, we’ve included several key stability fixes:
- **Case-Insensitive Matching**: All distillers now use case-insensitive substring matching for more reliable command detection.
- **Improved Filter Loading**: `match_command` is now optional in `FilterConfig`, preventing crashes if a pattern is missing or empty.
- **Auto-Clear Queue**: `omni learn --apply` now automatically clears your learn queue, preventing stale data from polluting future discovery runs.

## One Step Closer

v0.5.6 is shaping up to be our most comprehensive release yet. We’re spending the next 48 hours in a final testing freeze to ensure that every new distiller performs with the pinpoint accuracy OMNI is known for.

The registry is now deeper than ever.
