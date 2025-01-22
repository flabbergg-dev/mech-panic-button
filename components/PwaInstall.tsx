'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

let deferredPrompt: any;

interface PwaInstallProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function PwaInstall(props: PwaInstallProps) {
  const [installable, setInstallable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      setInstallable(false);
      toast({
        title: 'Successfully installed',
        description: 'You can use this app offline',
        className: 'bg-green-500 text-white',
      });
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    setInstallable(false);
  };

  if (!installable) {
    return (
      <Button
        onClick={() => {
          if (!installable) {
          toast({
            title: 'Installation not available',
            description: 'To install this app, you must use a supported browser like Safari, Edge, or Chrome.',
            variant: 'destructive',
          })
            
            return;
          } else {
            handleInstallClick();
          }
        }}
        className={cn("z-50", props.className)}
      >
        {props.title}
        {props.children ? props.children : null}
      </Button>
    )
  }



  return (
    <Button
      onClick={handleInstallClick}
      className={cn("z-50", props.className)}
    >
      {props.title}
      {props.children ? props.children : null}
    </Button>
  );
}
