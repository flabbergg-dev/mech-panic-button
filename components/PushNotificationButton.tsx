'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications';
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff, Mail, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useEmailNotification } from '@/hooks/useEmailNotification';

export function PushNotificationButton({ className }: { className?: string }) {
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSignedIn, user } = useUser();
  // TODO: get user email notifications state
  // const [isEmailEnabled, setIsEmailEnabled] = useState(user?.emailNotificationsEnabled);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendEmail } = useEmailNotification()

  useEffect(() => {
    async function registerServiceWorker() {
      try {
        // Check if running on iOS Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isSafari && isIOS) {
          setError('Push notifications are not available on iOS Safari. Email notifications will be used instead.');
          setLoading(false);
          return;
        }

        if (!('serviceWorker' in navigator)) {
          setError('Push notifications are not supported in this browser. Email notifications will be used instead.');
          setLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        const subscription = await registration.pushManager.getSubscription();
        setIsPushSubscribed(!!subscription);
        setLoading(false);
      } catch (err) {
        console.error('Error registering service worker:', err);
        setError('Failed to setup push notifications. Email notifications will be used instead.');
        setLoading(false);
      }
    }

    if (isSignedIn) {
      registerServiceWorker();
    }
  }, [isSignedIn]);

  const togglePushNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isPushSubscribed) {
        await unsubscribeFromPushNotifications();
        setIsPushSubscribed(false);
      } else {
        await subscribeToPushNotifications();
        setIsPushSubscribed(true);
      }
    } catch (err: any) {
      console.error('Error toggling notifications:', err);
      setError(err.message || 'Failed to toggle notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailNotifications = async () => {
    try {
      setIsEmailEnabled(!isEmailEnabled);
      // You can add an API call here to update user preferences in your database
      sendEmail({to:"fernando.aponte@digital-sunsets.com", subject:"Test email", message:"This is a test email", userName:"Fernando Aponte"})
      .then(() => console.log('Email sent successfully'))
      .catch((err) => console.error('Error sending email:', err));
    } catch (err) {
      console.error('Error toggling email notifications:', err);
      setIsEmailEnabled(!isEmailEnabled); // Revert on error
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-row gap-2">

        
       {!error && ( <div className="flex items-center justify-between py-2">
        <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          
          <button 
           onClick={togglePushNotifications}
           disabled={loading || !!error}
          className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity">
          {isPushSubscribed ?  <Bell className="h-4 w-4" />:   <BellOff className="h-4 w-4" />}
          
            </button>
          </TooltipTrigger>
          <TooltipContent>
          <p>{isPushSubscribed ? 'Disable' : 'Enable'} push notifications</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
        </div>)}
        <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <button 
          onClick={toggleEmailNotifications}
          className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            {isEmailEnabled ? (
              <MailOpen className="h-4 w-4" />
             
            ) : ( <Mail className="h-4 w-4" />
            )}
          </div>
        </button> 
        </TooltipTrigger>
          <TooltipContent>
          <p>{isEmailEnabled ? 'Disable' : 'Enable'} email notifications</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
      </div>
    </div>
  );
}
