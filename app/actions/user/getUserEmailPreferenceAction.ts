'use server'

import { prisma } from "@/lib/prisma"

export async function getUserEmailPreferenceAction(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationsEmailEnabled: true }
    });
    
    return user?.notificationsEmailEnabled ?? true; // Default to true if not set
  } catch (error) {
    console.error('Error fetching user email preference:', error);
    return true; // Default to true on error
  }
}
