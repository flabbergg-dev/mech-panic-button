"use server"

import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/utils/emailNotifications";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email, subject, message, userName } = await request.json();

    if (!email || !subject || !message || !userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendNotificationEmail({
      to: email,
      subject,
      message,
      userName
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
