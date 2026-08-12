/**
 * Benchmark numbers for the landing page, read from OMNI's benchmark doc on `main`.
 *
 * The page and the README disagreed once already: the page shipped 90% / 97.3% /
 * $35-per-month while the README said 58.9%, because someone copied figures out of
 * the stale `.git-worktrees/format-safe/` checkout. Fetching at build time makes
 * that class of drift impossible, there is one source and the page can't lag it.
 *
 * That argument only holds while the parser still matches the doc, and for one
 * release it did not. 0.7.0 rewrote the benchmark: the breakdown went from
 * per-command to per-class, the byte pair started using "to" instead of an arrow,
 * and the corpus stopped being described as "real command executions". Every one
 * of those broke a rule here, `parseReadme` returned null, and the page served the
 * committed fallback in silence. Live it read 43.3% over 9,965 traces while the
 * repository published 15.4% over 6,656. A page about honest numbers published a
 * figure its own source contradicted, for as long as nobody looked at the build log.
 *
 * Two changes came out of that. The source is now the manual, which is the file
 * that has to stay complete, and the fallback below is the current measurement
 * rather than a snapshot from a corpus that no longer exists. A stale fallback is
 * the failure mode: it is indistinguishable from a live read on the rendered page.
 *
 * If the fetch or the parse fails we publish FALLBACK rather than nothing, in the
 * same spirit as the tool this page is selling: fail open, never fabricate.
 */

const BENCHMARKS_URL =
	'https://raw.githubusercontent.com/fajarhide/omni/main/docs/website/src/develop/benchmarks.md';

/** Last-known-good, verified against the manual on 2026-08-12 (0.7.2). */
export const FALLBACK = {
	source: 'fallback',
	totalCalls: '6,656',
	overallSaved: '14.9%',
	zeroSaveShare: '97.3%',
	bytesIn: '6.47 MB',
	bytesOut: '5.47 MB',
	rows: [
		{ command: 'build and test', calls: '69', input: '94 KB', filters: '76.9%', savings: '78.0%', pct: 78.0 },
		{ command: 'file read', calls: '699', input: '1.60 MB', filters: '0.0%', savings: '25.2%', pct: 25.2 },
		{ command: 'git, gh', calls: '661', input: '609 KB', filters: '4.4%', savings: '22.3%', pct: 22.3 },
		{ command: 'search', calls: '828', input: '1.03 MB', filters: '4.8%', savings: '13.3%', pct: 13.3 },
		{ command: 'infra', calls: '254', input: '193 KB', filters: '4.4%', savings: '8.2%', pct: 8.2 },
		{ command: 'other', calls: '4,145', input: '2.95 MB', filters: '0.6%', savings: '6.8%', pct: 6.8 },
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
 * Pull the per-class breakdown: class, calls, input, filters, filters+ledger.
 *
 * Keyed on a header carrying both `calls` and `ledger`, which no other table in
 * the doc does. The head-to-head table has neither and the fixture table has
 * only `saved`, so a decoy cannot be mistaken for this one.
 *
 * The `aggregate` row is a total, not a class, and is dropped. Leaving it in put
 * a 100%-width bar at the bottom of the page's chart that read as a seventh
 * category.
 */
function parseClassTable(md) {
	const lines = md.split('\n');
	const header = lines.findIndex(
		(l) => /^\|/.test(l) && /\bcalls\b/i.test(l) && /\bledger\b/i.test(l)
	);
	if (header === -1) return [];

	const rows = [];
	// +2 skips the header and the |---|---| separator beneath it.
	for (let i = header + 2; i < lines.length && lines[i].startsWith('|'); i++) {
		const cells = lines[i].split('|').slice(1, -1).map(clean);
		if (cells.length < 5) break;
		const [command, calls, input, filters, savings] = cells;
		if (/^aggregate$/i.test(command)) continue;
		rows.push({
			// The doc names the largest class "file read (`cat`, `sed`, …)". The
			// examples belong in the doc, not in a table cell three columns wide.
			command: command.replace(/\s*\(.*\)$/, ''),
			calls,
			input,
			filters,
			savings,
			pct: parseFloat(savings),
		});
	}
	return rows;
}

/**
 * The single-fixture table. Returns the named row, so the hero can quote one
 * reproducible measurement.
 */
function parseFixture(md, want) {
	const lines = md.split('\n');
	const header = lines.findIndex(
		(l) => /^\|/.test(l) && /\bcommand\b/i.test(l) && /\bdelivered\b/i.test(l)
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
 *
 * Every regex here takes both the pre-0.7.0 and current wording. Not to support
 * an old doc, which no longer exists, but because the failure this file is named
 * after was a prose edit nobody thought of as a breaking change.
 */
export function parseReadme(md) {
	const rows = parseClassTable(md);
	// Each fixture falls back on its own, so one renamed row cannot blank the hero.
	const fixtures = Object.fromEntries(
		FIXTURE_KEYS.map((k) => [k, parseFixture(md, k) ?? FALLBACK.fixtures[k]])
	);
	// "(6.47 MB to 5.47 MB)" today, "(40.1 MB → 22.7 MB)" before 0.7.0.
	const bytePair = md.match(/\(([\d.]+ [KMG]B)\s*(?:→|to)\s*([\d.]+ [KMG]B)\)/);
	const stats = {
		source: 'docs/website/src/develop/benchmarks.md@main',
		rows,
		fixtures,
		overallSaved: grab(md, /\*\*([\d.]+)% fewer bytes\*\*/),
		zeroSaveShare: grab(md, /\*\*([\d.]+)% of (?:those )?calls saved nothing/),
		// "over **6,656 traces covering …**" today, "**9,965 real command
		// executions**" before.
		totalCalls:
			grab(md, /\*\*([\d,]+) traces\b/) ??
			grab(md, /\*\*([\d,]+) real command\s*\n?\s*executions\*\*/),
		bytesIn: bytePair?.[1] ?? null,
		bytesOut: bytePair?.[2] ?? null,
	};
	if (stats.overallSaved) stats.overallSaved += '%';
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
		if (!parsed) throw new Error('the manual parsed but failed validation, shape changed?');
		console.log(`[benchmarks] ${parsed.rows.length} rows from ${parsed.source} (${parsed.overallSaved})`);
		return parsed;
	} catch (e) {
		// Loud on purpose. This warning was the only trace of the page serving a
		// stale corpus for a whole release, and nobody reads a quiet build log.
		console.warn(`[benchmarks] USING COMMITTED FALLBACK, the live read failed: ${e.message}`);
		return FALLBACK;
	}
}

/** Best and worst rows by savings, for the copy that names them. */
export function extremes(rows) {
	const sorted = [...rows].sort((a, b) => b.pct - a.pct);
	return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
