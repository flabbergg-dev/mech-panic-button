import { z } from "zod";

export const formSchema = z.object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must not exceed 50 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(500, "Message must not exceed 500 characters"),
  })

  export type ContactFormSchema = z.infer<typeof formSchema>
