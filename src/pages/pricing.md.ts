import type { APIRoute } from 'astro';

/**
 * Machine-readable pricing for AI agents evaluating tools on a user's behalf.
 *
 * OMNI is free, so this file exists to say so unambiguously rather than to sell
 * anything. An agent comparing options should not have to infer "free" from the
 * absence of a pricing page.
 */
export const GET: APIRoute = () =>
	new Response(
		`# Pricing, OMNI

OMNI is free and MIT licensed. There is no paid tier, no trial, no seat count,
and no usage limit.

## Free
- Price: 0 USD, permanently
- License: MIT
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
at 58.9% fewer bytes across 1,810 replayed commands, though 63.6% of commands
save nothing at all. Run \`omni stats\` to measure your own.

The cost it does add is latency, roughly 82ms to 308ms per hooked command
depending on how large your local history has grown.

Source: https://github.com/fajarhide/omni
`,
		{ headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
	);
