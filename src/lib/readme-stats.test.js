import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, extremes, FALLBACK, FIXTURE_KEYS } from './readme-stats.js';

// Trimmed to the shapes the parser has to survive, and every one of them is a
// shape that broke it once: a head-to-head table that also starts with `|` and
// carries byte figures, an `aggregate` total inside the real table, a byte pair
// joined by "to" rather than an arrow, and a corpus described as "traces".
const DOC = `
| | bytes | saved |
|---|---|---|
| omni, filters only | 6,469,047 to 6,291,784 | **2.7%** |
| rtk \`pipe\` | 6,469,047 to 6,067,012 | **6.2%** |

* **15.4% fewer bytes** across the mix (6.47 MB to 5.47 MB), of which the
  filters are 2.7% and the ledger is the rest.
* **97.3% of calls saved nothing at all.** Every byte of the saving comes from
  the other 2.7%.

Replayed 2026-08-11 on 0.7.0 over **6,656 traces covering 2026-08-04 02:56 to
08-11 03:34 UTC**, every one \`agent_id='claude_code'\`.

| class | calls | input | filters | + ledger |
|---|---|---|---|---|
| other | 4,145 | 2.95 MB | 0.7% | **7.1%** |
| file read (\`cat\`, \`sed\`, \`head\`, \`tail\`) | 699 | 1.60 MB | 0.0% | **26.3%** |
| build and test | 69 | 94 KB | 76.9% | **78.3%** |
| **aggregate** | **6,656** | **6.47 MB** | **2.7%** | **15.4%** |

| command | input | delivered | saved |
|---|---|---|---|
| \`cargo test\` (490 passed, 10 failed) | 16,515 B | 1,178 B | **92.9%** |
| \`git status\` (dirty) | 496 B | 190 B | **61.7%** |
| \`docker build\` (heavy noise) | 9,207 B | 5,904 B | **35.9%** |

Some trailing prose.
`;

test('parses the per-class table, not the head-to-head above it', () => {
	const s = parseReadme(DOC);
	assert.deepEqual(
		s.rows.map((r) => r.command),
		['other', 'file read', 'build and test']
	);
	assert.equal(s.rows[2].savings, '78.3%'); // ** stripped
	assert.equal(s.rows[2].filters, '76.9%');
	assert.equal(s.rows[1].input, '1.60 MB');
});

test('drops the aggregate row, which is a total and not a class', () => {
	const s = parseReadme(DOC);
	assert.ok(!s.rows.some((r) => /aggregate/i.test(r.command)));
});

test('reads the headline figures', () => {
	const s = parseReadme(DOC);
	assert.equal(s.overallSaved, '15.4%');
	assert.equal(s.zeroSaveShare, '97.3%');
	assert.equal(s.totalCalls, '6,656');
});

test('takes a byte pair joined by "to", which 0.7.0 introduced', () => {
	const s = parseReadme(DOC);
	assert.equal(s.bytesIn, '6.47 MB');
	assert.equal(s.bytesOut, '5.47 MB');
});

test('still takes the pre-0.7.0 arrow and wording', () => {
	const old = DOC.replace('(6.47 MB to 5.47 MB)', '(40.1 MB → 22.7 MB)').replace(
		'**6,656 traces covering 2026-08-04 02:56 to\n08-11 03:34 UTC**',
		'**9,965 real command\nexecutions**'
	);
	const s = parseReadme(old);
	assert.equal(s.bytesIn, '40.1 MB');
	assert.equal(s.bytesOut, '22.7 MB');
	assert.equal(s.totalCalls, '9,965');
});

test('returns null rather than half-parsed numbers', () => {
	// The exact failure that shipped: the table is per-command again, so the
	// header carries no `ledger` and nothing matches.
	const broken = DOC.replace('| class | calls | input | filters | + ledger |', '| class | input |');
	assert.equal(parseReadme(broken), null);
});

test('picks each fixture out of the fixture table', () => {
	const s = parseReadme(DOC);
	for (const k of FIXTURE_KEYS) assert.ok(s.fixtures[k], `${k} missing`);
	assert.equal(s.fixtures['git status'].output, '190 B');
	assert.equal(s.fixtures['cargo test'].savings, '92.9%');
});

test('the fallback is a shape the page can render', () => {
	assert.ok(FALLBACK.rows.length >= 3);
	for (const r of FALLBACK.rows) {
		assert.ok(r.command && r.calls && r.input && r.savings);
		assert.ok(Number.isFinite(r.pct) && r.pct >= 0 && r.pct <= 100);
	}
	for (const k of FIXTURE_KEYS) assert.ok(FALLBACK.fixtures[k]);
});

test('the fallback is pinned, so it cannot be changed on one side only', () => {
	// A stale fallback is indistinguishable from a live read on the page, which
	// is exactly how the site served a 9,965-trace figure for a release after
	// the corpus became 6,656.
	//
	// This does not fetch the doc, so it cannot tell you the fallback has gone
	// stale. What it does is force the edit to happen in two places, which stops
	// a figure being nudged here without anyone deciding to. Checking against the
	// live doc would put a network call in the suite, and a suite that fails when
	// GitHub is slow is a suite people learn to ignore.
	assert.equal(FALLBACK.totalCalls, '6,656');
	assert.equal(FALLBACK.overallSaved, '14.9%');
	assert.equal(FALLBACK.zeroSaveShare, '97.3%');
});

test('extremes names the best and worst class', () => {
	const { best, worst } = extremes(parseReadme(DOC).rows);
	assert.equal(best.command, 'build and test');
	assert.equal(worst.command, 'other');
});
