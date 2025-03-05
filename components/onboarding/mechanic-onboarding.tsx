import React, { useEffect } from 'react'
import { HalfSheet } from "../ui/HalfSheet";
import { MechanicDocuments } from './mechanic-documents';
import { StripeOnboarding } from '../StripeComponents/StripeOnboarding';

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
        <HalfSheet className="bg-background border-t rounded-t-xl p-6">
          {currentStep === "StripeAccountSetup" && (
            <StripeOnboarding
              setCurrentStep={setCurrentStep}
              stripeConnectId={stripeConnectId}
              setStripeConnectId={setStripeConnectId}
            />
          )}
          {currentStep === "documents" && (
            <MechanicDocuments
              formData={formData}
              stripeConnectId={stripeConnectId}
            />
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
