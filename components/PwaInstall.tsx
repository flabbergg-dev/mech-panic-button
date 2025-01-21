'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';

let deferredPrompt: any;

export function PwaInstall() {
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      // Show the install button
      setInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      // Clear the deferredPrompt so it can be garbage collected
      deferredPrompt = null;
      // Hide the install button
      setInstallable(false);
      console.log('PWA was installed');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, discard it
    deferredPrompt = null;
    // Hide the install button
    setInstallable(false);
  };

  if (!installable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50"
    >
      Install App
    </Button>
  );
}
