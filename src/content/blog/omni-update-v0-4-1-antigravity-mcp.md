---
title: "Antigravity and proxy interoperability: OMNI v0.4.1"
description: "OMNI v0.4.1 adds MCP integration for Google Antigravity, proxy command distillation, real-world examples, and filesystem exploration tools."
date: 2026-03-17
tag: Release Note
author: OMNI Core Team
---

The AI agent landscape is fragmenting at an extraordinary pace. Claude Code, Google Antigravity, Codex CLI, OpenCode — every month brings a new agent platform with its own tool-calling conventions, context window strategies, and MCP integration patterns. If OMNI only supported a single agent, it would be a niche tool for a niche audience. Our mission demands universal compatibility: regardless of which agent you choose, OMNI must be the transparent intelligence layer between your terminal and your model.

## Google Antigravity Integration

OMNI v0.4.1 natively integrates the Model Context Protocol for the **Google Antigravity** agent architecture. This is not a generic "it probably works" integration — it is a purpose-built filter and hook configuration that understands Antigravity's specific tool-calling patterns, response formatting expectations, and context window management strategy. When Antigravity invokes a bash tool or reads a file, OMNI intercepts the response at the MCP layer and delivers a distilled, semantically-rich payload that maximizes Antigravity's reasoning quality.

The integration was developed through extensive collaboration and testing against real Antigravity workflows, ensuring that every edge case — from multi-file reads to streaming command output — is handled correctly.

## The Proxy Command: Manual Distillation on Demand

Sometimes you need to distill output from a command that OMNI does not automatically intercept — a legacy script, a custom internal tool, or a command you are running outside of an agent context. The new `omni --` proxy syntax solves this elegantly. Run `omni -- git log --oneline -50` and OMNI captures the output, runs it through the full distillation pipeline, and prints the semantically compressed result directly to your terminal.

This is power without ceremony. No configuration files, no hook installation, no MCP server required. Just prefix any command with `omni --` and get instant, intelligent noise reduction. It is the simplest possible interface for the most complex processing we do.

## Learning by Example

Convincing developers to adopt a new tool in their critical path requires more than documentation — it requires demonstration. The new `omni examples` command displays a curated collection of real-world study cases showing OMNI in action. Each example includes the raw input, the distilled output, the token savings percentage, and a brief explanation of the semantic decisions the engine made. This is not marketing collateral — it is verifiable, reproducible evidence of value.

## MCP Filesystem Exploration Tools

Rounding out the feature set, we implemented new MCP tools for filesystem exploration and declarative filtering. These tools give your AI agent the ability to search, browse, and selectively read file content through the MCP protocol, with OMNI's distillation applied at every layer. The result is an agent that can navigate large codebases without drowning in irrelevant file content — seeing only the architecturally significant structures and the diagnostically relevant code sections.

## The Interoperability Imperative

Every agent integration we ship reinforces a core principle: **your context optimization strategy should not be locked to a single vendor**. If you switch from Claude to Antigravity tomorrow, your OMNI configuration, your custom filters, your distillation history — all of it comes with you. The intelligence layer is yours. The agent is replaceable. That portability is not just a convenience — it is a strategic advantage for any team building on top of rapidly evolving AI infrastructure.