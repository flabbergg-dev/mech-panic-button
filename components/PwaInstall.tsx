'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface PwaInstallProps {
  className?: string;
}

export function PwaInstall({ className }: PwaInstallProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isRunningStandalone);

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        toast.success('App installed successfully!');
      } else {
        toast.info('App installation cancelled');
      }

      // Reset the deferred prompt
      deferredPrompt = null;
      setIsInstallable(false);
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  if (isStandalone || !isInstallable) {
    return null;
  }

  return (
    <Card className={`p-4 ${className || ''}`}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-semibold">Install Mech Panic</h3>
        <p className="text-sm text-muted-foreground">
          Install our app for a better experience and quick access from your home screen.
        </p>
        <Separator />
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={handleInstallClick}
            className="w-full sm:w-auto"
          >
            Install App
          </Button>
        </div>
      </div>
    </Card>
  );
}
