'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications';
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff } from 'lucide-react';

export function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;

    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const handleSubscribe = async () => {
    try {
      await subscribeToPushNotifications();
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeFromPushNotifications();
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
    }
  };

  if (!isSignedIn || loading) return null;

  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      variant="ghost"
      className="fixed top-4 right-4 z-50 rounded-full p-2 shadow group hover:bg-card/10"
    >
      {isSubscribed ? <BellOff className="h-4 w-4 group-hover:text-red-500 group-hover:animate-bounce ease-in-out" /> : <Bell className="h-4 w-4 group-hover:text-green-500 group-hover:animate-bounce ease-in-out " />}
    </Button>
  );
}
