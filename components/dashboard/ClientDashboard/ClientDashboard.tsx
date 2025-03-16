"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRealtimeServiceOffers } from '@/hooks/useRealtimeServiceOffers'
import { useRealtimeMechanicLocation } from '@/hooks/useRealtimeMechanicLocation'
import { useRealtimeServiceRequest } from '@/hooks/useRealtimeServiceRequest'
import { ServiceOfferCard } from '@/components/cards/ServiceOfferCard'
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Loader2, Loader2Icon } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { cancelServiceRequest } from '@/app/actions/cancelServiceRequestAction'
import { verifyArrivalCodeAction } from '@/app/actions/verifyArrivalCodeAction'
import { useToast } from "@/hooks/use-toast";
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader } from '@/components/loader'
import { SkeletonBasic } from '@/components/Skeletons/SkeletonBasic'
import SettingsPage from '../settings/Settings'
import { Profile } from '@/components/profile/Profile'
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceStatus, type ServiceRequest } from '@prisma/client'
import RequestMap from '@/components/MapBox/RequestMap'
import { HalfSheet } from '@/components/ui/HalfSheet'
import { ServiceCardLayout } from '@/components/layouts/ServiceCard.Card.Layout'
import { PinInput } from '@/components/ui/PinInput'
import { ChatBox } from '@/components/Chat/ChatBox'
import { calculateEstimatedTime } from '@/utils/location';
import { Booking } from '@/components/cards/Booking'
import { ReviewModal } from '@/components/reviews/ReviewModal'
import { getMechanicByIdAction } from '@/app/actions/mechanic/get-mechanic-by-id.action'
import { getStripeConnectId } from '@/app/actions/user/get-stripe-connect-id'

interface Location {
  latitude: number;
  longitude: number;
}

function isLocation(value: unknown): value is Location {
  return (
    typeof value === 'object' &&
    value !== null &&
    'latitude' in value &&
    'longitude' in value &&
    typeof (value as Location).latitude === 'number' &&
    typeof (value as Location).longitude === 'number'
  );
}

export function ClientDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const params = useSearchParams();
  const tab = params.get("tab");
  const path = usePathname();
  const userRole = path.includes("customer") ? "Customer" : "Mechanic";

  const { requests, offers, loading, error, refetch } =
    useRealtimeServiceOffers(user?.id || "");
  const {
    serviceRequest,
    serviceRequestLoading,
    serviceRequestError,
    refetchServiceRequest,
  } = useRealtimeServiceRequest(user?.id || "");
  const [activeTab, setActiveTab] = useState<string>(tab || "home");
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completedRequest, setCompletedRequest] =
    useState<ServiceRequest | null>(null);
  const [mechanicName, setMechanicName] = useState<string>("your mechanic");
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<string>>(
    new Set()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicConnectIds, setMechanicConnectIds] = useState<Map<string, string>>(new Map());
  const [refundCountdown, setRefundCountdown] = useState<Map<string, number>>(new Map());
  const [refundedRequests, setRefundedRequests] = useState<Set<string>>(new Set());
  const [activeMechanicUserId, setActiveMechanicUserId] = useState<string | null>(null);

  // Initialize reviewedRequestIds from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedIds = localStorage.getItem("reviewedRequestIds");
        if (storedIds) {
          setReviewedRequestIds(new Set(JSON.parse(storedIds)));
        }
      } catch (error) {
        console.error(
          "Error loading reviewed request IDs from localStorage:",
          error
        );
      }
    }
  }, []);

  // Save reviewedRequestIds to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && reviewedRequestIds.size > 0) {
      try {
        localStorage.setItem(
          "reviewedRequestIds",
          JSON.stringify(Array.from(reviewedRequestIds))
        );
      } catch (error) {
        console.error(
          "Error saving reviewed request IDs to localStorage:",
          error
        );
      }
    }
  }, [reviewedRequestIds]);

  // Function to fetch mechanic name
  const fetchMechanicName = useCallback(async (mechanicId: string | null) => {
    if (!mechanicId) return;

    try {
      const result = (await getMechanicByIdAction()) as {
        success: boolean;
        mechanic?: { user?: { firstName?: string; lastName?: string } };
      };
      if (result.success && result.mechanic?.user?.firstName) {
        setMechanicName(
          `${result.mechanic.user.firstName} ${result.mechanic.user.lastName || ""}`
        );
      }
    } catch (error) {
      console.error("Error fetching mechanic:", error);
    }
  }, []);

  // Get customer location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const updateEstimatedTime = useCallback(
    async (
      mechanicLocation: Location | null
    ) => {
      if (mechanicLocation) {
        const time = await calculateEstimatedTime(
          mechanicLocation,
          customerLocation
        );
        setEstimatedTime(time);
      }
    },
    [customerLocation]
  );

  // Helper function to check if a status is considered "active"
  const ACTIVE_STATUSES = [
    ServiceStatus.REQUESTED,
    ServiceStatus.ACCEPTED,
    ServiceStatus.PAYMENT_AUTHORIZED,
    ServiceStatus.IN_ROUTE,
    ServiceStatus.SERVICING,
    ServiceStatus.IN_PROGRESS,
    ServiceStatus.IN_COMPLETION,
    ServiceStatus.COMPLETED,
  ] as const;

  // Type guard to check if a status is an active status
  function isActiveStatus(
    status: ServiceStatus
  ): status is (typeof ACTIVE_STATUSES)[number] {
    return (ACTIVE_STATUSES as readonly ServiceStatus[]).includes(status);
  }

  // Check if there's an active request
  const activeRequestFound =
    serviceRequest ||
    requests.find((request: ServiceRequest) => isActiveStatus(request.status));

  useEffect(() => {
    if (activeRequestFound?.mechanicId) {
      const fetchMechanicName = async() => {
      const response = await getMechanicByIdAction();
      if(response.mechanic?.id) {
        setActiveMechanicUserId(response.mechanic?.id);
      }
    }

      fetchMechanicName();
    }

  }, [activeRequestFound]);

  // Fetch mechanic connect IDs with throttling
  const fetchMechanicConnectId = useCallback(async (mechanicId: string) => {
    if (!mechanicId || mechanicConnectIds.has(mechanicId)) return;

    try {
      const response = await getStripeConnectId(mechanicId);
      if (response?.stripeConnectId) {
        setMechanicConnectIds(prev => new Map(prev).set(mechanicId, response.stripeConnectId || ""));
      }
    } catch (error) {
      console.error("Error fetching mechanic connect ID:", error);
    }
  }, [mechanicConnectIds]);

  // Fetch connect IDs for all mechanics in offers
  useEffect(() => {
    const uniqueMechanicIds = Array.from(new Set(
      offers
        .map(offer => offer.mechanicId)
        .filter((id): id is string => !!id)
    ));

    for (const mechanicId of uniqueMechanicIds) {
      fetchMechanicConnectId(mechanicId);
    }
  }, [offers, fetchMechanicConnectId]);

  // Add debugging for requests and offers
  useEffect(() => {
    // Only log when data actually changes
    if (!loading) {
      console.log("ClientDashboard data:", {
        userId: user?.id,
        requestsCount: requests.length,
        offersCount: offers.length,
        serviceRequestFromHook: serviceRequest?.status,
        error,
      });
    }
  }, [
    requests.length,
    offers.length,
    loading,
    error,
    user?.id,
    serviceRequest?.status,
  ]);

  // Add debugging for active request
  useEffect(() => {
    if (!loading) {
      console.log("Active request detection:", {
        activeRequestFound: !!activeRequestFound,
        activeRequestId: activeRequestFound?.id,
        activeRequestStatus: activeRequestFound?.status,
        serviceRequestFromHook: serviceRequest?.status,
      });
    }
  }, [
    activeRequestFound?.id,
    activeRequestFound,
    loading,
    serviceRequest?.status,
  ]);

  // Check for recently completed requests that need a review
  useEffect(() => {
    // Only check for completed requests when not loading
    if (loading) return;

    const recentlyCompleted = requests.find(
      (request: ServiceRequest) =>
        request.status === ServiceStatus.COMPLETED &&
        request.mechanicId &&
        !reviewedRequestIds.has(request.id) // Don't show if we've already shown the modal for this request
    );

    if (recentlyCompleted  ) {
      if (!recentlyCompleted.mechanicId) return;
      console.log(
        "Found completed request needing review:",
        recentlyCompleted.id
      );

      // Check if this request already has a review
      const checkForExistingReview = async () => {
        try {
          const response = await fetch(
            `/api/reviews/check?serviceRequestId=${recentlyCompleted.id}`
          );
          const data = await response.json();

          if (!data.hasReview) {
            // Only show the review modal if there's no existing review
            console.log("No existing review found, showing review modal");

            // Mark this request as having shown the review modal
            setReviewedRequestIds(
              (prev) => new Set([...Array.from(prev), recentlyCompleted.id])
            );

            setCompletedRequest(recentlyCompleted);
            setShowReviewModal(true);
            fetchMechanicName(recentlyCompleted.mechanicId);
          } else {
            console.log("Existing review found, not showing review modal");
            // Still mark as reviewed to avoid checking again
            setReviewedRequestIds(
              (prev) => new Set([...Array.from(prev), recentlyCompleted.id])
            );
          }
        } catch (error) {
          console.error("Error checking for existing review:", error);
        }
      };

      checkForExistingReview();
    }
  }, [requests, fetchMechanicName, loading, reviewedRequestIds]);

  // Get mechanic's location updates when in route
  const { mechanicLocation } = useRealtimeMechanicLocation(
    activeRequestFound?.status === ServiceStatus.IN_ROUTE
      ? activeRequestFound.id
      : undefined
  );

  // Update ETA when mechanic location changes
  useEffect(() => {
    if (activeRequestFound?.status === ServiceStatus.IN_ROUTE && mechanicLocation) {
      updateEstimatedTime(mechanicLocation);
    }
  }, [mechanicLocation, activeRequestFound?.status, updateEstimatedTime]);

  // Initialize countdown when a request enters IN_ROUTE status
  useEffect(() => {
    if (activeRequestFound?.status === ServiceStatus.IN_ROUTE) {
      const requestId = activeRequestFound.id;
      
      try {
        // Check if we already have a stored countdown for this request
        const storedCountdownKey = `refund_countdown_${requestId}`;
        const storedStartTimeKey = `refund_start_time_${requestId}`;
        
        // Get stored start time if exists
        const storedStartTime = localStorage.getItem(storedStartTimeKey);
        
        if (storedStartTime) {
          // Calculate remaining time based on stored start time
          const startTimeMs = parseInt(storedStartTime, 10);
          const elapsedSeconds = Math.floor((Date.now() - startTimeMs) / 1000);
          const totalCountdownSeconds = 60; // 1 minute
          
          console.log(`Request ${requestId} - elapsed time: ${elapsedSeconds}s of ${totalCountdownSeconds}s`);
          
          if (elapsedSeconds < totalCountdownSeconds) {
            // Countdown still ongoing
            const remainingSeconds = totalCountdownSeconds - elapsedSeconds;
            setRefundCountdown(prev => new Map(prev).set(requestId, remainingSeconds));
            console.log(`Resuming countdown for request ${requestId}: ${remainingSeconds}s remaining`);
          } else {
            // Countdown already completed
            setRefundCountdown(prev => new Map(prev).set(requestId, 0));
            console.log(`Countdown for request ${requestId} already completed`);
          }
        } else if (!refundCountdown.has(requestId)) {
          // No stored countdown, start new one
          const startTime = Date.now();
          localStorage.setItem(storedStartTimeKey, startTime.toString());
          localStorage.setItem(storedCountdownKey, "60"); // 1 minute
          
          setRefundCountdown(prev => new Map(prev).set(requestId, 60));
          console.log(`Setting new countdown for request ${requestId} to 60 seconds`);
        }
      } catch (error) {
        console.error("Error managing countdown persistence:", error);
        // Fallback to in-memory only
        if (!refundCountdown.has(requestId)) {
          setRefundCountdown(prev => new Map(prev).set(requestId, 60));
        }
      }
    }
  }, [activeRequestFound?.status, activeRequestFound?.id]);

  // Persist refunded requests to localStorage
  useEffect(() => {
    if (refundedRequests.size > 0) {
      try {
        localStorage.setItem('refunded_requests', JSON.stringify(Array.from(refundedRequests)));
      } catch (error) {
        console.error("Error saving refunded requests to localStorage:", error);
      }
    }
  }, [refundedRequests]);

  // Load refunded requests from localStorage on mount
  useEffect(() => {
    try {
      const storedRefundedRequests = localStorage.getItem('refunded_requests');
      if (storedRefundedRequests) {
        setRefundedRequests(new Set(JSON.parse(storedRefundedRequests)));
      }
    } catch (error) {
      console.error("Error loading refunded requests from localStorage:", error);
    }
  }, []);

  // Handle countdown timer - using a more reliable approach with persistence
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefundCountdown(prev => {
        // Create new Map to ensure state update
        const newCountdown = new Map(prev);
        
        // Process each countdown
        let hasChanges = false;
        newCountdown.forEach((value, key) => {
          if (value > 0) {
            const newValue = value - 1;
            newCountdown.set(key, newValue);
            hasChanges = true;
            
            // Update localStorage as well to ensure persistence
            try {
              const countdownKey = `refund_countdown_${key}`;
              localStorage.setItem(countdownKey, newValue.toString());
              console.log(`Countdown for ${key}: ${newValue}s remaining (persisted)`);
            } catch (error) {
              console.error("Error updating countdown in localStorage:", error);
              console.log(`Countdown for ${key}: ${newValue}s remaining (memory only)`);
            }
            
            // If countdown just reached zero, log it
            if (newValue === 0) {
              console.log(`Countdown for ${key} completed!`);
            }
          }
        });
        
        // Only return new map if something changed
        return hasChanges ? newCountdown : prev;
      });
    }, 1000);

    // Cleanup interval on unmount
    return () => {
      console.log("Clearing countdown interval");
      clearInterval(intervalId);
    };
  }, []);

  // Force requests tab if there's an active request, or map tab if payment authorized
  useEffect(() => {
    if (activeRequestFound) {
      if (
        activeRequestFound.status === ServiceStatus.PAYMENT_AUTHORIZED ||
        activeRequestFound.status === ServiceStatus.IN_PROGRESS ||
        activeRequestFound.status === ServiceStatus.SERVICING ||
        activeRequestFound.status === ServiceStatus.IN_ROUTE ||
        activeRequestFound.status === ServiceStatus.IN_COMPLETION
      ) {
        setActiveTab("map");
      } else if (activeRequestFound.status !== ServiceStatus.COMPLETED) {
        setActiveTab("requests");
      }
    }
  }, [activeRequestFound]);

  const handleRequestCreated = () => {
    setActiveTab("requests");
    refetch(); // Refresh requests after creating a new one
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      // Call the server action to cancel the request
      const result = await cancelServiceRequest(requestId);

      if (result.success) {
        toast({
          title: "Request cancelled successfully",
          description: "Your request has been cancelled",
          className: "bg-green-500 text-white",
        });

        // Force a hard refresh of the page
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!activeRequestFound) return;

    try {
      setIsVerifyingCode(true);
      const result = await verifyArrivalCodeAction(activeRequestFound.id, code);

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Service started successfully",
      });
      refetchServiceRequest();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    setIsRefreshing(true);
    // Show loading indicator for at least 500ms to provide feedback
    const startTime = Date.now();

    // Refresh both service offers and service request
    Promise.all([refetch(), refetchServiceRequest()]).finally(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);
      // Set a small delay to show the animation
      setTimeout(() => setIsRefreshing(false), remainingTime);
    });
  };

  // Function to handle when an offer is accepted
  const handleOfferAccepted = useCallback(() => {
    console.log("Offer accepted, refreshing dashboard data");
    // Refresh both service offers and service request
    Promise.all([refetch(), refetchServiceRequest()])
      .then(() => {
        // After refreshing, check if we need to update the active tab
        if (activeRequestFound?.status === ServiceStatus.ACCEPTED) {
          setActiveTab("requests");
        }
      })
      .catch((error) => {
        console.error("Error refreshing after offer accepted:", error);
      });
  }, [refetch, refetchServiceRequest, activeRequestFound?.status]);

  const refreshOffers = async () => {
    setIsLoading(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      // Call the server action to accept the offer
      const result = await fetch(`/api/service-offer/${offerId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!result.ok) {
        throw new Error(
          `Failed to accept offer: ${result.status} ${result.statusText}`
        );
      }

      // The UI will update automatically through real-time subscription
    } catch (error) {
      console.error("Error accepting offer:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!activeRequestFound || !activeRequestFound.id) return;
    
    const currentCountdown = refundCountdown.get(activeRequestFound.id) ?? 0;
    if (currentCountdown > 0 || refundedRequests.has(activeRequestFound.id)) return;
    
    try {
      setIsLoading(true);
      // Call the server action to refund the service request
      const result = await fetch(`/api/stripe/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeRequestFound.firstTransactionId,
          requestId: activeRequestFound.id,
          clientId: activeRequestFound.clientId,
          mechanicId: activeRequestFound.mechanicId
        }),
      });

      if (!result.ok) {
        throw new Error(
          `Failed to refund service request: ${result.status} ${result.statusText}`
        );
      }

      setRefundedRequests(prev => new Set([...prev, activeRequestFound.id]));
      toast({
        title: "Refund Processed",
        description: "Your refund has been processed successfully",
        className: "bg-green-500 text-white",
      });
      
      // Cancel the request after successful refund
      await handleCancelRequest(activeRequestFound.id);
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a periodic refresh to check for new offers when on the requests tab
  useEffect(() => {
    // Only set up the interval if we're on the requests tab and have an active request
    if (
      activeTab === "requests" &&
      activeRequestFound &&
      activeRequestFound.status === ServiceStatus.REQUESTED
    ) {
      console.log("Setting up periodic refresh for offers");

      // Refresh every 15 seconds to check for new offers
      const intervalId = setInterval(() => {
        console.log("Periodic refresh for offers triggered");
        refetch();
        refetchServiceRequest();
      }, 15000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [activeTab, activeRequestFound, refetch, refetchServiceRequest]);

  if (!user) {
    return <Loader title="Loading Your Dashboard..." />;
  }

  const isLoadingData = loading && requests.length === 0;

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex items-center  min-h-screen flex-col space-y-6">
            <div className="relative z-10 w-full max-w-md">
              <Card className="p-6 shadow-lg bg-card/80 backdrop-blur border border-card/10">
                <h1 className="text-2xl font-bold mb-4 text-center">
                  Welcome, {user.firstName}!
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                  Need mechanical assistance? We're here to help!
                </p>
              </Card>
            </div>
            <div className="hidden md:flex items-center justify-center w-full">
              <RippleComp>
                <MechPanicButton
                  onRequestCreated={handleRequestCreated}
                />
                {/* <MechPanicButtonLogo/> */}
              </RippleComp>
            </div>
            <Booking />
          </div>
        );
      case "map":
        return (
          <div className="relative min-h-screen">
            {/* Underlay Map */}
            <div className="fixed inset-0 z-0">
              <RequestMap />
            </div>

            {/* Content Overlay */}
            {activeRequestFound?.status === ServiceStatus.PAYMENT_AUTHORIZED && (
              <HalfSheet>
                <ServiceCardLayout>
                  <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg rounded-t-xl">
                    <h2 className="text-xl font-semibold mb-2">
                      Payment Authorized
                    </h2>
                    <p className="text-muted-foreground">
                      Waiting for mechanic to start their journey. You'll be
                      notified when they're on their way.
                    </p>
                  </div>
                </ServiceCardLayout>
              </HalfSheet>
            )}
            {activeRequestFound?.status === ServiceStatus.IN_ROUTE && (
              <HalfSheet>
                <ServiceCardLayout className="flex justify-between items-start relative gap-2">
                  <div className="flex justify-between items-start bg-background/80 backdrop-blur-sm p-4 shadow-lg border border-border/50 rounded-lg w-full">
                      <div className="flex flex-col justify-between items-start gap-2">
                          <h2 className="text-xl font-semibold mb-2">
                            Mechanic on their way
                          </h2>
                          <p className="text-muted-foreground">
                            {estimatedTime
                              ? `Mechanic will be there in ${estimatedTime}`
                              : "Calculating arrival time..."}
                          </p>

                        {!mechanicLocation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Waiting for mechanic's location...
                          </p>
                        )}
                      </div>
                      <div className="mt-4 space-y-2 flex flex-col items-center self-center">
                        {/* Dynamically render based on countdown state */}
                        {(() => {
                          const countdownValue = refundCountdown.get(activeRequestFound.id) ?? 0;
                          console.log(`Rendering refund UI, countdown: ${countdownValue}`);
                          
                          if (countdownValue > 0) {
                            // During countdown, show wait message
                            return (
                              <div className="text-sm text-amber-600 font-medium rounded p-2 bg-amber-50 border border-amber-200">
                                You'll be eligible for a refund in {Math.floor(countdownValue / 60)}:{(countdownValue % 60).toString().padStart(2, '0')} if mechanic does not arrive in time
                              </div>
                            );
                          } else if (!refundedRequests.has(activeRequestFound.id)) {
                            // After countdown, show button if not already refunded
                            return (
                              <div className="space-y-2">
                                <div className="text-sm text-amber-600 font-medium rounded p-2 bg-amber-50 border border-amber-200">
                                  You're now eligible for a refund if mechanic does not arrive in time
                                </div>
                                <Button
                                  onClick={handleRefund}
                                  disabled={isLoading}
                                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  {isLoading ? (
                                    <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
                                  ) : null}
                                  Request Refund
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                  </div>
                  {activeRequestFound.mechanicId && (
                    <ChatBox divClassName="absolute right-[0.75rem] top-0" userId={activeRequestFound.clientId} />
                  )}
                </ServiceCardLayout>
              </HalfSheet>
            )}
            {activeRequestFound?.status === ServiceStatus.IN_PROGRESS && (
              <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
                <div className="flex flex-col h-full p-6">
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-center space-y-4 max-w-md">
                      <h2 className="text-2xl font-semibold">
                        Enter Arrival Code
                      </h2>
                      <p className="text-muted-foreground">
                        Please enter the 6-digit code provided by your mechanic
                        to start the service
                      </p>
                      <div className="mt-8">
                        <PinInput onComplete={handleVerifyCode} />
                      </div>
                      {isVerifyingCode && (
                        <div className="flex items-center justify-center mt-4">
                          <Loader2Icon className="animate-spin h-5 w-5 mr-2" />
                          <span>Verifying code...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeRequestFound?.status === ServiceStatus.SERVICING && (
              <HalfSheet>
                <ServiceCardLayout>
                  <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg border border-border/50">
                    <h2 className="text-xl font-semibold ">
                      Servicing in Progress{" "}
                    </h2>
                    <p className="text-muted-foreground mb-2 pb-4">
                      Wait for the mechanic to complete their service
                    </p>
                    {offers.filter((offers) => offers.status === 'PENDING').map((offer) => (
                    <ServiceOfferCard
                      key={offer.id}
                      serviceRequestId={offer.serviceRequestId}
                      mechanicId={offer.mechanicId || ""}
                      mechanicConnectId={offer.mechanicId ? mechanicConnectIds.get(offer.mechanicId) || "" : ""}
                      mechanicName={
                        offer.mechanic
                          ? `${offer.mechanic.firstName} ${offer.mechanic.lastName}`
                          : "Unknown Mechanic"
                      }
                      mechanicRating={offer.mechanic?.rating || undefined}
                      price={offer.price}
                      note={offer.note || undefined}
                      expiresAt={offer.expiresAt || undefined}
                      onOfferHandled={async () => {
                        try {
                          await acceptOffer(offer.id);
                          // The UI will update automatically through real-time subscription
                        } catch (error) {
                          console.error("Error accepting offer:", error);
                          // Handle error (show toast, etc.)
                        }
                      }}
                      userId={user.id}
                      mechanicLocation={mechanicLocation}
                      customerLocation={customerLocation}
                    />
                    ))}
                  </div>
                </ServiceCardLayout>
              </HalfSheet>
            )}
            {activeRequestFound?.status === ServiceStatus.IN_COMPLETION && (
              <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
                <div className="flex flex-col h-full p-6">
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-center space-y-4 max-w-md">
                      <h2 className="text-2xl font-semibold">
                        Service Completion Code
                      </h2>
                      <p className="text-muted-foreground">
                        Share this code with your mechanic to confirm service
                        completion
                      </p>
                      <div className="mt-8">
                        <div className="text-5xl font-bold tracking-[0.5em] bg-muted text-primary p-8 rounded-lg">
                          {/* TODO: Replace with Loading... */}
                          {activeRequestFound?.completionCode}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        The mechanic will input this code to mark the service as
                        completed and receive payment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRequestFound?.status === ServiceStatus.COMPLETED && (
              <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
                <div className="flex flex-col h-full p-6">
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-center space-y-4 max-w-md">
                      <h2 className="text-2xl font-semibold">
                        Service Completed
                      </h2>
                      <p className="text-muted-foreground">
                        Your service has been completed and the payment has been sent to mechanic
                      </p>
                    </div>
                  <button
                    className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                    onClick={() => {
                      setTimeout(() => {
                        window.location.reload();
                      }, 3000);
                    }}
                  >
                    Go home <Home className='h-4 w-4'/>
                  </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      case "requests":
        return (
          <div className="relative min-h-screen">
            {/* Map Container */}
            <div className="fixed inset-0">
              <RequestMap />
            </div>

            {/* Content Container */}
            <div className="relative z-10 space-y-6 p-4 pb-20">
              {process.env.NODE_ENV !== "production" && (
                <div className="bg-gray-100 p-2 mb-4 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">Debug Controls</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefresh}
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                    >
                      {isRefreshing ? (
                      <Loader2 className="animate-spin"/>
                      ) : (
                        <span>Refresh Requests</span>
                      )}
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            "/api/debug/service-requests"
                          );
                          const data = await response.json();
                          console.log("Debug service requests:", data);
                          alert(
                            `Found ${data.requestCount} requests. Check console for details.`
                          );
                        } catch (error) {
                          console.error("Debug request failed:", error);
                          alert(
                            "Debug request failed. Check console for details."
                          );
                        }
                      }}
                      className="bg-purple-500 text-white text-xs px-2 py-1 rounded"
                    >
                      Debug Requests
                    </Button>
                  </div>
                </div>
              )}
              {activeRequestFound &&
                activeRequestFound.status !== ServiceStatus.ACCEPTED &&
                activeRequestFound.status !== ServiceStatus.PAYMENT_AUTHORIZED && (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Active Request</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="flex items-center gap-1"
                      >
                        {isRefreshing ? (
                         <Loader2 className="animate-spin"/>
                        ) : (
                          <span>Refresh</span>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <Card className="bg-background/90 p-4">
                        <div className="flex justify-between items-start space-x-4">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold">
                              {offers.length === 0
                                ? "Waiting for mechanics..."
                                : `${offers.length} offer${offers.length === 1 ? "" : "s"} received`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {offers.length === 0
                                ? "Your request is being sent to nearby mechanics"
                                : "Review the offers below"}
                            </p>
                          </div>
                          <motion.div whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleCancelRequest(activeRequestFound.id)
                              }
                              className="transition-transform"
                            >
                              Cancel Request
                            </Button>
                          </motion.div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

              {activeRequestFound && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">
                      Mechanic Offers
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshOffers()}
                      className="flex items-center gap-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin"/>
                      ) : (
                        <span>Refresh</span>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {offers.map((offer) => {
                        // Ensure location objects have the correct shape using type guard
                        const mechanicLocation = isLocation(offer.location)
                          ? {
                              longitude: offer.location.longitude,
                              latitude: offer.location.latitude,
                            }
                          : null;

                        return (
                          <motion.div
                            key={offer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            layout
                          >
                            {!offer.mechanic ? (
                              <span className="text-red-500">
                                No mechanic found in this offer
                              </span>
                            ) : (
                              <ServiceOfferCard
                                key={offer.id}
                                serviceRequestId={offer.serviceRequestId}
                                mechanicId={offer.mechanicId || ""}
                                mechanicConnectId={offer.mechanicId ? mechanicConnectIds.get(offer.mechanicId) || "" : ""}
                                mechanicName={
                                  offer.mechanic
                                    ? `${offer.mechanic.firstName} ${offer.mechanic.lastName}`
                                    : "Unknown Mechanic"
                                }
                                mechanicRating={
                                  offer.mechanic?.rating || undefined
                                }
                                price={offer.price}
                                note={offer.note || undefined}
                                expiresAt={offer.expiresAt || undefined}
                                onOfferHandled={async () => {
                                  try {
                                    await acceptOffer(offer.id);
                                    // The UI will update automatically through real-time subscription
                                  } catch (error) {
                                    console.error(
                                      "Error accepting offer:",
                                      error
                                    );
                                    // Handle error (show toast, etc.)
                                  }
                                }}
                                userId={user.id}
                                mechanicLocation={mechanicLocation}
                                customerLocation={customerLocation}
                              />
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {!activeRequestFound && offers.length === 0 && (
                <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-lg text-muted-foreground">
                  No active requests or offers
                </div>
              )}
            </div>
          </div>
        );
      case "history":
        return <div>History Component (Coming Soon)</div>;
      case "settings":
        return (
          <Suspense fallback={<SkeletonBasic />}>
            <SettingsPage />
          </Suspense>
        );
      case "profile":
        return <Profile />;
      default:
        return (
          <div className="flex items-center  min-h-screen flex-col space-y-6">
            <div className="relative z-10 w-full max-w-md">
              <Card className="p-6 shadow-lg bg-card/80 backdrop-blur border border-card/10">
                <h1 className="text-2xl font-bold mb-4 text-center">
                  Welcome, {user.firstName}!
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                  Need mechanical assistance? We're here to help!
                </p>
              </Card>
            </div>
            <div className="flex items-center   justify-center min-h-[400px] w-full">
              <RippleComp>
                <MechPanicButton
                  onRequestCreated={handleRequestCreated}
                />
                {/* <MechPanicButtonLogo/> */}
              </RippleComp>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
      <BottomNavigation
        activeTab={activeTab}
        userRole={userRole}
        onTabChange={(tab) => {
          // Allow tab changes if:
          // 1. There's no active request
          // 2. Switching to requests tab
          // 3. Switching to map tab when payment is authorized
          if (
            !activeRequestFound ||
            tab === "requests" ||
            (tab === "map" &&
              activeRequestFound?.status === ServiceStatus.PAYMENT_AUTHORIZED)
          ) {
            setActiveTab(tab);
          }
        }}
        disabledTabs={
          activeRequestFound
            ? activeRequestFound.status === ServiceStatus.PAYMENT_AUTHORIZED
              ? ["home"] // Only disable home when payment authorized
              : ["map"] // Disable both when in other active states
            : [] // No disabled tabs when no active request
        }
        hiddenNavigation={
          activeRequestFound?.status === ServiceStatus.PAYMENT_AUTHORIZED ||
          activeRequestFound?.status === ServiceStatus.IN_ROUTE ||
          activeRequestFound?.status === ServiceStatus.IN_PROGRESS ||
          activeRequestFound?.status === ServiceStatus.SERVICING ||
          activeRequestFound?.status === ServiceStatus.IN_COMPLETION
        }
      />
      {showReviewModal && completedRequest && completedRequest.mechanicId && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            // Ensure this request doesn't trigger the modal again
            if (completedRequest) {
              setReviewedRequestIds(
                (prev) => new Set([...Array.from(prev), completedRequest.id])
              );
            }
          }}
          serviceRequestId={completedRequest.id}
          clientId={user.id}
          mechanicName={mechanicName}
        />
      )}
    </div>
  );
}