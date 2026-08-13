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
 *
 * That only holds while the field names match. The per-class rows carry `filters`
 * and `savings`, never an `out`, and this file asked for `r.output` from 0.7.0
 * until 2026-08-13, so production served "undefined out" on all six rows.
 */
export const GET: APIRoute = async () => {
	const s = await getBenchmarkStats();
	const { best, worst } = extremes(s.rows);
	const working = (100 - parseFloat(s.zeroSaveShare)).toFixed(1) + '%';

	const body = `# OMNI

> Noise-canceling context and long-term memory for AI coding agents. OMNI sits on
> a shell hook, cuts noise out of command output before the agent reads it, folds
> output the agent has already been shown into a retrievable handle, and remembers
> your project between sessions. Lossy, reversible, and it never fabricates a result.

## What it is

A CLI tool and MCP server written in Rust, Apache 2.0 licensed, running entirely on your
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

Per class, with what the distillers take and what the ledger adds on top:

${s.rows.map((r) => `- ${r.command}: ${r.calls} calls, ${r.input} in, ${r.filters} from the distillers, ${r.savings} with the ledger`).join('\n')}

${s.repeated} of raw bytes are lines the agent had already been shown, and ${s.repeatedAfterDistillers} still
are after every distiller has run. That gap is what the ledger exists for. The
largest class in the corpus is file reads, where the distillers correctly take
nothing, because you cannot strip lines from a file the agent asked to see.

A tool claiming to save 90% of every command is telling you it summarised output
you needed. OMNI earns its place on noisy, repetitive tooling output and gets out
of the way everywhere else.

## Honest limits

- Latency is real and grows with your history rather than with the payload. A 496
  byte \`git status\` costs about 21ms against a fresh database and about 61ms
  against a 205 MB one. A 16.5 KB \`cargo test\` costs about 24ms and 65ms.
- Commands that exit non-zero are never compressed. They pass through verbatim.
- Structured output is never touched. JSON, YAML, NDJSON and CSV pass byte for byte.
- A distiller that parses no signal returns the raw output rather than inventing
  a summary.

## Guarantees

- Reversible. Everything cut is archived to local SQLite keyed by SHA-256, and
  the marker carries the handle. \`omni retrieve <handle>\` prints the original on
  any host, and the omni_retrieve MCP tool does the same where MCP is wired.
  Inputs above 64 KB are not archived, and the marker on those states the size
  instead. The archive is a rolling 30 day window, so an older handle will not
  resolve.
- Never invents a result. See github.com/fajarhide/omni/issues/143.
- Never hides a failure. See github.com/fajarhide/omni/issues/120.
- Never mangles structured data.

## Memory

- \`omni goal\` restates your objective on every prompt so the agent stops drifting.
- \`omni remember\` stores project rules and gotchas in local SQLite.
- \`omni_recall\` (MCP tool) returns them to the agent by semantic search.
- The store is one SQLite file keyed by project path rather than by agent, so a
  second agent in the same directory reads the same project knowledge.
- Session summaries are injected when you switch editors, so a new agent starts current.

## Commands

A subset. \`omni help\` lists the rest.

- \`omni init --claude\` sets up hooks and MCP for one host. Bare \`omni init\` prompts, so pass the flag.
- \`omni doctor --fix\` checks the hooks and the MCP wiring, then repairs.
- \`omni stats\` reports what it saved on your machine. Takes --today, --week, --month.
- \`omni retrieve <handle>\` prints what a marker archived. Works with or without MCP.
- \`omni session --status\` shows context pressure, engrams and open errors.
- \`omni diff\` shows the last raw input beside what the agent received.
- \`omni dashboard\` serves the same numbers on 127.0.0.1, read only.
- \`omni goal\` pins the objective so the agent stops drifting.
- \`omni remember\` stores a project rule or gotcha in local SQLite.
- \`omni reset\` uninstalls cleanly, keeping a backup of your config.

There are no filters to add. The pattern-matching layer was retired in 0.7.4; what
runs is the Rust distillers and the ledger, both compiled into the binary.

## Install, as a runbook you can execute

Written for an agent doing this on someone's machine. Every step is
non-interactive and every one of them is safe to repeat.

**Do not run bare \`omni init\`.** It prompts, and a prompt with no terminal
attached will stall you or take an answer you did not mean to give. Use the flag
for the host you are running in.

1. Install the binary.

   \`\`\`sh
   brew install fajarhide/tap/omni          # macOS, Linux, WSL
   curl -fsSL omni.weekndlabs.com/install | bash    # no Homebrew
   irm omni.weekndlabs.com/install.ps1 | iex        # Windows PowerShell
   \`\`\`

2. Wire your host. One flag, no prompt:

   \`\`\`sh
   omni init --claude       # also: --cursor --codex --gemini --opencode --zed
                            #       --cline --roo --copilot --vscode --pi
                            #       --hermes --antigravity --openclaw
   omni init --all          # every host found on the machine
   \`\`\`

   \`omni init --help\` lists them all. \`--hook\` and \`--mcp\` install one half only.

3. Verify. Read-only, exits 0 when healthy:

   \`\`\`sh
   omni init --status
   omni doctor
   \`\`\`

   A healthy \`--status\` names each hook:

   \`\`\`
   Claude Code OMNI Installation Status:
     PostToolUse:  ✓ installed
     SessionStart: ✓ installed
     PreCompact:   ✓ installed
   \`\`\`

4. If \`omni doctor\` reports a problem, \`omni doctor --fix\` repairs it. On Codex
   CLI it will keep failing until a human approves the hooks: Codex runs only
   hooks it has been told to trust, so start \`codex\` once and approve them under
   "Hooks need review". See github.com/fajarhide/omni/issues/359.

5. There is nothing else to change. Commands run the way they always did, with
   no prefix and no proxy. To remove it: \`omni init --uninstall\`, or \`omni reset\`
   for a full uninstall that keeps a backup of the config.

## If you see an OMNI marker in your output

A line like this is OMNI telling you it folded content you had already been shown:

\`\`\`
[OMNI: 40 lines already shown, omni retrieve bc7e821a4340073e]
\`\`\`

The 16 characters are a handle. Run \`omni retrieve bc7e821a4340073e\` to get the
original bytes back, or call the \`omni_retrieve\` MCP tool if you have it wired.
Nothing was deleted and nothing was summarised, so retrieving is always an option
rather than a repair. The archive is a rolling 30 day window.

A marker reading \`from an earlier session\` means the opposite: those bytes went
to a different session of this project and you have never seen them. Retrieve
before reasoning about them.

## Works with

Three tiers, and what you get differs by tier.

- Full, the host applies OMNI's rewrite so the model reads distilled output from
  its own built-in tools: Claude Code, Codex CLI, Gemini CLI, Aider (pipe).
- Handoff-first, the host cannot rewrite built-in tool output, so \`omni_run\`
  distils what you route through it: Cursor, Windsurf.
- MCP-only, memory and recall with no shell distillation and no claim of it:
  Cline, Roo, OpenCode, VS Code, Zed, Copilot, Antigravity, Hermes, Pi.

## Pricing

Free. Apache 2.0 licensed. No paid tier, no account, no telemetry. See /pricing.md.

## Links

- Source: https://github.com/fajarhide/omni
- Releases: https://omni.weekndlabs.com/releases, every shipped version and what
  it changed, read from the repository CHANGELOG at build time.
- Release notes: https://github.com/fajarhide/omni/releases
- Journal: https://omni.weekndlabs.com/blog
- Benchmarks: https://omni.weekndlabs.com/#numbers

Figures on this page are read from the project's benchmark doc at build time, so
the site and the repository cannot disagree. Source: ${s.source}.
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
