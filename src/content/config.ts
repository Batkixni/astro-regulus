import { defineCollection, z } from 'astro:content';

const work = defineCollection({
    type: 'content',
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        client: z.string(),
        role: z.array(z.string()),
        date: z.date(),
        genre: z.string().default('Motion'),
        thumbnail: z.string(),
        videoUrl: z.string().optional(),
        description: z.string(),
        credits: z.array(z.object({
            name: z.string(),
            role: z.string()
        })).optional(),
    }),
});

export const collections = { work };
