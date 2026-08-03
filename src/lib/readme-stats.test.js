import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, extremes, FALLBACK, FIXTURE_KEYS } from './readme-stats.js';

// Trimmed to the shapes the parser has to survive: a decoy `| Command` table
// before the real one, bold cells, and the headline bullets. The source doc is
// docs/BENCHMARKS.md, which says "of calls saved nothing" where the old README
// said "of those calls" — the regex has to take both.
const DOC = `
| Command | Without OMNI | With OMNI | Saved |
|---|---|---|---|
| \`cargo test\` | 16.5 KB | the summary | **92.9%** |

* **43.3% fewer bytes** across the entire mix (40.1 MB → 22.7 MB).
* **90.0% of calls saved nothing at all.** OMNI handed the output straight
  back, adding zero bytes.

measured against **9,965 real command
executions** replayed from one developer's actual usage:

| Command | Calls | Input | Output | Saved |
|---------|-------|-------|--------|-------|
| \`cargo\` | 124 | 1.5 MB | 127 KB | **91.4%** |
| \`git\` | 931 | 12.0 MB | 1.3 MB | **89.2%** |
| \`cd\` | 2,963 | 5.6 MB | 5.5 MB | **2.2%** |

| Command / Context | Input | Delivered | Saved |
|---|---|---|---|
| \`cargo test\` (490 passed, 10 failed) | 16,515 B | 1,178 B | **92.9%** |
| \`git status\` (dirty) | 496 B | 190 B | **61.7%** |
| \`docker build\` (heavy noise) | 9,207 B | 5,904 B | **35.9%** |

Some trailing prose.
`;

test('parses the per-command table, not the decoy above it', () => {
	const s = parseReadme(DOC);
	assert.equal(s.rows.length, 3);
	assert.deepEqual(
		s.rows.map((r) => r.command),
		['cargo', 'git', 'cd']
	);
	assert.equal(s.rows[0].savings, '91.4%'); // ** stripped
	assert.equal(s.rows[0].input, '1.5 MB');
});

test('pulls the headline figures the page leads with', () => {
	const s = parseReadme(DOC);
	assert.equal(s.overallSaved, '43.3%');
	assert.equal(s.zeroSaveShare, '90.0%');
	assert.equal(s.totalCalls, '9,965'); // spans a line break in the real doc
	assert.equal(s.bytesIn, '40.1 MB');
	assert.equal(s.bytesOut, '22.7 MB');
});

test('takes the zero-save share with or without "those"', () => {
	const withThose = parseReadme(DOC.replace('% of calls saved', '% of those calls saved'));
	assert.equal(withThose.zeroSaveShare, '90.0%');
});

test('pulls every hero fixture, and falls back per row when one is renamed', () => {
	const s = parseReadme(DOC);
	assert.deepEqual(Object.keys(s.fixtures), FIXTURE_KEYS);
	assert.equal(s.fixtures['git status'].output, '190 B');
	assert.equal(s.fixtures['docker build'].savings, '35.9%');

	// One row renamed must not blank that panel of the hero.
	const renamed = parseReadme(DOC.replace('`docker build` (heavy noise)', '`podman build`'));
	assert.deepEqual(renamed.fixtures['docker build'], FALLBACK.fixtures['docker build']);
	assert.equal(renamed.fixtures['git status'].output, '190 B');
});

test('rejects a doc whose table vanished rather than half-parsing it', () => {
	assert.equal(parseReadme(DOC.replace(/\| Calls \|/, '| Runs |')), null);
});

test('rejects nonsense percentages', () => {
	assert.equal(parseReadme(DOC.replace('**91.4%**', '**oops%**')), null);
});

test('extremes picks the ends of the mix', () => {
	const { best, worst } = extremes(parseReadme(DOC).rows);
	assert.equal(best.command, 'cargo');
	assert.equal(worst.command, 'cd');
});

test('committed fallback is itself valid data', () => {
	assert.ok(FALLBACK.rows.length >= 3);
	assert.ok(FALLBACK.rows.every((r) => Number.isFinite(r.pct) && r.pct >= 0 && r.pct <= 100));
	// The regression that started all this: the page must never claim 90%+ overall.
	assert.ok(parseFloat(FALLBACK.overallSaved) < 90);
});
