"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMechanicServiceRequests } from '@/hooks/useMechanicServiceRequests';
import { getActiveMechanicOfferAction } from "@/app/actions/getActiveMechanicOfferAction";
import { BalanceCard } from "@/components/cards/BalanceCard";
import { ServiceRequest } from "@/components/service/ServiceRequest";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { useIsUserSubscribed } from "@/hooks/useIsUserSubscribed";
import { Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServiceRequestsAction } from "@/app/actions/service/request/getServiceRequestsAction";
import { AnimatePresence, motion } from "framer-motion";
import { useGeolocation } from '@/hooks/useGeolocation';

type BookingWithService = {
  id: string;
  service: {
    id: string;
    client: {
      name: string;
    };
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    description: string;
  };
};

type MechanicHomeProps = {
  setActiveTab: (tab: string) => void;
  isApproved: boolean;
};

export const MechanicHome = ({ setActiveTab, isApproved }: MechanicHomeProps) => {
  const { user } = useUser();
  const { isSubscribed, subscriptionPlan } = useIsUserSubscribed();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState(0);
  
  const {
    location,
    error: locationError,
    isLoading: locationLoading
  } = useGeolocation();

  const {
    serviceRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useMechanicServiceRequests();

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!stripeConnectId) {
      console.log("No Stripe Connect ID available");
      return;
    }

    console.log("Fetching balance for Stripe Connect ID:", stripeConnectId);
    
    try {
      const response = await fetch('/api/stripe/connect-balance-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationAccount: stripeConnectId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from balance API:", errorText);
        throw new Error(`Failed to fetch balance: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Balance data:", data);
      
      if (isMounted.current) {
        setCurrentAvailableBalance(data.available || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      if (isMounted.current) {
        setCurrentAvailableBalance(0);
      }
    }
  }, [stripeConnectId]);

  const fetchStripeConnectId = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const response = await getStripeConnectId();
      if (!response) {
        console.info("No Stripe Connect ID available");
        return;
      }
      if (isMounted.current && response.stripeConnectId) {
        setStripeConnectId(response.stripeConnectId);
      }
    } catch (error) {
      console.error('Error fetching Stripe Connect ID:', error);
    }
  }, []);

  useEffect(() => {
    if (stripeConnectId) {
      fetchBalance();
    }
  }, [stripeConnectId, fetchBalance]);

  useEffect(() => {
    fetchStripeConnectId();
  }, [fetchStripeConnectId]);

  if (!user) {
    return <Loader title="Searching on the toolbox..." />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="relative inline-block h-12 w-12">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const handleSubscribe = () => {
    setActiveTab("settings");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {isSubscribed === null && (
        <Button
          onClick={handleSubscribe}
          className="sticky w-fit z-50 p-4 flex"
        >
          <Magnet size={24} />
          <span className="ml-2">Subscribe</span>
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Welcome, {user.firstName}!</h1>
       
      </div>

      {locationError && (
        <div className="text-red-500 p-4 rounded-lg bg-red-50 mb-4">
          Location error: {locationError}. Please enable location services to receive service requests.
        </div>
      )}

      {locationLoading ? (
        <div className="text-blue-500 p-4 rounded-lg bg-blue-50 mb-4">
          Getting your location...
        </div>
      ) : location && (
        <div className="text-green-500 p-4 rounded-lg bg-green-50 mb-4">
          Location active: Ready to receive service requests
        </div>
      )}

      <BalanceCard currentAvailableBalance={currentAvailableBalance} />

      {/* Only show loading state on initial load */}
      {requestsLoading && serviceRequests.length === 0 ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : requestsError ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          Error loading service requests: {requestsError.message}
        </div>
      ) : serviceRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <img
            src="/icons/car.svg"
            alt="no_request"
            className="w-24 h-24 invert dark:invert-0"
          />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">No Service Requests Available</h3>
            <p className="text-sm text-muted-foreground">
              You currently have no service requests. New requests will appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Requests ({serviceRequests.length})</h3>
            <ScrollArea
              className="h-[80dvh]w-full rounded-md "
            >
              <div className="space-y-4 pr-4">
                <AnimatePresence mode="popLayout">
                  {serviceRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="mb-4"
                      layout
                    >
                      <ServiceRequest
                        request={request}
                        isScheduled={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};
