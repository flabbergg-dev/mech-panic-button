import { getNotificationsEmailState } from "@/app/actions/getNotificationsEmailState";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const clientEmail = url.searchParams.get('clientEmail');

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Missing client email" },
        { status: 400 }
      );
    }

    const result = await getNotificationsEmailState(clientEmail);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ enabled: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get notification state" },
      { status: 500 }
    );
  }
}
