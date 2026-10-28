import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, currentRun, extremes, FALLBACK, FIXTURE_KEYS } from './readme-stats.js';

// A slice of the manual as 0.7.5 rewrote it, which is the shape the site actually
// reads. The previous fixture here was a paraphrase of the 0.7.4 doc, and it kept
// passing for two releases while the live parse returned null, because a
// hand-written approximation cannot drift the way the real file does. Copy from
// docs/website/src/develop/benchmarks.md when the doc changes; do not re-imagine it.
const DOC_NOW = `
# Benchmarks

One developer's real command history, replayed on 0.7.5.

**Corpus**: 5,984 traces, 23,086,649 bytes, 2026-08-11 11:03:00 to 2026-08-14
18:11:10 UTC, all \`agent_id='claude_code'\`, 123 terminal rows excluded from 6,107,
0 errored. Replayed in 1,238 s.

## The headline

**32.6% fewer bytes from the filters. 69.6% with the ledger.**
23,086,649 to 15,557,823 to 7,026,021.

| | |
|---|---|
| tokens, filters only | 7,682,124 to 4,874,124, **36.6%** |
| calls that saved nothing | **96.1%**, 5,748 of 5,984 |
| calls that shrank | 3.9%, 236 |
| ledger folds | 882 calls, 3,231 session markers, 86 project markers |
| raw bytes already shown once | **68.4%** before filters, 64.7% after |

## Which commands benefit

| class | calls | input | filters | + ledger |
|---|---:|---:|---:|---:|
| other | 3,703 | 11.05 MB | 29.1% | **56.2%** |
| file read (\`cat\`, \`sed\`, \`head\`, \`tail\`) | 884 | 10.93 MB | 39.2% | **89.6%** |
| search (\`grep\`, \`rg\`, \`find\`) | 600 | 540 KB | 2.3% | **4.3%** |
| \`git\`, \`gh\` | 696 | 475 KB | 2.5% | **7.0%** |
| infra (\`kubectl\`, \`az\`, \`docker\`) | 65 | 70 KB | **0.0%** | **6.8%** |
| build and test | 36 | 24 KB | 10.8% | **10.8%** |
| **aggregate** | **5,984** | **23.09 MB** | **32.6%** | **69.6%** |

## Head to head, one corpus

| | bytes | saved | claimed |
|---|---|---:|---|
| rtk \`pipe\` | 23,086,649 to 21,655,277 | **6.2%** | |
| omni, filters only | 23,086,649 to 15,557,823 | **32.6%** | |

## Single fixtures

| command | input | delivered | saved |
|---|---:|---:|---:|
| \`docker build\` (heavy noise) | 9,207 B | 102 B | **98.9%** |
| \`cargo test\` (490 passed, 10 failed) | 16,515 B | 1,153 B | **93.0%** |
| \`git status\` (dirty) | 496 B | 165 B | **66.7%** |
`;

// The 0.7.4 shape. Kept because the parser still claims to read it, and a claim
// with no test is the thing this file exists to stop.
const DOC_OLD = `
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

// The doc since 2026-08-24: the current run on top, between machine-written
// markers, and every older run kept below it under its own heading. Abridged from
// docs/website/src/develop/benchmarks.md, with the 0.7.5 run appended as it sits
// in the real file. The page shipped figures from both runs at once before
// currentRun() existed, which is what the first test below pins.
const DOC_CURRENT = `
# Benchmarks

## Correction, 2026-09-03: every ledger figure below is overstated

| arm | as published | with the guards visible |
| --- | --- | --- |
| omni, with the ledger | 4.9% | **3.0%** |

## The current run, 2026-08-24, and the first one that will still exist next month

**Corpus**: 9,478 traces, 8,458,937 bytes, 70 sessions, all \`agent_id='claude_code'\`,
0 terminal rows, 0 errored.

**0.8% from the filters. 2.4% with the ledger**, on 0.7.11. 98.8% of calls saved
nothing, 1.2% shrank, and **no call came back larger**.

<!-- omni:corpus-table:start -->
| Class | Calls | Input | Filters | + ledger | Available | Captured |
|---|---|---|---|---|---|---|
| other | 6,457 | 4.81 MB | 0.8% | 2.8% | 15.9% | **12.6%** |
| file read | 1,056 | 1.89 MB | 0.0% | 1.5% | 17.7% | **8.5%** |
| git | 899 | 0.86 MB | 0.0% | 1.3% | 19.8% | **6.7%** |
| search | 810 | 0.77 MB | 3.4% | 3.4% | 6.5% | **0.0%** |
| infra | 215 | 0.14 MB | 2.4% | 2.7% | 5.5% | **5.2%** |
| build and test | 41 | 0.02 MB | 9.0% | 10.7% | 21.7% | **8.6%** |
| **aggregate** | 9,478 | 8.49 MB | 0.8% | 2.4% | 15.7% | **10.3%** |
<!-- omni:corpus-table:end -->

## The 0.7.5 run, 2026-08-14, which can no longer be re-derived
${DOC_NOW}`;

test('reads the current run, never a figure from an older run below it', () => {
	const s = parseReadme(DOC_CURRENT);
	assert.equal(s.totalCalls, '9,478');
	assert.equal(s.overallSaved, '2.4%');
	assert.equal(s.filtersSaved, '0.8%');
	assert.equal(s.zeroSaveShare, '98.8%');
	assert.deepEqual(
		s.rows.map((r) => [r.command, r.savings]),
		FALLBACK.rows.map((r) => [r.command, r.savings])
	);
});

test('fixtures are read from the whole doc, since they belong to no corpus', () => {
	const s = parseReadme(DOC_CURRENT);
	assert.equal(s.fixtures['git status'].output, '165 B');
});

test('currentRun returns the whole doc when there are no markers', () => {
	assert.equal(currentRun(DOC_NOW), DOC_NOW);
	assert.ok(!currentRun(DOC_CURRENT).includes('69.6%'));
});

test('reads the headline figures the page renders', () => {
	const s = parseReadme(DOC_NOW);
	// 32.6% is the filters alone and sits first in the same bold span. The page
	// labels this figure as the total, so taking the first percentage would have
	// published the smaller number under the larger one's name.
	assert.equal(s.overallSaved, '69.6%');
	assert.equal(s.filtersSaved, '32.6%');
	assert.equal(s.zeroSaveShare, '96.1%');
	assert.equal(s.totalCalls, '5,984');
});

test('a summary row naming calls and ledger does not win the header search', () => {
	// The regression. `| ledger folds | 882 calls, 3,231 session markers |` carries
	// both keywords and sits above the real class table, so a keyword-only search
	// started two lines below it, hit a two-column row, and returned zero rows.
	// The whole parse then failed validation and the page served the fallback.
	const s = parseReadme(DOC_NOW);
	assert.equal(s.rows.length, 6);
	assert.ok(!s.rows.some((r) => /ledger folds/i.test(r.command)));
	assert.equal(s.rows[0].command, 'other');
});

test('parses the per-class table, not the head-to-head or the fixtures', () => {
	const s = parseReadme(DOC_NOW);
	assert.deepEqual(
		s.rows.map((r) => r.command),
		['other', 'file read', 'search', 'git, gh', 'infra', 'build and test']
	);
	assert.equal(s.rows[1].savings, '89.6%'); // ** stripped
	assert.equal(s.rows[1].filters, '39.2%');
	assert.equal(s.rows[1].input, '10.93 MB');
});

test('drops the aggregate row, which is a total and not a class', () => {
	assert.ok(!parseReadme(DOC_NOW).rows.some((r) => /aggregate/i.test(r.command)));
});

test('picks each fixture out of the fixture table', () => {
	const s = parseReadme(DOC_NOW);
	for (const k of FIXTURE_KEYS) assert.ok(s.fixtures[k], `${k} missing`);
	assert.equal(s.fixtures['git status'].output, '165 B');
	assert.equal(s.fixtures['cargo test'].savings, '93.0%');
});

test('extremes names the best and worst class', () => {
	const { best, worst } = extremes(parseReadme(DOC_NOW).rows);
	assert.equal(best.command, 'file read');
	assert.equal(worst.command, 'search');
});

test('still reads the 0.7.4 wording, byte pair and table', () => {
	const s = parseReadme(DOC_OLD);
	assert.equal(s.overallSaved, '15.4%');
	assert.equal(s.zeroSaveShare, '97.3%');
	assert.equal(s.totalCalls, '6,656');
	assert.equal(s.rows.length, 3);
});

test('still takes the pre-0.7.0 arrow and wording', () => {
	const old = DOC_OLD.replace('(6.47 MB to 5.47 MB)', '(40.1 MB → 22.7 MB)').replace(
		'**6,656 traces covering 2026-08-04 02:56 to\n08-11 03:34 UTC**',
		'**9,965 real command\nexecutions**'
	);
	const s = parseReadme(old);
	assert.equal(s.overallSaved, '15.4%');
	assert.equal(s.totalCalls, '9,965');
});

test('returns null rather than half-parsed numbers', () => {
	// The exact failure that shipped: the table is per-command again, so the
	// header carries no `ledger` and nothing matches.
	const broken = DOC_NOW.replace('| class | calls | input | filters | + ledger |', '| class | input |');
	assert.equal(parseReadme(broken), null);
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
	// is how the site served a 6,656-trace figure for the whole of 0.7.5.
	//
	// This does not fetch the doc, so it cannot tell you the fallback has gone
	// stale. What it does is force the edit to happen in two places, which stops
	// a figure being nudged here without anyone deciding to. Checking against the
	// live doc would put a network call in the suite, and a suite that fails when
	// GitHub is slow is a suite people learn to ignore. The deploy-time guard in
	// getBenchmarkStats is what catches real drift.
	assert.equal(FALLBACK.totalCalls, '9,478');
	assert.equal(FALLBACK.overallSaved, '2.4%');
	assert.equal(FALLBACK.filtersSaved, '0.8%');
	assert.equal(FALLBACK.zeroSaveShare, '98.8%');
});
