"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMechanicServiceRequests } from '@/hooks/useMechanicServiceRequests';
import type { ServiceRequest as PrismaServiceRequest } from "@prisma/client";
import { BalanceCard } from "@/components/cards/BalanceCard";
import { ServiceRequest } from "@/components/service/ServiceRequest";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/loader";
import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { useIsUserSubscribed } from "@/hooks/useIsUserSubscribed";
import { ArrowRightIcon, Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useGeolocation } from '@/hooks/useGeolocation';
import { BookingStatus, ServiceStatus } from "@prisma/client";
import { toast } from "sonner";
import { useMechanicBookingRequests } from "@/hooks/useMechanicBookingRequests";
import { Card } from "@/components/ui/card";
import { useMechanicNavigation } from "@/hooks/useMechanicNavigation.navigator";

interface ServiceRequestWithClient extends PrismaServiceRequest {
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
}

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

interface BalanceData {
  available: number;
  pending: number;
}

type MechanicHomeProps = {
  setActiveTab: (tab: string) => void;
  isApproved: boolean;
};

export const MechanicHome = ({ setActiveTab, isApproved }: MechanicHomeProps) => {
  const { user } = useUser();
  const { isSubscribed, subscriptionPlan } = useIsUserSubscribed();
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState<BalanceData>({
    available: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const { goToBookingRequest } = useMechanicNavigation()

  // Use geolocation hook with proper type handling
  const { latitude, longitude, error: locationError } = useGeolocation({
    minDistance: 30, // 30 meters minimum distance
    updateInterval: 60000, // 60 seconds update interval
    timeout: 10000 // 10 seconds timeout
  });

  // Convert geolocation state to location object
  const location = latitude !== null && longitude !== null 
    ? { coords: { latitude, longitude } } 
    : null;
  const locationLoading = !location && !locationError;

  const {
    serviceRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useMechanicServiceRequests();

  const {
    bookingRequests,
    isLoading: bookingLoading,
    error: bookingError,
    refetch: refetchBookings
  } = useMechanicBookingRequests();

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!stripeConnectId) {
      return;
    }

   
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

      const data = await response.json();
      
      if (isMounted.current) {
        setCurrentAvailableBalance({
          available: data.available || 0,
          pending: data.pending || 0
        });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      if (isMounted.current) {
        setCurrentAvailableBalance({
          available: 0,
          pending: 0
        });
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

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getStripeConnectId();
        if (!response?.stripeConnectId) {
          toast.error("fetching Stripe Connect ID failed");
          return;
        }

        const balanceResponse = await fetch("/api/stripe/connect-balance-funds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: response.stripeConnectId,
          }),
        });

        if (!balanceResponse.ok) {
          toast.error("fetching balance failed");
          return;
        }

        const data = await balanceResponse.json();
        
        if (isMounted.current) {
          setCurrentAvailableBalance({
            available: data.available || 0,
            pending: data.pending || 0
          });
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    if (locationError) {
      toast.error('The location service is not enabled. Please enable location services to receive service requests.');
    }
  }, [locationError]);

  // Define active service statuses
  const ACTIVE_SERVICE_STATUSES = [
    ServiceStatus.ACCEPTED,
    ServiceStatus.PAYMENT_AUTHORIZED,
    ServiceStatus.IN_ROUTE,
    ServiceStatus.SERVICING,
  ];

  type ActiveServiceStatus = typeof ACTIVE_SERVICE_STATUSES[number];

  // Helper function to check if a request has an active status
  const isActiveRequest = (request: ServiceRequestWithClient): boolean => {
    return ACTIVE_SERVICE_STATUSES.includes(request.status as ActiveServiceStatus);
  };

  if (!user) {
    return <Loader title="Searching on the toolbox..." />;
  }

  if (loading) {
    return (
      <>
          <Loader title="Loading..." />
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
      </>
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

      {/* Location Status */}
      {locationLoading ? (
        <div className="text-blue-500 p-4 rounded-lg bg-blue-50 mb-4">
          Getting your location...
        </div>
      ) : locationError ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50 mb-4">
          Location error: {locationError}. Please enable location services to receive service requests.
          <Button 
            className="text-blue-500 cursor-pointer ml-2" 
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                () => {}, 
                () => {},
                { timeout: 10000 } // 10 second timeout
              );
            }}
          >
            Enable location
          </Button>
        </div>
      ) : location && (
        <div className="text-green-500 p-4 rounded-lg bg-green-50 mb-4">
          Location active: Ready to receive service requests
        </div>
      )}

      <BalanceCard currentAvailableBalance={currentAvailableBalance} />

      {/* if mechanic is not approved */}
      <div className={isApproved ? "hidden" : "p-4 rounded-lg bg-red-50 mb-4 text-red-500"}>
        You must wait for approval from admin before you can receive service requests.
      </div>

      {/* Service Requests Section */}
      {requestsLoading && serviceRequests.length === 0 ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"/>
        </div>
      ) : requestsError ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          Error loading service requests: {requestsError.message}
        </div>
      ) : (
        <div className={isApproved ? "" : "hidden"}>
          {/* Available/New Requests */}
          {serviceRequests.filter(req => req.status === ServiceStatus.REQUESTED).length > 0 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Requests ({serviceRequests.filter(req => req.status === ServiceStatus.REQUESTED).length})</h3>
                <ScrollArea className="h-[40dvh] w-full rounded-md">
                  <div className="space-y-4 pr-4">
                    <AnimatePresence mode="popLayout">
                      {serviceRequests
                        .filter(req => req.status === ServiceStatus.REQUESTED)
                        .map((request) => (
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
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <img
                src="/icons/car.svg"
                alt="no_request"
                className="w-24 h-24 invert dark:invert-0"
              />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">No Service Requests Available</h3>
                <p className="text-sm text-muted-foreground">
                  You currently have no service requests. New requests will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* bookings Section */}
      {bookingLoading && bookingRequests.length === 0 ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"/>
        </div>
      ) : bookingError ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          Error loading bookings: {bookingError.message}
        </div>
      ) : (
        <div className={isApproved ? "" : "hidden"}>
          {/* Available/New Requests */}
          {bookingRequests.filter(req => req.status === BookingStatus.PENDING).length > 0 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bookings ({bookingRequests.filter(req => req.status === BookingStatus.PENDING).length})</h3>
                <ScrollArea className="h-[40dvh] w-full rounded-md">
                  <div className="space-y-4 pr-4">
                    <AnimatePresence mode="popLayout">
                      {bookingRequests
                        .filter(req => req.status === BookingStatus.PENDING)
                        .map((request) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4"
                            layout
                          >
                            <Card
                              className="p-4 hover:shadow-md transition-shadow bg-foreground text-background border-none pointer-events-auto cursor-pointer" 
                            >
                            <p className="text-sm text-muted-foreground">
                              {request.createdAt.toLocaleDateString()}
                            </p>
                            {/* <p className="text-sm text-muted-foreground">
                              {request.location}
                            </p> */}
                            <p className="text-sm text-muted-foreground">
                              {request.serviceType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.status}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToBookingRequest(request.id);
                              }}
                            >
                              <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                            </Card>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <img
                src="/icons/car.svg"
                alt="no_request"
                className="w-24 h-24 invert dark:invert-0"
              />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">No bookings Available</h3>
                <p className="text-sm text-muted-foreground">
                  You currently have no bookings. New requests will appear here.
                </p>
              </div>
            </div>
          )}
          

          {/* Confirmed/Active Requests */}
          {bookingRequests.filter(req => req.status === BookingStatus.CONFIRMED || req.status === BookingStatus.IN_ROUTE).length > 0 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bookings ({bookingRequests.filter(req => req.status === BookingStatus.CONFIRMED || req.status === BookingStatus.IN_ROUTE).length})</h3>
                <ScrollArea className="h-[40dvh] w-full rounded-md">
                  <div className="space-y-4 pr-4">
                    <AnimatePresence mode="popLayout">
                      {bookingRequests
                        .filter(req => req.status === BookingStatus.CONFIRMED || req.status === BookingStatus.IN_ROUTE)
                        .map((request) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4"
                            layout
                          >
                            <Card
                              className="p-4 hover:shadow-md transition-shadow bg-foreground text-background border-none pointer-events-auto cursor-pointer" 
                            >
                            <p className="text-sm text-muted-foreground">
                              {request.createdAt.toLocaleDateString()}
                            </p>
                            {/* <p className="text-sm text-muted-foreground">
                              {request.location}
                            </p> */}
                            <p className="text-sm text-muted-foreground">
                              {request.serviceType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.status}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToBookingRequest(request.id);
                              }}
                              disabled={request.status === BookingStatus.CONFIRMED}
                            >
                              <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                            </Card>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <img
                src="/icons/car.svg"
                alt="no_request"
                className="w-24 h-24 invert dark:invert-0"
              />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">No bookings Available</h3>
                <p className="text-sm text-muted-foreground">
                  You currently have no bookings. New requests will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>


  );
};
