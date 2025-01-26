import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import webPush from 'web-push';

// Initialize web-push with VAPID details
const vapidDetails = {
  subject: 'mailto:support@digitalsunsets.dev',
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY || '',
};

webPush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find all subscriptions for the current user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No subscriptions found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sample notification payload
    const payload = JSON.stringify({
      title: '🔔 New Test Notification',
      body: '👋 Hello! This is a test notification from Mech-Panic. Click me!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: '/'
      },
      vibrate: [200, 100, 200]
    });

    // Send notification to all subscriptions
    const results = await Promise.all(
      subscriptions.map(subscription => {
        return webPush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }, payload);
      })
    );

    return new NextResponse(JSON.stringify({ 
      message: 'Test notification sent successfully',
      results 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
