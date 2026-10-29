import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE, contrast } from './palette.js';

test('contrast matches the WCAG reference pair', () => {
	assert.ok(Math.abs(contrast('#000000', '#FFFFFF') - 21) < 0.01);
});

for (const t of ['dark', 'light']) {
	const p = PALETTE[t];
	test(`${t}: body text passes AA on the ground`, () => {
		assert.ok(contrast(p.ink, p.ground) >= 4.5, 'ink');
		assert.ok(contrast(p.inkSoft, p.ground) >= 4.5, 'inkSoft');
	});
	test(`${t}: each thread reads as large text on the ground`, () => {
		for (const k of ['t1', 't2', 't3']) assert.ok(contrast(p[k], p.ground) >= 3, k);
	});
}
