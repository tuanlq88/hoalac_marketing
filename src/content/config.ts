import { defineCollection, z } from 'astro:content';

const ctaLevel = z.enum(['tofu', 'mofu', 'bofu']);

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    publishedAt: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    leadFormCTA: z.boolean().optional(),
    search_intent: z.string().optional(),
    funnel_stage: z.string().optional(),
    primary_goal: z.string().optional(),
    allowed_cta: ctaLevel.optional()
  })
});

const posts = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string(),
      pillar: z.string(),
      search_intent: z.string(),
      funnel_stage: z.string(),
      primary_goal: z.string(),
      week_plan: z.string(),
      draft: z.boolean().default(false),
      allowed_cta: ctaLevel,
      description: z.string().optional(),
      excerpt: z.string().optional(),
      focus_regions: z.array(z.string()).default([]),
      updatedAt: z.string().optional()
    })
    .passthrough()
});

const pillars = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    updatedAt: z.string(),
    relatedTags: z.array(z.string()).default([]),
    priorityIntents: z.array(z.string()).default([]),
    stageFocus: z.string().optional()
  })
});

export const collections = { articles, posts, pillars };
