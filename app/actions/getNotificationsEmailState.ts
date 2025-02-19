import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

export const getNotificationsEmailState = async (clientEmail: string) => {
    try {

        const isEnabled = await prisma.user.findUnique({
            where: { email: clientEmail },
            select: {
                email: true,
                 notificationsEmailEnabled: true }
        })

        if (!isEnabled) {
            return { error: "User not found" }
        }
        return { success: true, data: isEnabled.notificationsEmailEnabled }
}
    catch (error) {
        console.log(error)
        return { error: "Something went wrong" }
    }
}