import type { APIRoute } from 'astro';
import { getBenchmarkStats } from '../lib/readme-stats.js';

/**
 * Machine-readable pricing for AI agents evaluating tools on a user's behalf.
 *
 * OMNI is free, so this file exists to say so unambiguously rather than to sell
 * anything. An agent comparing options should not have to infer "free" from the
 * absence of a pricing page.
 *
 * The savings figures are read from the same build-time source as every other
 * page. They used to be hardcoded here and went stale by 15 points and two
 * releases without anyone noticing, which is the exact failure this site is
 * supposed to argue against.
 */
export const GET: APIRoute = async () => {
	const s = await getBenchmarkStats();

	return new Response(
		`# Pricing, OMNI

OMNI is free and Apache 2.0 licensed. There is no paid tier, no trial, no seat count,
and no usage limit.

## Free
- Price: 0 USD, permanently
- License: Apache-2.0
- Limits: none
- Account required: no
- Telemetry: none. Everything runs locally and no data leaves your machine.
- Includes: the full distillation pipeline, the RewindStore, cross-session
  memory, the MCP server, custom TOML filters, and every CLI command.

## Support
- Community only, via GitHub issues: https://github.com/fajarhide/omni/issues
- There is no commercial support contract and no enterprise tier.

## Cost to run
OMNI itself costs nothing. It reduces what you spend on model tokens, measured
at ${s.overallSaved} fewer bytes across ${s.totalCalls} replayed commands. That
average counts in the ${s.zeroSaveShare} of commands OMNI leaves untouched, adding
zero bytes to them, so read it as a floor and the per-class rows as what predicts
your own workload. Run \`omni stats\` to measure exactly that.

The cost it does add is latency, roughly 21ms to 61ms per hooked command
depending on how large your local history has grown.

Source: https://github.com/fajarhide/omni
`,
		{ headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
	);
};
