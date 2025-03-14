import { z } from 'zod';
import { UserRole, Prisma } from '@prisma/client';

export interface UserData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  lastName: string;
  role: UserRole | null;
  firstName: string;
  phoneNumber: string | null;
  currentLocation: Prisma.JsonValue;
  subscriptionPlan?: string | null;
}

export interface NotificationEmailProps {
  to: string;
  subject: string;
  message: string;
  userName?: string;
  mechanicName?: string;
  bookingDate?: Date | string;
  serviceType?: string;
}

export const NotificationEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  userName: z.string().optional(),
  mechanicName: z.string().optional(),
  bookingDate: z.union([z.date(), z.string()]).optional(),
  serviceType: z.string().optional(),
});

export const sendInvoiceEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  userName: z.string().optional(),
  link: z.string().url(),
});

export type sendInvoiceEmailProps = z.infer<typeof sendInvoiceEmailSchema>;