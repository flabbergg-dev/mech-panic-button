'use server'

import { prisma } from "@/lib/prisma"

export async function updateUserEmailPreferenceAction(userId: string, state: boolean) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationsEmailEnabled: state
      }
    });
    
    return user?.notificationsEmailEnabled ?? true; // Default to true if not set
  } catch (error) {
    console.error('Error updating user email preference:', error);
    return true; // Default to true on error
  }
}
