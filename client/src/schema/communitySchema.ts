import z from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_ ]+$/, "Only letters, numbers, spaces and underscores"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be 30 characters or less")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be 500 characters or less"),
  visibility: z.enum(["public", "private"]),
});

export type CreateCommunityFormValues = z.infer<typeof createCommunitySchema>;
