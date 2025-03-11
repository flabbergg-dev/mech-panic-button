"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function getStripeConnectId(mechanicId?: string) {
  let userId: string | null = null;

  if (mechanicId) {
    const mechanic = await prisma.mechanic.findUnique({
      where: { id: mechanicId },
      select: { userId: true }
    });

    if (mechanic) {
      userId = mechanic.userId;
    }
  } else {
    const authResult = await auth();
    userId = authResult.userId;
  }

  if (!userId) {
    return null;
  }

  const stripeConnectId = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectId: true }
  });

  return stripeConnectId;
}
