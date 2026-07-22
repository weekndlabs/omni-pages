// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { isReleaseCandidate } from './src/lib/blog.js';

export default defineConfig({
  site: 'https://omni.weekndlabs.com',
  integrations: [
    // Release-candidate notes stay online and crawlable, but out of the
    // sitemap and out of the index. See src/lib/blog.js.
    sitemap({ filter: (page) => !isReleaseCandidate(page) }),
  ],
});
