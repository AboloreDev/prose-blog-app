import z from "zod";

export const createPostSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(300, "Title must be 300 characters or less"),

    body: z.string().optional(),

    link_url: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),

    community_id: z
      .number("Please select a community")
      .positive("Please select a community"),

    status: z.enum(["draft", "published", "scheduled"], {
      required_error: "Please select a post status",
    }),

    publish_at: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled") {
      if (!data.publish_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled time is required",
          path: ["publish_at"],
        });
      } else {
        const selectedTime = new Date(data.publish_at);
        if (selectedTime <= new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Scheduled time must be in the future",
            path: ["publish_at"],
          });
        }
      }
    }
  });

export type CreatePostFormValues = z.infer<typeof createPostSchema>;
