import { z } from "zod";

// Define the schema for the mechanic profile form
export const updateMechanicProfileSchema = z.object({
    email: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    documentsUrl: z.array(z.string()).optional(),
    bio: z.string().optional(),
    isAvailable: z.boolean().optional(),
    bannerImage: z.instanceof(File).optional().refine((file) => file?.type.startsWith("image/"), {
      message: "Banner Image must be an image file",
    }),
    driversLicenseId: z.instanceof(File).optional().refine((file) => file?.type === "application/pdf" || file?.type.startsWith("image/"), {
      message: "Driver's License must be an image or PDF file",
    }),
    merchantDocumentUrl: z.instanceof(File).optional().refine((file) => file?.type === "application/pdf", {
      message: "Merchant Document must be a PDF file",
    }),
  });

// Define the TypeScript type inferred from the schema
export type UpdateMechanicProfile = z.infer<typeof updateMechanicProfileSchema>;