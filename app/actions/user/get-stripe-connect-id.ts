"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { UserRole } from "@prisma/client"

export async function getStripeConnectId(mechanicId?: string) {
  let userId: string | null = null;

  if (mechanicId) {
    const mechanic = await prisma.mechanic.findUnique({
      where: { id: mechanicId },
      select: {
        userId: true,
        user: {
          select: {
            role: true,
            stripeSubscriptionPlan: true
          }
        }
      }
    });

    if (mechanic) {
      // Verify mechanic role and subscription
      if (mechanic.user.role !== 'Mechanic') {
        console.error('User is not a mechanic:', mechanicId);
        return null;
      }

      userId = mechanic.userId;
    }
  } else {
    const authResult = await auth();
    userId = authResult.userId;
  }

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectId: true,
      role: true,
      stripeSubscriptionPlan: true
    }
  });

  // Return null if no user or no stripeConnectId
  if (!user || !user.stripeConnectId) {
    console.error('No user or Stripe Connect ID found for:', userId);
    return null;
  }

  // For direct user access, verify role and subscription
  if (!mechanicId) {
    if (user.role !== 'Mechanic') {
      console.error('User is not a mechanic:', userId);
      return null;
    }
  }

  return { stripeConnectId: user.stripeConnectId };
}
