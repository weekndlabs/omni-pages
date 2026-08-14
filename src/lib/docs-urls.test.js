import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SITE, docsPages, descriptionFrom } from './docs-urls.js';

/* A stand-in for what mdBook renders: a book root, a chapter one level down, a
   chapter that is a directory index, and the three files that are not pages. */
const book = mkdtempSync(join(tmpdir(), 'docs-urls-'));
mkdirSync(join(book, 'concepts'));
mkdirSync(join(book, 'id/develop'), { recursive: true });
for (const f of ['index.html', 'print.html', '404.html', 'toc.html', 'concepts/the-ledger.html', 'id/index.html', 'id/develop/index.html']) {
	writeFileSync(join(book, f), '<html><head></head><body></body></html>');
}

test('a chapter loses its extension, an index becomes its directory', () => {
	const urls = docsPages(book).map((p) => p.url);
	assert.deepEqual(urls, ['/docs/', '/docs/concepts/the-ledger', '/docs/id/', '/docs/id/develop/']);
});

/* The regression this guards: a trailing slash on a chapter, or a missing one
   on an index, names a URL whose relative assets resolve against the wrong
   directory. Both forms answer 200, so nothing else would notice. */
test('the two URL forms never swap', () => {
	for (const { file, url } of docsPages(book)) {
		if (file.endsWith('index.html')) assert.ok(url.endsWith('/'), `${url} needs its trailing slash`);
		else assert.ok(!url.endsWith('/'), `${url} must not have a trailing slash`);
		assert.doesNotMatch(url, /\.html$/);
	}
});

test('print, 404 and the sidebar frame stay out', () => {
	const urls = docsPages(book).map((p) => p.url);
	for (const gone of ['/docs/print', '/docs/404', '/docs/toc']) assert.ok(!urls.includes(gone));
});

test('a manual that was never built costs nothing', () => {
	assert.deepEqual(docsPages(join(book, 'nope')), []);
});

const page = (body) => `<html><head></head><body><main>${body}</main></body></html>`;

test('the description is the first paragraph, tags stripped', () => {
	assert.equal(
		descriptionFrom(page('<h1 id="x"><a class="header" href="#x">What OMNI is</a></h1>\n<p>A small program that <strong>edits</strong> what your agent reads.</p>')),
		'A small program that edits what your agent reads.',
	);
});

test('an entity survives the round trip, and a cut never lands inside one', () => {
	assert.equal(descriptionFrom(page('<p>stdout &amp; stderr</p>')), 'stdout &amp; stderr');
	const long = descriptionFrom(page(`<p>${'word '.repeat(40)}&amp; end</p>`));
	assert.doesNotMatch(long, /&[a-z#0-9]*$/, 'truncated mid-entity');
	assert.ok(long.length <= 161, `${long.length} characters is past the limit`);
	assert.ok(long.endsWith('…'));
});

/* develop/pipeline opens on a diagram, and mdBook wraps an image in a `<p>` of
   its own, so "the first paragraph" was the page's alt text and then nothing. */
test('a paragraph holding only an image is skipped, not returned empty', () => {
	const html = page('<h1>The pipeline</h1>\n<p><img src="../media/the-pipeline.svg" alt="The pipeline"></p>\n<p>The order is fixed.</p>');
	assert.equal(descriptionFrom(html), 'The order is fixed.');
});

test('nothing to take reads as nothing, not as an empty tag', () => {
	assert.equal(descriptionFrom('<html><head></head><body></body></html>'), null);
	assert.equal(descriptionFrom(page('<ul><li>a list first</li></ul>')), null);
	assert.equal(descriptionFrom(page('<p>   </p>')), null);
});

/* Against the real thing when there is one. `npm test` runs without a docs
   build, so this checks and skips rather than failing on a clean checkout. */
test('the built manual maps to servable URLs', { skip: !existsSync('public/docs') }, () => {
	const pages = docsPages();
	assert.ok(pages.length > 30, `only ${pages.length} pages, did the build change?`);
	for (const { url } of pages) {
		assert.ok(url.startsWith('/docs/'), url);
		assert.doesNotMatch(url, /\.html/);
		assert.doesNotMatch(SITE + url, /\/\/docs/);
	}
});
