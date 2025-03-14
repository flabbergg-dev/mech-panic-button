"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { redirect, useParams, useRouter, useSearchParams } from 'next/navigation'
import { HalfSheet } from '@/components/ui/HalfSheet'
import { ServiceCardLayout } from '@/components/layouts/ServiceCard.Card.Layout'
import { Button } from '@/components/ui/button'
import { useEmailNotification } from '@/hooks/useEmailNotification'
import { updateServiceRequestStatusAction } from '@/app/actions/updateServiceRequestStatusAction'
import { Loader2Icon, Copy, Check, Navigation, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { getUserToken } from '@/app/actions/getUserToken'
import { supabase } from '@/utils/supabase/client'
import { getServiceRequestAction } from '@/app/actions/getServiceRequestAction'
import type { ServiceRequest, User } from '@prisma/client'
import { Loader } from '@/components/loader'
import { PinInput } from '@/components/ui/PinInput'
import { verifyCompletionCodeAction } from '@/app/actions/verifyCompletionCodeAction'
import { updateMechanicLocation } from '@/app/actions/updateMechanicLocation'
import { ChatBox } from '@/components/Chat/ChatBox'
import ServiceRequestMap from '@/components/MapBox/ServiceRequestMap'
import type { JsonValue } from '@prisma/client/runtime/library'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import useMechanicId from '@/hooks/useMechanicId'
import { AdditionalServicesModal } from '@/components/Modal/AdditionalServicesModal'
import { toast } from 'sonner'

interface Location {
  latitude: number
  longitude: number
}

type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

const FETCH_THROTTLE_MS = 5000; // Minimum time between fetches (5 seconds)
const UPDATE_INTERVAL = 60000; // 60 seconds between location updates
const MIN_DISTANCE_CHANGE = 0.0003; // ~30 meters threshold for location updates
const LOCATION_TIMEOUT = 30000; // 30 seconds timeout for location requests
const MAX_LOCATION_AGE = 30000; // 30 seconds maximum age for cached positions

const MechanicMapPage = () => {
  // Refs for managing data fetching and cleanup
  const isMounted = useRef(true);
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const watchId = useRef<number | null>(null);
  const lastLocationUpdateTime = useRef(0);
  const pendingLocationUpdate = useRef<boolean>(false);
  const locationState = useRef<Location | null>(null);

  const params = useParams()
  const searchParams = useSearchParams()
  const { id: requestId } = params
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')
  const { sendEmail } = useEmailNotification();
  const [isLoading, setIsLoading] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [showMechanicLocation, setShowMechanicLocation] = useState(false)
  const [key, setKey] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [mechanicLocation, setMechanicLocation] = useState<Location | null>(null)
  const [arrivalCode, setArrivalCode] = useState<string | null>(null);
  const [completionCode, setCompletionCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [request, setRequest] = useState<ServiceRequestWithClient | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const router = useRouter()
  const mechanicId = useMechanicId()
  // Cleanup effect
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Define customer location early
  const customerLocation = destLat && destLng ? {
    longitude: Number(destLng),
    latitude: Number(destLat),
  } : null;

  // Memoize fetchData to prevent unnecessary re-renders and add throttling
  const fetchData = useCallback(async (force = false) => {
    try {
      if (!requestId) return;

      const now = Date.now();
      // Skip if we're already fetching or if it's been less than FETCH_THROTTLE_MS since the last fetch
      // unless force=true is passed
      if (
        isFetching.current || 
        (!force && now - lastFetchTime.current < FETCH_THROTTLE_MS)
      ) {
        return;
      }

      isFetching.current = true;
      setIsLoading(true);
      
      const result = await getServiceRequestAction(requestId.toString());
      
      lastFetchTime.current = Date.now();
      
      if (!result.success) {
        toast("Failed to fetch service request details");
        redirect("/dashboard/mechanic");
      }

      if (result.data) {
        setRequest(result.data);
      }
    } catch (error) {
      console.error("Error fetching service request:", error);
      toast("Failed to fetch service request details");
      redirect("/dashboard/mechanic");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [requestId]);

  // Only fetch data once on initial load
  useEffect(() => {
    fetchData(true); // Force initial fetch
    
    // Set up Supabase subscription for real-time updates
    const setupRealtimeSubscription = async () => {
      if (!requestId) return;
      
      const token = await getUserToken();
      if (!token) {
        console.error("No token available");
        return;
      }
      
      supabase.realtime.setAuth(token);
      
      const subscribeServiceRequestToChannel = supabase.channel(`service_request_${requestId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'ServiceRequest', 
            filter: `id=eq.${requestId}` 
          }, 
          (payload: RealtimePostgresChangesPayload<ServiceRequest>) => {
            fetchData(true); // Force fetch on real-time update
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscribeServiceRequestToChannel);
      };
    };
    
    setupRealtimeSubscription();
  }, [fetchData, requestId]);

  // Memoize the startLocationTracking function
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isMounted.current) return;
        
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setMechanicLocation(newLocation);
        setIsGettingLocation(false);
      },
      (error) => {
        if (!isMounted.current) return;
        
        console.error("Error getting position:", error);
        const errorMessage = getLocationErrorMessage(error);
        toast(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  // Start location tracking when component mounts if in PAYMENT_AUTHORIZED state
  useEffect(() => {
    if (request?.status === "PAYMENT_AUTHORIZED") {
      startLocationTracking();
    }
  }, [request?.status, startLocationTracking]);

  // Memoize status state updates to prevent unnecessary re-renders
  const updateRequestStatus = useCallback((newLocation: Location) => {
    if (!isMounted.current || !request) return;
    
    // Only update if values have actually changed
    setRequest(prevRequest => {
      if (!prevRequest) return prevRequest;
      
      // Check if location has actually changed
      const currentLocation = prevRequest.mechanicLocation as unknown as Location | null;
      if (currentLocation && 
          JSON.stringify(currentLocation) === JSON.stringify(newLocation)) {
        return prevRequest;
      }

      // Convert location to a proper JSON object
      const jsonLocation = {
        ...newLocation,
        __type: 'Location'  // Add a type marker to help with type checking
      };

      // Return new request object with updated location while preserving all other fields
      return {
        ...prevRequest,
        mechanicLocation: jsonLocation as unknown as JsonValue
      };
    });
  }, [request]);

  // Handle request status changes
  useEffect(() => {
    const status = request?.status;
    
    
    if (!status) return;
    
    const shouldShowRouteAndLocation = 
      status === "IN_ROUTE" || 
      status === "PAYMENT_AUTHORIZED";
    
    if (shouldShowRouteAndLocation) {
      // Ensure state updates happen synchronously
      setShowRoute(true);
      setShowMechanicLocation(true);
      
      if (status === "IN_ROUTE") {
        startLocationTracking();
      }
    }
  }, [request?.status, startLocationTracking]);

  // Helper function to get location error message
  const getLocationErrorMessage = useCallback((error: GeolocationPositionError | null) => {
    if (!error) return "Unknown location error";
    
    switch (error.code) {
      case 1:
        return "Location access denied. Please enable location services in your browser settings.";
      case 2:
        return "Location information is unavailable. Please check your device's GPS settings.";
      case 3:
        return "Location request timed out. Please try again.";
      default:
        return `Error getting position: ${JSON.stringify(error)}`;
    }
  }, []);

  // Location watching effect with optimized updates
  useEffect(() => {
    const isInRoute = request?.status === 'IN_ROUTE';
    if (!navigator.geolocation || !isInRoute) {
      return;
    }
    // Clear existing watcher if any
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
        // Reset update flags
    pendingLocationUpdate.current = false;
    // First try to get current position before starting the watch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted.current) return;
        const initialLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        locationState.current = initialLocation;
        updateRequestStatus(initialLocation);
      },
      (error) => {
        if (!isMounted.current) return;
        const errorMessage = getLocationErrorMessage(error);
        console.error("Initial location error:", errorMessage);
        toast(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: MAX_LOCATION_AGE
      }
    );
    
    const updateLocation = async (position: GeolocationPosition) => {
      if (!isMounted.current || pendingLocationUpdate.current || !request) return;
      
      try {
        const currentTime = Date.now();
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const currentLocation = locationState.current;
        const hasSignificantChange = !currentLocation || 
          Math.abs(currentLocation.latitude - newLocation.latitude) > MIN_DISTANCE_CHANGE || 
          Math.abs(currentLocation.longitude - newLocation.longitude) > MIN_DISTANCE_CHANGE;
            
        if (hasSignificantChange) {
          locationState.current = newLocation;
          updateRequestStatus(newLocation);

          if (currentTime - lastLocationUpdateTime.current >= UPDATE_INTERVAL) {
            if (!requestId || !isMounted.current) return;
            
            pendingLocationUpdate.current = true;
            const result = await updateMechanicLocation(requestId.toString(), newLocation);
            
            if (!isMounted.current) return;
            
            if (!result.success) {
              throw new Error(result.error);
            }
            lastLocationUpdateTime.current = currentTime;
          }
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error("Error updating mechanic location:", error);
        toast("Failed to update location in database");
      } finally {
        pendingLocationUpdate.current = false;
      }
    };

    // Start watching position with more lenient settings
    watchId.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        if (!isMounted.current) return;
        const errorMessage = getLocationErrorMessage(error);
        console.error("Location error:", errorMessage);
        toast(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: MAX_LOCATION_AGE
      }
    );
    
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [
    request,
    requestId,
    getLocationErrorMessage,
    updateRequestStatus,
  ]);

  const handleRouteCalculated = (duration: number, totalDistance: number) => {
    setEstimatedTime(duration);
    setDistance(Number((totalDistance / 1000).toFixed(1)));
  }

  const handleStartRoute = async () => {
    if (!requestId || !mechanicLocation) return;

    try {
      setIsLoading(true);
      const requestIdString = requestId.toString();
      const result = await updateServiceRequestStatusAction(requestIdString, 'IN_ROUTE');
      
      if (!result.success) {
        toast("Failed to start route");
        return;
      }

      // Update states synchronously
      setShowRoute(true);
      setShowMechanicLocation(true);
      startLocationTracking();

      toast("Route started. Navigation will begin.");

      // Send email notification to client
      try {
        if (!request) {
          toast("Client email not found");
          return;
        }
        await sendEmail({
          to: request.client.email,
          subject: "Mechanic En Route",
          message: `Your mechanic is on the way! Estimated arrival time: ${estimatedTime} minutes.`,
        });
        
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }

    } catch (error) {
      console.error("Error starting route:", error);
      toast('Failed to start route');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI/180;
    const φ2 = loc2.latitude * Math.PI/180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI/180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const isNearCustomer = mechanicLocation && customerLocation && 
    calculateDistance(mechanicLocation, customerLocation) <= 100; // Within 100 meters

  const handleArrival = async () => {
    if (!requestId) return
    
    // Ensure requestId is a string
    const requestIdString = requestId.toString()

    try {
      setIsLoading(true)
      const result = await updateServiceRequestStatusAction(requestIdString, 'IN_PROGRESS')
      
      if (!result.success) {
        toast("Failed to update status");
        return
      }

      if (!result.data?.arrivalCode) {
        toast("Failed to generate arrival code");
        return
      }
      // Store the arrival code
      setArrivalCode(result.data.arrivalCode)

      // The real-time subscription will handle the data refresh
      // No need to call fetchData here

      toast("Arrival code generated");
    } catch (error) {
      console.error("Error handling arrival:", error)
      toast("Failed to generate arrival code");
    } finally {
      setIsLoading(false)
    }
  }
 
  const handleEndService = async () => {
    try {
      setIsLoading(true);
      if (!requestId) {
        toast("Missing request ID");
        return;
      }
      
      // Ensure requestId is a string
      const requestIdString = requestId.toString();
      
      
      const result = await updateServiceRequestStatusAction(requestIdString, 'IN_COMPLETION');
      
      if (!result.success) {
        toast("Failed to update status");
        return;
      }
      
      // Check if completion code was generated
      if (!result.data?.completionCode) {
        toast("Failed to generate completion code");
        return;
      }
      
      // Store the completion code
      setCompletionCode(result.data.completionCode);
      
      // The real-time subscription will handle the data refresh
      // No need to call fetchData here
      
      toast("Service marked for completion. Please ask the client for the verification code.");
    } catch (error) {
      console.error("Error completing service:", error);
      toast("Failed to complete service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletionCode = async (code: string) => {
    if (!requestId) return
    
    // Ensure requestId is a string
    const requestIdString = requestId.toString()

    try {
      setIsVerifyingCode(true)

      const result = await verifyCompletionCodeAction(requestIdString, code)
      
      if (!result.success) {
        toast("Verification failed");
        return
      }

      toast("Service completed successfully");
      
      // The Real-time subscription will handle the data refresh
      // No need to call fetchData here
    } catch (error) {
      toast("Failed to verify code");
    } finally {
      setIsVerifyingCode(false)
    }
  }

  if (!customerLocation || !requestId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Invalid Route</h2>
          <p className="text-muted-foreground mt-2">Missing required parameters</p>
        </div>
      </div>
    )
  }
  
  if (!request) {
    return (
      <Loader title="Loading route" />
    )
  }

  if (request.status === "COMPLETED") {
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Service Completed</h2>
          <p className="text-muted-foreground mt-2">This service has already been completed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Map */}
      <div className="fixed inset-0 z-0">
        <ServiceRequestMap
          key={key}
          serviceRequest={{
            id: request.id,
            status: request.status,
            mechanicId: request.mechanicId ?? undefined,
          }}
          customerLocation={customerLocation}
          mechanicLocation={mechanicLocation ?? undefined}
          showMechanicLocation={showMechanicLocation}
          showRoute={showRoute}
          onRouteCalculated={handleRouteCalculated}
        />
      </div>

      {/* Controls */}
      <HalfSheet>
        {request.status === "IN_ROUTE" && (
          <ChatBox
            userId={request.clientId}
            className={"flex place-self-end m-4"}
          />
        )}
        <ServiceCardLayout>
          <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg rounded-lg border border-border/50 transform transition-all duration-300 ease-in-out">
            <h2 className="text-xl font-semibold mb-2">
              {request.status === "SERVICING"
                ? "Service in Progress"
                : "Navigation"}
            </h2>

            {/* Service Request Details */}
            <div className="space-y-4">
              {/* Route Information */}
              {showRoute && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-primary" />
                      <span className="font-medium">Route Information</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="text-lg font-semibold">
                        {distance !== null
                          ? `${distance} km`
                          : "Calculating..."}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">ETA</p>
                      <p className="text-lg font-semibold">
                        {estimatedTime !== null
                          ? `${Math.max(0, estimatedTime)} min`
                          : "Calculating..."}
                      </p>
                    </div>
                  </div>
                  {isNearCustomer && (
                    <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                      <p className="text-green-700 font-medium text-center">
                        You have arrived at the customer's location!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Information */}

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  {request?.status === "ACCEPTED" && (
                    <span className="text-yellow-500">Payment Pending</span>
                  )}
                  {request?.status === "PAYMENT_AUTHORIZED" && (
                    <span className="text-blue-500">
                      Waiting for you to start the service...
                    </span>
                  )}
                  {request?.status === "IN_ROUTE" && (
                    <div className="flex items-center gap-2">
                      <Navigation className="text-green-600 animate-pulse" />
                      <span className="text-green-600">
                        {estimatedTime !== null && estimatedTime <= 0 ? (
                          "Arrived at destination"
                        ) : (
                          <>
                            On the way{" "}
                            {estimatedTime !== null &&
                              `- ETA: ${Math.max(0, estimatedTime)} minutes`}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  {request?.status === "SERVICING" && (
                    <span className="text-yellow-500">Service in progress</span>
                  )}
                  {request?.status === "IN_PROGRESS" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="text-green-600" />
                      <span className="text-green-600">
                        Service in progress
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {request.status === "PAYMENT_AUTHORIZED" && (
                  <Button
                    className={cn(
                      "w-full",
                      (isLoading || isGettingLocation) && "cursor-not-allowed"
                    )}
                    onClick={handleStartRoute}
                    disabled={
                      isLoading || !mechanicLocation || isGettingLocation
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : isGettingLocation ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Getting location...
                      </>
                    ) : !mechanicLocation ? (
                      "Location unavailable"
                    ) : (
                      "Start Route"
                    )}
                  </Button>
                )}

                {/* Arrival Button */}
                {!isLoading &&
                  !arrivalCode &&
                  showRoute &&
                  request.status === "IN_ROUTE" && (
                    <Button
                      onClick={handleArrival}
                      className="w-full"
                      variant={isNearCustomer ? "default" : "outline"}
                      disabled={!isNearCustomer || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isNearCustomer ? (
                        "I've Arrived"
                      ) : distance !== null ? (
                        distance === 0 ? (
                          "You have arrived"
                        ) : (
                          `${Math.max(0, distance).toFixed(1)}km away from customer`
                        )
                      ) : (
                        "Calculating distance..."
                      )}
                    </Button>
                  )}

                {arrivalCode && request.status === "IN_PROGRESS" && (
                  <Card className="w-full bg-card/80 text-card-foreground backdrop-blur-sm shadow-lg p-4 rounded-lg border-none transform transition-all duration-300 ease-in-out">
                    <h3 className="text-lg font-semibold mb-2 text-start">
                      Arrival Code
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-center">
                        {arrivalCode}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(arrivalCode);
                          setIsCopied(true);
                          toast("Arrival code copied to clipboard");
                          setTimeout(() => setIsCopied(false), 1000);
                        }}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Share this code with your client to begin service
                    </p>
                  </Card>
                )}

                {request.status === "SERVICING" && (
                  <>
                    <Button
                      onClick={handleEndService}
                      className={cn(
                        "w-full",
                        isLoading && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        "Complete Service"
                      )}
                    </Button>
                    <AdditionalServicesModal
                      serviceRequestId={request.id}
                      isLoading={isLoading}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </ServiceCardLayout>
      </HalfSheet>
      {request.status === "IN_COMPLETION" && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
          <div className="flex flex-col h-full p-6">
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-semibold">
                  Enter Completion Code
                </h2>
                <p className="text-muted-foreground">
                  Please enter the 6-digit code provided by your client to
                  complete the service
                </p>
                <div className="mt-8">
                  <PinInput onComplete={handleCompletionCode} />
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
    </div>
  );
}

export default MechanicMapPage
