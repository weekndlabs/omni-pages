/**
 * Benchmark numbers for the landing page, read from OMNI's benchmark doc on `main`.
 *
 * The page and the README disagreed once already: the page shipped 90% / 97.3% /
 * $35-per-month while the README said 58.9%, because someone copied figures out of
 * the stale `.git-worktrees/format-safe/` checkout. Fetching at build time makes
 * that class of drift impossible, there is one source and the page can't lag it.
 *
 * The source moved from README.md to docs/BENCHMARKS.md when the README was cut
 * from 370 lines to 219: the tables and the corpus paragraph now live in the doc,
 * and the README carries only the headline. Pointing at the doc keeps the parser
 * reading the full set rather than the summary, and the doc is the file that has
 * to stay complete anyway.
 *
 * If the fetch or the parse fails we publish FALLBACK rather than nothing, in the
 * same spirit as the tool this page is selling: fail open, never fabricate.
 */

const BENCHMARKS_URL = 'https://raw.githubusercontent.com/fajarhide/omni/main/docs/BENCHMARKS.md';

/** Last-known-good, verified against docs/BENCHMARKS.md@main on 2026-08-03. */
export const FALLBACK = {
	source: 'fallback',
	totalCalls: '9,965',
	overallSaved: '43.3%',
	zeroSaveShare: '90.0%',
	bytesIn: '40.1 MB',
	bytesOut: '22.7 MB',
	rows: [
		{ command: 'cargo', calls: '124', input: '1.5 MB', output: '127 KB', savings: '91.4%', pct: 91.4 },
		{ command: 'git', calls: '931', input: '12.0 MB', output: '1.3 MB', savings: '89.2%', pct: 89.2 },
		{ command: 'kubectl', calls: '456', input: '5.5 MB', output: '1.3 MB', savings: '76.5%', pct: 76.5 },
		{ command: 'az', calls: '62', input: '264 KB', output: '176 KB', savings: '33.6%', pct: 33.6 },
		{ command: 'grep', calls: '938', input: '2.4 MB', output: '2.0 MB', savings: '18.1%', pct: 18.1 },
		{ command: 'gh', calls: '232', input: '534 KB', output: '509 KB', savings: '4.6%', pct: 4.6 },
		{ command: 'cd', calls: '2,963', input: '5.6 MB', output: '5.5 MB', savings: '2.2%', pct: 2.2 },
	],
	// The three reproducible fixtures the hero demo cycles through, so every
	// meter reading is a real measurement rather than a number chosen to look
	// good. Deliberately spread across the range: one strong, one ordinary, one
	// that barely pays for itself.
	fixtures: {
		'cargo test': { command: 'cargo test', input: '16,515 B', output: '1,178 B', savings: '92.9%' },
		'git status': { command: 'git status', input: '496 B', output: '190 B', savings: '61.7%' },
		'docker build': { command: 'docker build', input: '9,207 B', output: '5,904 B', savings: '35.9%' },
	},
};

/** Which fixture rows the hero needs. Keys match the doc's first column. */
export const FIXTURE_KEYS = Object.keys(FALLBACK.fixtures);

/** Strip markdown emphasis and inline code so `**96.8%**` becomes `96.8%`. */
const clean = (cell) => cell.replace(/[*`]/g, '').trim();

/**
 * Pull the per-command savings table. Several tables in the doc start with
 * `| Command`, so key on `Calls`, only the per-command breakdown has it.
 */
function parseCommandTable(md) {
	const lines = md.split('\n');
	const header = lines.findIndex(
		(l) => /^\|/.test(l) && /\bCalls\b/.test(l) && /\bSaved\b/.test(l)
	);
	if (header === -1) return [];

	const rows = [];
	// +2 skips the header and the |---|---| separator beneath it.
	for (let i = header + 2; i < lines.length && lines[i].startsWith('|'); i++) {
		const cells = lines[i].split('|').slice(1, -1).map(clean);
		if (cells.length < 5) break;
		const [command, calls, input, output, savings] = cells;
		rows.push({ command, calls, input, output, savings, pct: parseFloat(savings) });
	}
	return rows;
}

/**
 * The single-fixture table ("Command / Context | Input | Output | Saved").
 * Returns the named row, so the hero can quote one reproducible measurement.
 */
function parseFixture(md, want) {
	const lines = md.split('\n');
	const header = lines.findIndex(
		(l) => /^\|/.test(l) && /Command \/ Context/.test(l)
	);
	if (header === -1) return null;

	for (let i = header + 2; i < lines.length && lines[i].startsWith('|'); i++) {
		const cells = lines[i].split('|').slice(1, -1).map(clean);
		if (cells.length < 4) break;
		if (!cells[0].toLowerCase().startsWith(want)) continue;
		const [command, input, output, savings] = cells;
		return { command, input, output, savings };
	}
	return null;
}

const grab = (md, re) => {
	const m = md.match(re);
	return m ? m[1] : null;
};

/**
 * Returns parsed stats, or null when the doc no longer looks like we expect.
 * Null is deliberate: half-parsed numbers on a page about honest numbers would be
 * worse than stale ones, so the caller falls back instead of publishing guesses.
 */
export function parseReadme(md) {
	const rows = parseCommandTable(md);
	// Each fixture falls back on its own, so one renamed row cannot blank the hero.
	const fixtures = Object.fromEntries(
		FIXTURE_KEYS.map((k) => [k, parseFixture(md, k) ?? FALLBACK.fixtures[k]])
	);
	const stats = {
		source: 'docs/BENCHMARKS.md@main',
		rows,
		fixtures,
		overallSaved: grab(md, /\*\*([\d.]+% fewer bytes)\*\*/)?.replace(' fewer bytes', ''),
		zeroSaveShare: grab(md, /\*\*([\d.]+)% of (?:those )?calls saved nothing/),
		totalCalls: grab(md, /\*\*([\d,]+) real command\s*\n?\s*executions\*\*/),
		bytesIn: grab(md, /\(([\d.]+ [KMG]B) →/),
		bytesOut: grab(md, /→ ([\d.]+ [KMG]B)\)/),
	};
	if (stats.zeroSaveShare) stats.zeroSaveShare += '%';

	const sane = (p) => Number.isFinite(p) && p >= 0 && p <= 100;
	const valid =
		rows.length >= 3 &&
		rows.every((r) => r.command && sane(r.pct)) &&
		sane(parseFloat(stats.overallSaved)) &&
		sane(parseFloat(stats.zeroSaveShare)) &&
		Boolean(stats.totalCalls && stats.bytesIn && stats.bytesOut);

	return valid ? stats : null;
}

/** Build-time entry point. Never throws, the build must not die over a benchmark table. */
export async function getBenchmarkStats() {
	try {
		const res = await fetch(BENCHMARKS_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const parsed = parseReadme(await res.text());
		if (!parsed) throw new Error('BENCHMARKS.md parsed but failed validation, shape changed?');
		console.log(`[benchmarks] ${parsed.rows.length} rows from BENCHMARKS.md@main (${parsed.overallSaved})`);
		return parsed;
	} catch (e) {
		console.warn(`[benchmarks] using committed fallback: ${e.message}`);
		return FALLBACK;
	}
}

/** Best and worst performing command in the mix, for the headline stat row. */
export function extremes(rows) {
	const sorted = [...rows].sort((a, b) => b.pct - a.pct);
	return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
