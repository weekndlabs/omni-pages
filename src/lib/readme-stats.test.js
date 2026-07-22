import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, extremes, FALLBACK } from './readme-stats.js';

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
