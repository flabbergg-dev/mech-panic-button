import { z } from 'zod';

export const NotificationEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  userName: z.string().optional(),
});

export type NotificationEmailProps = z.infer<typeof NotificationEmailSchema>;

export const sendInvoiceEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  userName: z.string().optional(),
  link: z.string().url(),
});

export type sendInvoiceEmailProps = z.infer<typeof sendInvoiceEmailSchema>;