import { glob } from 'astro/loaders';
import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tag: z.string().optional(),
    author: z.string().optional(),
    featured: z.boolean().optional().default(false),
    // The social preview for this post, as an absolute path under public/.
    // Layout already falls back to /media/og.png, so a post without one is
    // unchanged. Release notes set it to that release's card.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
};
