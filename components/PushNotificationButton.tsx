'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications';
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff, Mail, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useEmailNotification } from '@/hooks/useEmailNotification';
import { getUserEmailPreferenceAction } from '@/app/actions/user/getUserEmailPreferenceAction';
import { updateUserEmailPreferenceAction } from '@/app/actions/user/updateUserEmailPreferenceAction';

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
    const fetchEmailPreference = async () => {
      if (user?.id) {
        const preference = await getUserEmailPreferenceAction(user.id);
        setIsEmailEnabled(preference);
      }
    };
    fetchEmailPreference();
  }, [user?.id]);

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
    } catch (error: unknown) {
      console.error('Error toggling notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailNotifications = async () => {
    try {
      setIsEmailEnabled(!isEmailEnabled);
      
      if (!user?.id) {
        throw new Error('User ID is required to update email preferences');
      }
      
      await updateUserEmailPreferenceAction(user.id, !isEmailEnabled);
      
      try {
        await sendEmail({
          to: "fernando.aponte@digital-sunsets.com",
          subject: "Test email",
          message: "This is a test email",
          userName: "Fernando Aponte"
        });
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    } catch (error) {
      console.error('Error updating email preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to update email preferences');
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-row gap-2">

        
       {!error && ( <div className="">
        <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild> 
          <Button 
          variant="ghost"
           onClick={togglePushNotifications}
           disabled={loading || !!error}
          className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity">
          {isPushSubscribed ?  <Bell className="h-4 w-4" />:   <BellOff className="h-4 w-4" />}
          
            </Button>
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
        <Button 
          variant="ghost"
          onClick={toggleEmailNotifications}
          className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            {isEmailEnabled ? (
              <MailOpen className="h-4 w-4" />
             
            ) : ( <Mail className="h-4 w-4" />
            )}
          </div>
        </Button> 
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
