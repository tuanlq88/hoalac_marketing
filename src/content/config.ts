import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    publishedAt: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional()
  })
});

export const collections = { articles };
