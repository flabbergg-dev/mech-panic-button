import React, { useEffect } from 'react'
import { HalfSheet } from "../ui/HalfSheet";
import { MechanicDocuments } from './mechanic-documents';
import { StripeOnboarding } from '../StripeComponents/StripeOnboarding';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface MechanicOnboardingProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    make: string;
    model: string;
    year: number;
    license: string;
  };
  currentStep: "documents" | "StripeAccountSetup";
  setCurrentStep: (step: "documents" | "StripeAccountSetup") => void;
  stripeConnectId: string | null;
  setStripeConnectId: (stripeConnectId: string) => void;
}

export const MechanicOnboarding = ({formData, currentStep, setCurrentStep, stripeConnectId, setStripeConnectId}: MechanicOnboardingProps) => {

    const renderedContent = React.useMemo(
      () => (
        <HalfSheet className="bg-white border-t rounded-t-xl " >
          {currentStep === "StripeAccountSetup" && (
            <div className="min-h-[90svh] overflow-hidden">
            <Button variant="ghost" className="absolute top-4 right-4 z-50" onClick={() => window.location.reload()}><X className="h-4 w-4 text-black" /></Button>
            <StripeOnboarding
              setCurrentStep={setCurrentStep}
              stripeConnectId={stripeConnectId}
              setStripeConnectId={setStripeConnectId}
              />
              </div>
          )}
          {currentStep === "documents" && (
            <>
            <Button onClick={() => setCurrentStep("StripeAccountSetup")}>Back</Button>
            <MechanicDocuments
              formData={formData}
              stripeConnectId={stripeConnectId}
              />
              </>
          )}
        </HalfSheet>
      ),
      [
        currentStep,
        formData,
        stripeConnectId,
        setCurrentStep,
        setStripeConnectId,
      ]
    );

    return renderedContent;
}
