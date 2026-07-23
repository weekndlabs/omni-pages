import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, extremes, FALLBACK, FIXTURE_KEYS } from './readme-stats.js';

// Trimmed to the shapes the parser has to survive: a decoy `| Command` table
// before the real one, bold cells, and the headline bullets.
const README = `
| Command | Without OMNI | With OMNI | Saved |
|---|---|---|---|
| \`cargo test\` | 16.5 KB | the summary | **93%** |

* **58.9% fewer bytes** reaching the model across the whole mix (15.0 MB → 6.2 MB).
* **63.6% of those calls saved nothing at all.** OMNI handed the output straight
  back, adding **zero** bytes.

measured against **1,810 real command
executions** replayed from one developer's actual usage:

| Command | Calls | Input | Output | Saved |
|---------|-------|-------|--------|-------|
| \`cargo\` | 29 | 424 KB | 13 KB | **96.8%** |
| \`git\` | 256 | 5.9 MB | 509 KB | **91.3%** |
| \`cat\` | 85 | 515 KB | 468 KB | **9.1%** |

| Command / Context | Input | Output | Saved |
|---|---|---|---|
| \`cargo test\` (490 passed, 10 failed) | 16.5 KB | 1,100 B | **93.3%** |
| \`git status\` (dirty) | 496 B | 113 B | **77.2%** |
| \`docker build\` (heavy noise) | 9.2 KB | 5.8 KB | **37.2%** |

Some trailing prose.
`;

test('parses the 1,810-execution table, not the decoy above it', () => {
	const s = parseReadme(README);
	assert.equal(s.rows.length, 3);
	assert.deepEqual(
		s.rows.map((r) => r.command),
		['cargo', 'git', 'cat']
	);
	assert.equal(s.rows[0].savings, '96.8%'); // ** stripped
	assert.equal(s.rows[0].input, '424 KB');
});

test('pulls the headline figures the page leads with', () => {
	const s = parseReadme(README);
	assert.equal(s.overallSaved, '58.9%');
	assert.equal(s.zeroSaveShare, '63.6%');
	assert.equal(s.totalCalls, '1,810'); // spans a line break in the real README
	assert.equal(s.bytesIn, '15.0 MB');
	assert.equal(s.bytesOut, '6.2 MB');
});

test('pulls every hero fixture, and falls back per row when one is renamed', () => {
	const s = parseReadme(README);
	assert.deepEqual(Object.keys(s.fixtures), FIXTURE_KEYS);
	assert.equal(s.fixtures['git status'].output, '113 B');
	assert.equal(s.fixtures['docker build'].savings, '37.2%');

	// One row renamed must not blank that panel of the hero.
	const renamed = parseReadme(README.replace('`docker build` (heavy noise)', '`podman build`'));
	assert.deepEqual(renamed.fixtures['docker build'], FALLBACK.fixtures['docker build']);
	assert.equal(renamed.fixtures['git status'].output, '113 B');
});

test('rejects a README whose table vanished rather than half-parsing it', () => {
	assert.equal(parseReadme(README.replace(/\| Calls \|/, '| Runs |')), null);
});

test('rejects nonsense percentages', () => {
	assert.equal(parseReadme(README.replace('**96.8%**', '**oops%**')), null);
});

test('extremes picks the ends of the mix', () => {
	const { best, worst } = extremes(parseReadme(README).rows);
	assert.equal(best.command, 'cargo');
	assert.equal(worst.command, 'cat');
});

test('committed fallback is itself valid data', () => {
	assert.ok(FALLBACK.rows.length >= 3);
	assert.ok(FALLBACK.rows.every((r) => Number.isFinite(r.pct) && r.pct >= 0 && r.pct <= 100));
	// The regression that started all this: the page must never claim 90%+ overall.
	assert.ok(parseFloat(FALLBACK.overallSaved) < 90);
});
