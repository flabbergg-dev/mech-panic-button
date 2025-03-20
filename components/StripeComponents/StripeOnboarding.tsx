import React, { useEffect, useState } from "react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

type StripeOnboardingProps = {
  stripeConnectId: string | null;
  setStripeConnectId: (stripeConnectId: string) => void;
  setCurrentStep: (step: "documents" | "StripeAccountSetup") => void;
};

export const StripeOnboarding = ({
  stripeConnectId,
  setStripeConnectId,
  setCurrentStep,
}: StripeOnboardingProps) => {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const stripeConnectInstance = useStripeConnect(stripeConnectId);
  const { toast } = useToast();

  const handleOnClickEvent = async () => {
    setAccountCreatePending(true);
    setError(false);
    // fix this fetch call
    await fetch("/api/stripe/account", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((json) => {
        setAccountCreatePending(false);
        const { account, error } = json;

        if (account) {
          setStripeConnectId(account);
        }

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
          toast({
            title: "Error",
            description: "An error occurred while creating your account",
            variant: "destructive",
          });
        }
      });
  };

  const handleExit = () => {
    setOnboardingExited(true);
    setCurrentStep("documents");
    toast({
      title: "Success",
      description: "Your account has been created",
    });
  };

  return (
    <div className="container h-[35dvh]">
      <div className="content">
        {stripeConnectId && !stripeConnectInstance && (
          <h2>Add information to start accepting money</h2>
        )}
        {!accountCreatePending && !stripeConnectId && (
          <div>
            <Button
              onClick={() => {
                handleOnClickEvent();
              }}
            >
              Start Onboarding
            </Button>
          </div>
        )}
        {stripeConnectInstance && (
          <div className="absolute inset-x-0 bottom-0 md:mb-6 max-h-[70svh]">
            <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
              <ConnectAccountOnboarding onExit={() => handleExit()} />
            </ConnectComponentsProvider>
          </div>
        )}
        {error && <p className="error">Something went wrong!</p>}
        {(stripeConnectId || accountCreatePending || onboardingExited) && (
          <div className="dev-callout">
            {/* {stripeConnectId && (
              <p>
                Your connected account ID is:{" "}
                <code className="bold">{stripeConnectId}</code>
              </p>
            )} */}
            {accountCreatePending && <p>Creating a connected account...</p>}
            {/* {onboardingExited && (
              <p>The Account Onboarding component has exited</p>
            )} */}
          </div>
        )}{" "}
      </div>
    </div>
  );
};
