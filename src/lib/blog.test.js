import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { isEvergreen, isReleaseCandidate, relatedFor } from './blog.js';

const ids = readdirSync('./src/content/blog')
	.filter((f) => f.endsWith('.md'))
	.map((f) => f.replace(/\.md$/, ''));

/* The regression this file exists for: `omni-v0-5-0-pure-rust-rewrite` is a
   release note that does not carry the `omni-update-` prefix, and the old
   prefix test served four of those as evergreen. */
test('a release note is not evergreen under either filename prefix', () => {
	assert.equal(isEvergreen('omni-update-v0-6-9-zero-rows-in-the-archive'), false);
	assert.equal(isEvergreen('omni-v0-5-0-pure-rust-rewrite'), false);
	assert.equal(isEvergreen('omni-v0-4-5-polyglot-filter-expansion'), false);
	assert.equal(isEvergreen('omni-v0-5-6-rc1-magic-pipe-detection'), false);
});

test('the posts that answer a search query stay evergreen', () => {
	// "6-stage" must not read as a version token.
	assert.equal(isEvergreen('omni-under-the-hood-6-stage-pipeline'), true);
	assert.equal(isEvergreen('why-your-ai-agent-is-expensive'), true);
	assert.equal(isEvergreen('omni-deep-dive-token-efficiency-vs-context-fidelity'), true);
	assert.equal(isEvergreen('omni-real-world-use-cases-token-savings'), true);
});

test('every evergreen post on disk is one, checked against the real content dir', () => {
	const pool = ids.filter(isEvergreen);
	assert.ok(pool.length > 0, 'no evergreen posts found, the content dir moved?');
	for (const id of pool) {
		assert.doesNotMatch(id, /v\d+-\d+-\d+/, `${id} is a per-version note`);
		assert.equal(isReleaseCandidate(id), false);
	}
});

test('a release note never recommends itself, and links only to evergreen', () => {
	const all = ids.map((id) => ({ id }));
	const current = all.find((p) => p.id.includes('v0-6-9'));
	const related = relatedFor(current, all);
	assert.equal(related.length, 3);
	for (const p of related) {
		assert.notEqual(p.id, current.id);
		assert.ok(isEvergreen(p.id), `${p.id} is not evergreen`);
	}
});
