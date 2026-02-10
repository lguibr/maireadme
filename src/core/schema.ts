import { z } from 'zod';

export const BadgeSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  image: z.string().url(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  html_url: z.string().url(),
  logoUrl: z.string().url().optional(),
  tags: z.array(z.string()),
  badges: z.array(BadgeSchema),
  integrations: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      }),
    )
    .optional(),
  isChild: z.boolean().default(false),
});

export const ReadmeDataSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type Badge = z.infer<typeof BadgeSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ReadmeData = z.infer<typeof ReadmeDataSchema>;
