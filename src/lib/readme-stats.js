/**
 * Benchmark numbers for the landing page, read from the OMNI README on `main`.
 *
 * The page and the README disagreed once already: the page shipped 90% / 97.3% /
 * $35-per-month while the README said 58.9%, because someone copied figures out of
 * the stale `.git-worktrees/format-safe/` checkout. Fetching at build time makes
 * that class of drift impossible, there is one source and the page can't lag it.
 *
 * If the fetch or the parse fails we publish FALLBACK rather than nothing, in the
 * same spirit as the tool this page is selling: fail open, never fabricate.
 */

const README_URL = 'https://raw.githubusercontent.com/fajarhide/omni/main/README.md';

/** Last-known-good, verified against README@main on 2026-07-22. */
export const FALLBACK = {
	source: 'fallback',
	totalCalls: '1,810',
	overallSaved: '58.9%',
	zeroSaveShare: '63.6%',
	bytesIn: '15.0 MB',
	bytesOut: '6.2 MB',
	rows: [
		{ command: 'cargo', calls: '29', input: '424 KB', output: '13 KB', savings: '96.8%', pct: 96.8 },
		{ command: 'git', calls: '256', input: '5.9 MB', output: '509 KB', savings: '91.3%', pct: 91.3 },
		{ command: 'ls', calls: '52', input: '71 KB', output: '29 KB', savings: '59.5%', pct: 59.5 },
		{ command: 'kubectl', calls: '212', input: '4.4 MB', output: '2.3 MB', savings: '48.0%', pct: 48.0 },
		{ command: 'find', calls: '39', input: '83 KB', output: '53 KB', savings: '36.2%', pct: 36.2 },
		{ command: 'grep', calls: '184', input: '534 KB', output: '385 KB', savings: '27.8%', pct: 27.8 },
		{ command: 'cat', calls: '85', input: '515 KB', output: '468 KB', savings: '9.1%', pct: 9.1 },
	],
	// Single reproducible fixture, used by the hero demo so the meter counts a
	// real measurement rather than a number chosen to look good.
	fixture: { command: 'cargo test', input: '16.5 KB', output: '1,100 B', savings: '93.3%' },
};

/** Strip markdown emphasis and inline code so `**96.8%**` becomes `96.8%`. */
const clean = (cell) => cell.replace(/[*`]/g, '').trim();

/**
 * Pull the per-command savings table. Four tables in the README start with
 * `| Command`, so key on `Calls`, only the 1,810-execution table has it.
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
 * Returns parsed stats, or null when the README no longer looks like we expect.
 * Null is deliberate: half-parsed numbers on a page about honest numbers would be
 * worse than stale ones, so the caller falls back instead of publishing guesses.
 */
export function parseReadme(md) {
	const rows = parseCommandTable(md);
	const stats = {
		source: 'README@main',
		rows,
		fixture: parseFixture(md, 'cargo test') ?? FALLBACK.fixture,
		overallSaved: grab(md, /\*\*([\d.]+% fewer bytes)\*\*/)?.replace(' fewer bytes', ''),
		zeroSaveShare: grab(md, /\*\*([\d.]+)% of those calls saved nothing/),
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
		const res = await fetch(README_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const parsed = parseReadme(await res.text());
		if (!parsed) throw new Error('README parsed but failed validation, shape changed?');
		console.log(`[benchmarks] ${parsed.rows.length} rows from README@main (${parsed.overallSaved})`);
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
