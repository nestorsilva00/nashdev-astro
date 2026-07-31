import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const skillSchema = z.object({
	name: z.string(),
	logo: z.string(),
});

const experienceSchema = z.object({
	id: z.string(),
	role: z.string(),
	company: z.string(),
	companyInitials: z.string(),
	logo: z.string().nullable(),
	dates: z.string(),
	status: z.string().nullable(),
	highlights: z.array(z.string()),
	technologies: z.array(z.string()),
});

const educationSchema = z.object({
	id: z.string(),
	qualification: z.string().nullable(),
	institution: z.string(),
	institutionInitials: z.string(),
	logo: z.string().nullable(),
	dates: z.string(),
	status: z.string().nullable(),
	highlights: z.array(z.string()),
	subjects: z.array(z.string()),
});

const publicProfileSchema = z.object({
	type: z.literal('profile'),
	name: z.string(),
	headline: z.string(),
	about: z.array(z.string()).min(1),
	skillGroups: z.array(
		z.object({
			title: z.string(),
			skills: z.array(skillSchema),
		}),
	),
	experience: z.array(experienceSchema),
	education: z.array(educationSchema),
	lastUpdated: z.string().optional(),
});

const extendedProfileSchema = z.object({
	type: z.literal('extended-profile'),
	additionalContext: z.array(z.string()).default([]),
	experienceDetails: z
		.array(
			z.object({
				experienceId: z.string(),
				details: z.array(z.string()).min(1),
			}),
		)
		.default([]),
	frequentlyAskedQuestions: z
		.array(
			z.object({
				question: z.string(),
				answer: z.string(),
			}),
		)
		.default([]),
	lastUpdated: z.string().optional(),
});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			tags: z.array(z.string()).default([]),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const profile = defineCollection({
	loader: glob({ base: './src/content/profile', pattern: '**/*.json' }),
	schema: z.discriminatedUnion('type', [
		publicProfileSchema,
		extendedProfileSchema,
	]),
});

export const collections = { blog, profile };
