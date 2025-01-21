'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications';
import { useUser } from '@clerk/nextjs';

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
      variant="outline"
      className="fixed bottom-4 right-4 z-50"
    >
      {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
    </Button>
  );
}
