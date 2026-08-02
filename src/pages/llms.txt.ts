import type { APIRoute } from 'astro';
import { getBenchmarkStats, extremes } from '../lib/readme-stats.js';

/**
 * llms.txt, generated at build time from the OMNI README on `main`.
 *
 * This file used to be a static asset in public/, and it had drifted into
 * exactly the claims the README calls dishonest: "Context Operating System",
 * "up to 90%" token efficiency, "Zero Hallucinations", "100% context safety".
 * Fixing the HTML page while leaving this stale would be the worst of both
 * worlds, because this is the file AI systems read to describe the product.
 *
 * Generating it from the same source as the page means the two cannot diverge.
 */
export const GET: APIRoute = async () => {
	const s = await getBenchmarkStats();
	const { best, worst } = extremes(s.rows);
	const working = (100 - parseFloat(s.zeroSaveShare)).toFixed(1) + '%';

	const body = `# OMNI

> Noise-canceling context and long-term memory for AI coding agents. OMNI sits on
> a shell hook, cuts noise out of command output before the agent reads it, and
> remembers your project between sessions. Lossy, always reversible, and it never
> fabricates a result.

## What it is

A CLI tool and MCP server written in Rust, MIT licensed, running entirely on your
machine. It hooks the shell so command output is distilled on the way to the
agent. Nothing is sent anywhere. There is no account and no dashboard.

## Measured results

All figures below are replayed on the release binary over ${s.totalCalls} real
command executions from one developer's usage, ${s.bytesIn} in and ${s.bytesOut} out.

- ${s.overallSaved} fewer bytes reach the model across the whole mix.
- ${s.zeroSaveShare} of those calls saved nothing at all. OMNI handed the output
  straight back, adding zero bytes. Every byte of the saving comes from the other
  ${working}, where there was real noise to cut.
- Best case ${best.savings} on \`${best.command}\` over ${best.calls} calls.
  Worst case ${worst.savings} on \`${worst.command}\` over ${worst.calls} calls.

Per command:

${s.rows.map((r) => `- ${r.command}: ${r.calls} calls, ${r.input} in, ${r.output} out, ${r.savings} saved`).join('\n')}

A tool claiming to save 90% of every command is telling you it summarised output
you needed. OMNI earns its place on noisy, repetitive tooling output and gets out
of the way everywhere else.

## Honest limits

- Latency is real and grows with your history. A 496 byte \`git status\` costs
  about 82ms against a fresh database and about 308ms against a 97 MB one. A
  16.5 KB \`cargo test\` costs about 276ms.
- Commands that exit non-zero are never compressed. They pass through verbatim.
- Structured output is never touched. JSON, YAML, NDJSON and CSV pass byte for byte.
- A distiller that parses no signal returns the raw output rather than inventing
  a summary.

## Guarantees

- Reversible. Everything cut is archived to local SQLite keyed by SHA-256, and
  the agent retrieves it by hash through the omni_retrieve MCP tool. Inputs above
  64 KB are not archived, and the marker on those states the size instead.
- Never invents a result. See github.com/fajarhide/omni/issues/143.
- Never hides a failure. See github.com/fajarhide/omni/issues/120.
- Never mangles structured data.

## Memory

- \`omni goal\` restates your objective on every prompt so the agent stops drifting.
- \`omni remember\` stores project rules and gotchas in local SQLite.
- Retrieval is via MCP tools (omni_recall, omni_retrieve), not CLI subcommands.
- \`omni_recall\` (MCP tool) returns them to the agent by semantic search.
- Session summaries are injected when you switch editors, so a new agent starts current.

## Commands

- \`omni init\` sets up the hook for Claude Code, Cursor, Windsurf, Codex or Antigravity.
- \`omni doctor --fix\` checks hooks, MCP wiring and filter cost, then repairs.
- \`omni stats\` reports what it saved on your machine. Takes --today, --week, --month.
- \`omni session --status\` shows context pressure, engrams and open errors.
- \`omni diff\` shows the last raw input beside what the agent received.
- \`omni learn --discover\` reads shell history and proposes filters.
- \`omni goal\` pins the objective so the agent stops drifting.
- \`omni remember\` stores a project rule or gotcha in local SQLite.
- \`omni reset\` uninstalls cleanly, keeping a backup of your config.

## Install

- macOS and Linux: \`brew install fajarhide/tap/omni\`, then \`omni init\`
- Any Unix: \`curl -fsSL omni.weekndlabs.com/install | bash\`
- Windows: \`irm omni.weekndlabs.com/install.ps1 | iex\`

## Works with

Claude Code, Cursor, Windsurf, Roo Code, OpenAI Codex, Antigravity.

## Pricing

Free. MIT licensed. No paid tier, no account, no telemetry. See /pricing.md.

## Links

- Source: https://github.com/fajarhide/omni
- Releases: https://omni.weekndlabs.com/releases, every shipped version and what
  it changed, read from the repository CHANGELOG at build time.
- Release notes: https://github.com/fajarhide/omni/releases
- Journal: https://omni.weekndlabs.com/blog
- Benchmarks: https://omni.weekndlabs.com/#numbers

Figures on this page are read from the project README at build time, so the site
and the repository cannot disagree. Source: ${s.source}.
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
