'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

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
  description: string;
  className?: string;
}

export function PwaInstall({ description, className }: PwaInstallProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroidChrome, setIsAndroidChrome] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isRunningStandalone);

    // Check if running on Android Chrome
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    setIsAndroidChrome(isAndroid && isChrome);

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

  async function handleInstallClick() {
    if (!deferredPrompt) {
      // If no install prompt is available, redirect to install page
      window.location.href = '/installpwa';
      return;
    }

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
      // Fallback to install page on error
      window.location.href = '/installpwa';
    }
  }

  // If app is already installed or running standalone, don't show install button
  if (isStandalone) {
    return null;
  }

  // For Android Chrome or when install prompt isn't available, show button that links to install page
  if (!isInstallable || isAndroidChrome) {
    return (
      <Button
        variant="default"
        size="lg"
        className={`w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 ${className || ''}`}
        asChild
      >
        <Link href="/installpwa">{description}</Link>
      </Button>
    );
  }

  // Show install button for browsers that support native installation
  return (
    <Button
      variant="default"
      size="lg"
      className={`w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 ${className || ''}`}
      onClick={handleInstallClick}
    >
      {description}
    </Button>
  );
}
