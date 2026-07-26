// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { isReleaseCandidate } from './src/lib/blog.js';

/* Not one sitemap entry carried a lastmod, so a crawler had no way to tell a
   post written this week from one written in March. Only posts get one: their
   frontmatter date is a real fact. Stamping the static pages with the build
   time would be the kind of always-fresh lastmod Google learns to ignore. */
const DIR = './src/content/blog';
const postDates = new Map(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const date = readFileSync(`${DIR}/${f}`, 'utf8').match(/^date:\s*(\S+)/m);
      return [`/blog/${f.replace(/\.md$/, '')}/`, date?.[1]];
    })
    .filter(([, date]) => date),
);

export default defineConfig({
  site: 'https://omni.weekndlabs.com',
  integrations: [
    // Release-candidate notes stay online and crawlable, but out of the
    // sitemap and out of the index. See src/lib/blog.js.
    sitemap({
      filter: (page) => !isReleaseCandidate(page),
      serialize(item) {
        const lastmod = postDates.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
