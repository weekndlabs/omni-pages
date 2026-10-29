import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { versionOf, eraOf, glanceFor } from './cover.js';

test('versionOf reads a release and keeps the rc suffix', () => {
	assert.equal(versionOf('Contexere v0.8.1: The New Name'), 'v0.8.1');
	assert.equal(versionOf('OMNI v0.5.7-rc1: Automated Tool'), 'v0.5.7-rc1');
});

test('versionOf returns null for a post that is not a release', () => {
	assert.equal(versionOf('Why your AI agent is expensive'), null);
	assert.equal(versionOf('The 6-stage pipeline'), null);
});

test('eraOf starts Contexere on the 0.8.0 date, in UTC', () => {
	assert.equal(eraOf(new Date('2026-10-29')), 'contexere');
	assert.equal(eraOf(new Date('2026-10-28T23:59:59Z')), 'omni');
});

test('glanceFor takes the first list before the first heading only', () => {
	assert.deepEqual(glanceFor('Intro.\n\n- one\n- two\n\n## Next\n- three', 'D'),
		{ description: 'D', bullets: ['one', 'two'] });
	assert.deepEqual(glanceFor('Intro only.\n\n## H\n- x', 'D').bullets, []);
});

test('every post on disk has a description for its box', () => {
	const dir = './src/content/blog';
	for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
		const src = readFileSync(`${dir}/${f}`, 'utf8');
		const desc = (src.match(/^description:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
		const body = src.replace(/^---[\s\S]*?\n---\n/, '');
		assert.ok(glanceFor(body, desc).description.length > 0, f);
	}
});
