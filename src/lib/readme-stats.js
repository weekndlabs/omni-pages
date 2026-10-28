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

/** Last-known-good, verified against the manual on 2026-10-28 (the 2026-08-24 corpus, 0.7.11). */
export const FALLBACK = {
	source: 'fallback',
	totalCalls: '9,478',
	overallSaved: '2.4%',
	filtersSaved: '0.8%',
	zeroSaveShare: '98.8%',
	rows: [
		{ command: 'other', calls: '6,457', input: '4.81 MB', filters: '0.8%', savings: '2.8%', pct: 2.8 },
		{ command: 'file read', calls: '1,056', input: '1.89 MB', filters: '0.0%', savings: '1.5%', pct: 1.5 },
		{ command: 'git', calls: '899', input: '0.86 MB', filters: '0.0%', savings: '1.3%', pct: 1.3 },
		{ command: 'search', calls: '810', input: '0.77 MB', filters: '3.4%', savings: '3.4%', pct: 3.4 },
		{ command: 'infra', calls: '215', input: '0.14 MB', filters: '2.4%', savings: '2.7%', pct: 2.7 },
		{ command: 'build and test', calls: '41', input: '0.02 MB', filters: '9.0%', savings: '10.7%', pct: 10.7 },
	],
	// The three reproducible fixtures the hero demo cycles through, so every
	// meter reading is a real measurement rather than a number chosen to look
	// good. Deliberately spread across the range: one strong, one ordinary, one
	// that barely pays for itself.
	fixtures: {
		'cargo test': { command: 'cargo test', input: '16,515 B', output: '1,153 B', savings: '93.0%' },
		'git status': { command: 'git status', input: '496 B', output: '165 B', savings: '66.7%' },
		'docker build': { command: 'docker build', input: '9,207 B', output: '102 B', savings: '98.9%' },
	},
};

/** Which fixture rows the hero needs. Keys match the doc's first column. */
export const FIXTURE_KEYS = Object.keys(FALLBACK.fixtures);

/** Strip markdown emphasis and inline code so `**96.8%**` becomes `96.8%`. */
const clean = (cell) => cell.replace(/[*`]/g, '').trim();

/**
 * Is line `i` a real table header of at least `cols` columns, rather than a data
 * row that happens to contain the words we key on?
 *
 * Keying on words alone is not enough, and this cost a release. 0.7.5 added a
 * summary row reading `| ledger folds | 882 calls, 3,231 session markers |`,
 * which carries both `calls` and `ledger` and sits above the real class table.
 * It won the search, the reader started two lines below it on a two-column row,
 * bailed on the column count and returned zero rows, so the whole parse failed
 * validation and the page served the committed fallback. A header is followed by
 * a `|---|` separator; a data row is not.
 */
function isHeader(lines, i, cols) {
	const sep = lines[i + 1] ?? '';
	return /^\|[\s:|-]+\|$/.test(sep.trim()) && lines[i].split('|').slice(1, -1).length >= cols;
}

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
		(l, i) => /^\|/.test(l) && /\bcalls\b/i.test(l) && /\bledger\b/i.test(l) && isHeader(lines, i, 5)
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
		(l, i) => /^\|/.test(l) && /\bcommand\b/i.test(l) && /\bdelivered\b/i.test(l) && isHeader(lines, i, 4)
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
/**
 * The section that holds the doc's machine-written corpus table, or the whole doc
 * when there is no such table (every shape before 2026-08-24).
 *
 * The manual keeps older runs below the current one, labelled rather than deleted.
 * Searching the whole file let each regex take its first hit from a different run,
 * and the page shipped 9,478 traces from one corpus beside 69.6% and 23.09 MB from
 * another that the doc had marked as overstated. Every corpus figure is read from
 * this one section; only the fixtures, which do not depend on a corpus, are not.
 */
export function currentRun(md) {
	const at = md.indexOf('<!-- omni:corpus-table:start -->');
	if (at === -1) return md;
	const start = md.lastIndexOf('\n## ', at);
	const end = md.indexOf('\n## ', at);
	return md.slice(Math.max(start, 0), end === -1 ? undefined : end);
}

export function parseReadme(doc) {
	const md = currentRun(doc);
	const rows = parseClassTable(md);
	// Each fixture falls back on its own, so one renamed row cannot blank the hero.
	const fixtures = Object.fromEntries(
		FIXTURE_KEYS.map((k) => [k, parseFixture(doc, k) ?? FALLBACK.fixtures[k]])
	);
	const stats = {
		source: 'docs/website/src/develop/benchmarks.md@main',
		rows,
		fixtures,
		// The page quotes the end-to-end figure, so this is the with-ledger number
		// in both wordings. 0.7.5 split the headline into two percentages in one
		// bold span, "32.6% fewer bytes from the filters. 69.6% with the ledger",
		// and taking the first match there would have published the filters alone
		// under a label the page uses for the total.
		// Since 2026-08-24 the same pair reads "**0.8% from the filters. 2.4% with
		// the ledger**", without "fewer bytes".
		overallSaved:
			grab(md, /\*\*[\d.]+% (?:fewer bytes )?from the filters\.\s*([\d.]+)% with the ledger/) ??
			grab(md, /\*\*([\d.]+)% fewer bytes\*\*/),
		filtersSaved: grab(md, /\*\*([\d.]+)% (?:fewer bytes )?from the filters\./),
		// Prose before 0.7.5, a summary-table row until 2026-08-24, prose again since.
		zeroSaveShare:
			grab(md, /calls that saved nothing \|\s*\*\*([\d.]+)%/) ??
			grab(md, /\*\*([\d.]+)% of (?:those )?calls saved nothing/) ??
			grab(md, /([\d.]+)% of calls saved\s+nothing/),
		// "**Corpus**: 5,984 traces" today, "over **6,656 traces covering …**"
		// until 0.7.5, "**9,965 real command executions**" before 0.7.0.
		totalCalls:
			grab(md, /\*\*Corpus\*\*:\s*([\d,]+) traces\b/) ??
			grab(md, /\*\*([\d,]+) traces\b/) ??
			grab(md, /\*\*([\d,]+) real command\s*\n?\s*executions\*\*/),
	};
	if (stats.overallSaved) stats.overallSaved += '%';
	if (stats.filtersSaved) stats.filtersSaved += '%';
	if (stats.zeroSaveShare) stats.zeroSaveShare += '%';

	const sane = (p) => Number.isFinite(p) && p >= 0 && p <= 100;
	const valid =
		rows.length >= 3 &&
		rows.every((r) => r.command && sane(r.pct)) &&
		sane(parseFloat(stats.overallSaved)) &&
		sane(parseFloat(stats.zeroSaveShare)) &&
		Boolean(stats.totalCalls);

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
		// The warning below was the only trace of the page serving a stale corpus,
		// and it has now failed to be read twice: once when 0.7.0 moved to a
		// per-class table, once when 0.7.5 rewrote the headline into two
		// percentages. Both times the site published a corpus the repository had
		// already replaced. A warning nobody reads is not a guard, so on a deploy
		// this stops being advisory.
		console.warn(`[benchmarks] USING COMMITTED FALLBACK, the live read failed: ${e.message}`);
		if (process.env.VERCEL && !process.env.OMNI_ALLOW_STALE_BENCHMARKS) {
			throw new Error(
				`benchmark parse fell back (${e.message}). Refusing to publish figures ` +
					`that could not be verified against the manual. Fix the parser in ` +
					`src/lib/readme-stats.js, or set OMNI_ALLOW_STALE_BENCHMARKS=1 to ` +
					`ship the committed fallback on purpose.`
			);
		}
		return FALLBACK;
	}
}

/** Best and worst rows by savings, for the copy that names them. */
export function extremes(rows) {
	const sorted = [...rows].sort((a, b) => b.pct - a.pct);
	return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
