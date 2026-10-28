import test from 'node:test';
import assert from 'node:assert/strict';
import { shorten, bytes, HEAD, TAIL } from './demo-format.js';

test('short output is shown whole', () => {
	const text = 'a\nb\nc\n';
	assert.deepEqual(shorten(text).map((l) => l.t), ['a', 'b', 'c']);
});

test('long output keeps head and tail and counts what it dropped', () => {
	const text = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
	const out = shorten(text);
	assert.equal(out.length, HEAD + TAIL + 1);
	assert.equal(out[0].t, 'line 0');
	assert.equal(out.at(-1).t, 'line 99');
	assert.ok(out[HEAD].skip);
	assert.match(out[HEAD].t, new RegExp(`\\b${100 - HEAD - TAIL} lines\\b`));
});

test('bytes reads like the manual prints it', () => {
	assert.equal(bytes(16515), '16,515 B');
});
