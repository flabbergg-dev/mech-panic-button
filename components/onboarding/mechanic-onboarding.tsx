import React, { useEffect } from 'react'
import { HalfSheet } from "../ui/HalfSheet";
import { MechanicDocuments } from './mechanic-documents';
import { StripeOnboarding } from '../StripeComponents/StripeOnboarding';

interface MechanicOnboardingProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  currentStep: "documents" | "StripeAccountSetup";
  setCurrentStep: (step: "documents" | "StripeAccountSetup") => void;
  stripeAccountId: string | null;
  setStripeAccountId: (stripeAccountId: string) => void;
}

export const MechanicOnboarding = ({formData, currentStep, setCurrentStep, stripeAccountId, setStripeAccountId}: MechanicOnboardingProps) => {

    useEffect(() => {
      if (stripeAccountId  != null) {
        setCurrentStep("documents");
        console.log("stripeAccountId:  " + stripeAccountId);
        console.log("currentStep:  " + currentStep);
      }
    }, [stripeAccountId, setCurrentStep, currentStep]);

    const renderedContent = React.useMemo(() => (
      <HalfSheet className="bg-background border-t rounded-t-xl p-6">
        {currentStep === "StripeAccountSetup" && (
          <StripeOnboarding
            setCurrentStep={setCurrentStep}
            stripeAccountId={stripeAccountId}
            setStripeAccountId={setStripeAccountId}
          />
        )}
        {currentStep === "documents" && (
          <MechanicDocuments
            formData={formData}
            stripeAccountId={stripeAccountId}
          />
        )}
      </HalfSheet>
    ), [currentStep, formData, stripeAccountId, setCurrentStep, setStripeAccountId]);

    return renderedContent;
}
