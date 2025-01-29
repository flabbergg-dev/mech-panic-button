'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications';
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PushNotificationButton({ className }: { className?: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function registerServiceWorker() {
      try {
        if (!('serviceWorker' in navigator)) {
          setError('Service Worker not supported');
          setLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setLoading(false);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        setError('Failed to register Service Worker');
        setLoading(false);
      }
    }

    if (isSignedIn) {
      registerServiceWorker();
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

  // Show loading state
  if (loading) {
    return (
      <Button variant="ghost" size="icon" className={cn("relative", className)} disabled>
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <Button variant="ghost" size="icon" className={cn("relative", className)} disabled>
        <span className="text-xs text-red-500">{error}</span>
      </Button>
    );
  }

  // Don't render if not signed in
  if (!isSignedIn) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      className={cn("relative hover:bg-background/80", className)}
      title={isSubscribed ? "Disable notifications" : "Enable notifications"}
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5 transition-transform hover:scale-110" />
      ) : (
        <BellOff className="h-5 w-5 transition-transform hover:scale-110" />
      )}
    </Button>
  );
}
