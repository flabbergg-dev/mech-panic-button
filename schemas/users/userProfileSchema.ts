import { z } from "zod";

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),

  documentsUrl: z.array(z.string()).optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserSchema>;