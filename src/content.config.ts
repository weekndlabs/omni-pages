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
  }),
});

export const collections = {
  'blog': blogCollection,
};
