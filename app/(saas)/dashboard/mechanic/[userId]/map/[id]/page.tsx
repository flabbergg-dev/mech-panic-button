"use client"

import { useEffect, useState } from 'react'
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
import { ServiceRequest, User } from '@prisma/client'
import { Loader } from '@/components/loader'
import { PinInput } from '@/components/ui/PinInput'
import { verifyCompletionCodeAction } from '@/app/actions/verifyCompletionCodeAction'
import { updateMechanicLocation } from '@/app/actions/updateMechanicLocation'
import { useToast } from '@/hooks/use-toast'
import { RealtimePostgresChangesPayload } from '@/types/supabase'
import ServiceRequestMap from '@/components/MapBox/ServiceRequestMap'

interface Location {
  latitude: number
  longitude: number
}
type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

/**
 * Page for a mechanic to navigate to a client's location and complete a service request.
 * 
 * This page displays a map with the client's location and the mechanic's location.
 * The mechanic can start the service request by clicking a button.
 * Once the service request is started, the mechanic can click a button to indicate that they have arrived at the client's location.
 * After arriving, the mechanic can enter a code provided by the client to complete the service request.
 * If the code is valid, the service request is marked as completed.
 * 
 * @param {string} requestId - The ID of the service request.
 * @param {string} destLat - The latitude of the client's location.
 * @param {string} destLng - The longitude of the client's location.
 * @returns {JSX.Element} The page.
 */
export default function MechanicMapPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { id: requestId } = params
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')
  const { toast } = useToast()
  const { sendEmail } = useEmailNotification();
  const [isLoading, setIsLoading] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [showMechanicLocation, setShowMechanicLocation] = useState(false)
  const [key, setKey] = useState(0) // Add key for forcing re-renders
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

  // Define customer location early
  const customerLocation = destLat && destLng ? {
    longitude: parseFloat(destLng),
    latitude: parseFloat(destLat),
  } : null;

  const fetchData = async () => {
    try {
      if (!requestId) return;

      setIsLoading(true);
      const result = await getServiceRequestAction(requestId.toString());
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        redirect("/dashboard/mechanic");
      }

      if (result.data) {
        setRequest(result.data);
      }
    } catch (error) {
      console.error("Error fetching service request:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service request details",
        variant: "destructive",
      });
      redirect("/dashboard/mechanic");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId]);

  // Update showRoute based on request status
  useEffect(() => {
    console.log("Request status changed to:", request?.status);
    
    if (request?.status === "IN_ROUTE") {
      setShowRoute(true);
      setShowMechanicLocation(true);
      // Start location tracking if we're in route
      startLocationTracking();
    } else if (request?.status === "PAYMENT_AUTHORIZED") {
      // Make sure we're showing the mechanic location for PAYMENT_AUTHORIZED status
      setShowRoute(true);
      setShowMechanicLocation(true);
      // Refresh the map to ensure it updates with the new status
      if (request && customerLocation) {
        console.log("Refreshing map for PAYMENT_AUTHORIZED status");
        // Force a re-render of the map component
        setKey(prev => prev + 1);
      }
    }
  }, [request?.status, customerLocation]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting location tracking");
    
    // Get initial location immediately with a timeout
    const getInitialLocation = () => {
      return new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log("Initial location request timed out, continuing anyway");
          resolve();
        }, 5000);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeoutId);
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            
            console.log("Initial location obtained:", newLocation);
            setMechanicLocation(newLocation);
            
            // Store in localStorage as a fallback
            try {
              localStorage.setItem('lastKnownMechanicLocation', JSON.stringify(newLocation));
            } catch (e) {
              console.error("Failed to store location in localStorage:", e);
            }
            
            // Update location on server
            if (requestId) {
              try {
                await updateMechanicLocation(
                  requestId.toString(),
                  newLocation
                );
                console.log("Initial location updated on server");
              } catch (error) {
                console.error("Error updating initial location:", error);
              }
            }
            
            resolve();
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error("Error getting initial location:", error);
            
            // Try to use last known location from localStorage
            try {
              const storedLocation = localStorage.getItem('lastKnownMechanicLocation');
              if (storedLocation) {
                const parsedLocation = JSON.parse(storedLocation);
                console.log("Using last known location from localStorage:", parsedLocation);
                setMechanicLocation(parsedLocation);
                
                // Update on server
                if (requestId) {
                  updateMechanicLocation(
                    requestId.toString(),
                    parsedLocation
                  ).catch(e => console.error("Error updating with stored location:", e));
                }
              }
            } catch (e) {
              console.error("Error retrieving stored location:", e);
            }
            
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        );
      });
    };
    
    // Get initial location before starting watch
    getInitialLocation().then(() => {
      // Then start continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Only update if location has changed significantly
          if (!mechanicLocation || 
              Math.abs(mechanicLocation.latitude - newLocation.latitude) > 0.0001 || 
              Math.abs(mechanicLocation.longitude - newLocation.longitude) > 0.0001) {
            
            console.log("Location updated:", newLocation);
            setMechanicLocation(newLocation);
            
            // Store in localStorage as a fallback
            try {
              localStorage.setItem('lastKnownMechanicLocation', JSON.stringify(newLocation));
            } catch (e) {
              console.error("Failed to store location in localStorage:", e);
            }
            
            // Update location on server
            if (requestId) {
              try {
                await updateMechanicLocation(
                  requestId.toString(),
                  newLocation
                );
              } catch (error) {
                console.error("Error updating location:", error);
              }
            }
          }
        },
        (error) => {
          const safeError = {
            code: error?.code || 0,
            message: error?.message || 'Unknown error',
            toString: () => JSON.stringify({
              code: error?.code,
              message: error?.message
            })
          };
          
          let errorMessage = "Unable to get your location. ";
          
          try {
            switch (safeError.code) {
              case 1: // PERMISSION_DENIED
                errorMessage += "Please enable location services in your browser settings.";
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage += "Location information is unavailable.";
                break;
              case 3: // TIMEOUT
                errorMessage += "Location request timed out.";
                break;
              default:
                errorMessage += `An unknown error occurred (${safeError.message}).`;
            }
            
            console.error("Error getting location:", safeError.toString());
          } catch (e) {
            console.error("Error while handling location error:", e);
            errorMessage += "An unexpected error occurred while processing location.";
          }
          
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          // Try to use last known location from localStorage
          try {
            const storedLocation = localStorage.getItem('lastKnownMechanicLocation');
            if (storedLocation) {
              const parsedLocation = JSON.parse(storedLocation);
              console.log("Using last known location from localStorage after error:", parsedLocation);
              
              // Only set if we don't already have a location
              if (!mechanicLocation) {
                setMechanicLocation(parsedLocation);
                
                // Update on server
                if (requestId) {
                  updateMechanicLocation(
                    requestId.toString(),
                    parsedLocation
                  ).catch(e => console.error("Error updating with stored location:", e));
                }
              }
            }
          } catch (e) {
            console.error("Error retrieving stored location:", e);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // Increased from 15000 to 30000
          maximumAge: 10000 // Increased from 5000 to 10000
        }
      );
      
      // Store the watch ID for cleanup
      // setLocationWatchId(watchId);
    });
  };

  // Get mechanic's location and update database when IN_ROUTE
  useEffect(() => {
    if (!navigator.geolocation || request?.status !== 'IN_ROUTE') return;

    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 10000; // 10 seconds in milliseconds

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const currentTime = Date.now();
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Update local state
        setMechanicLocation(newLocation);

        // Update database every 10 seconds
        if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
          try {
            if (!requestId) return;
            const requestIdString = requestId.toString();
            const result = await updateMechanicLocation(requestIdString, newLocation);
            if (!result.success) {
              throw new Error(result.error);
            }
            lastUpdateTime = currentTime;

            // Fetch updated request to get the latest mechanic location
            const updatedRequest = await getServiceRequestAction(requestIdString);
            if (updatedRequest.success && updatedRequest.data) {
              setRequest(updatedRequest.data);
            }
          } catch (error) {
            console.error("Error updating mechanic location:", error);
            toast({
              title: "Update Error",
              description: "Failed to update location in database",
              variant: "destructive"
            });
          }
        }
      },
      (error) => {
        const safeError = {
          code: error?.code || 0,
          message: error?.message || 'Unknown error',
          toString: () => JSON.stringify({
            code: error?.code,
            message: error?.message
          })
        };
        
        let errorMessage = "Unable to get your location. ";
        
        try {
          switch (safeError.code) {
            case 1: // PERMISSION_DENIED
              errorMessage += "Please enable location services in your browser settings.";
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage += "Location information is unavailable.";
              break;
            case 3: // TIMEOUT
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += `An unknown error occurred (${safeError.message}).`;
          }
          
          console.error("Error getting location:", safeError.toString());
        } catch (e) {
          console.error("Error while handling location error:", e);
          errorMessage += "An unexpected error occurred while processing location.";
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased from 15000 to 30000
        maximumAge: 10000 // Increased from 5000 to 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [request?.status, requestId, toast])

  useEffect(() => {

    fetchData()
    // Starts listening for the service request after the arrival code is generated
    if (arrivalCode || completionCode) {
      const getToken = async () => {
        const token = await getUserToken()
        if (!token) {
          console.log("No token available")
          return
        }
        supabase.realtime.setAuth(token)
  
        const subscribeServiceRequestToChannel = supabase.channel(`service_request_${requestId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceRequest', filter: `id=eq.${requestId}`  }, (payload: RealtimePostgresChangesPayload) => {
          console.log('Request Received payload:', payload)
          fetchData()
  
        }).subscribe()
  
       
  
        const unsubscribeFromChannels = () => {
          supabase.removeChannel(subscribeServiceRequestToChannel)
        }
  
        return unsubscribeFromChannels
      }
  
      getToken()
    }
     
  }, [arrivalCode, completionCode])

  // Get initial mechanic location
  useEffect(() => {
    if (!navigator.geolocation || request?.status !== 'PAYMENT_AUTHORIZED') return;

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMechanicLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        const safeError = {
          code: error?.code || 0,
          message: error?.message || 'Unknown error',
          toString: () => JSON.stringify({
            code: error?.code,
            message: error?.message
          })
        };
        
        let errorMessage = "Unable to get your location. ";
        
        try {
          switch (safeError.code) {
            case 1: // PERMISSION_DENIED
              errorMessage += "Please enable location services in your browser settings.";
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage += "Location information is unavailable.";
              break;
            case 3: // TIMEOUT
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += `An unknown error occurred (${safeError.message}).`;
          }
          
          console.error("Error getting location:", safeError.toString());
        } catch (e) {
          console.error("Error while handling location error:", e);
          errorMessage += "An unexpected error occurred while processing location.";
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [request?.status]);

  const handleRouteCalculated = (duration: number, totalDistance: number) => {
    setEstimatedTime(duration);
    setDistance(totalDistance);
  }

  const handleStartRoute = async () => {
    if (!requestId || !mechanicLocation) return;

    try {
      setIsLoading(true);
      const requestIdString = requestId.toString();
      const result = await updateServiceRequestStatusAction(requestIdString, 'IN_ROUTE');
      
      if (!result.success) {
        toast({
          title: "Error",
          description: `Failed to start route: ${result.error}`,
          variant: "destructive",
        });
        return;
      }

      setShowRoute(true);
      setShowMechanicLocation(true);
      startLocationTracking();

      toast({
        title: "Success",
        description: "Route started. Navigation will begin.",
      });

      // Send email notification to client
      try {
        if (!request) {
          toast({
            title: "Error",
            description: "Client email not found",
            variant: "destructive",
          });
          return;
        }
        await sendEmail({
          to: request.client.email,
          subject: "Mechanic En Route",
          message: `Your mechanic is on the way! Estimated arrival time: ${estimatedTime} minutes.`,
        });
        
      } catch (error) {
        
      }

    } catch (error) {
      console.error("Error starting route:", error);
      toast({
        title: "Error",
        description: "Failed to start route. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: `#ERR10 : ${result.error}`,
          variant: "destructive",
        })
        return
      }

      if (!result.data?.arrivalCode) {
        toast({
          title: "Error",
          description: "#ERR11: Failed to generate arrival code",
          variant: "destructive",
        })
        return
      }
      // Store the arrival code
      setArrivalCode(result.data.arrivalCode)

      toast({
        title: "Success",
        description: "Share your arrival code with the client to begin service",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "#ERR09: Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
 
  const handleEndService = async () => {
    try {
      setIsLoading(true);
      if (!requestId) {
        toast({
          title: "Error",
          description: "Missing request ID",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure requestId is a string
      const requestIdString = requestId.toString();
      
      console.log("Completing service for request ID:", requestIdString);
      
      const result = await updateServiceRequestStatusAction(requestIdString, 'IN_COMPLETION');
      console.log("Service completion result:", result);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: `#ERR10 : ${result.error}`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if completion code was generated
      if (!result.data?.completionCode) {
        toast({
          title: "Error",
          description: "#ERR12: Failed to generate completion code",
          variant: "destructive",
        });
        return;
      }
      
      // Store the completion code
      setCompletionCode(result.data.completionCode);
      
      // Refresh data to update UI
      await fetchData();
      
      toast({
        title: "Success",
        description: "Service marked for completion. Please ask the client for the verification code.",
      });
    } catch (error) {
      console.error("Error completing service:", error);
      toast({
        title: "Error",
        description: "Failed to complete service",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: `Verification failed: ${result.error}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Service completed successfully",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      })
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
      router.push(`/dashboard`)
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
          serviceRequest={request}
          customerLocation={customerLocation}
          mechanicLocation={mechanicLocation ?? undefined}
          showMechanicLocation={showMechanicLocation}
          showRoute={showRoute}
          onRouteCalculated={handleRouteCalculated}
        />
      </div>

      {/* Controls */}
      <HalfSheet showToggle>
        <ServiceCardLayout>
          <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg rounded-lg border border-border/50 transform transition-all duration-300 ease-in-out">
            <h2 className="text-xl font-semibold mb-2">{request.status === "SERVICING" ? "Service in Progress" : "Navigation"}</h2>

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
                          ? `${(distance / 1000).toFixed(1)} km` 
                          : 'Calculating...'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">ETA</p>
                      <p className="text-lg font-semibold">
                        {estimatedTime !== null 
                          ? `${Math.max(0, estimatedTime)} min` 
                          : 'Calculating...'}
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
                    <span className="text-blue-500">Waiting for you to start the service...</span>
                  )}
                  {request?.status === "IN_ROUTE" && (
                    <div className="flex items-center gap-2">
                      <Navigation className="text-green-600 animate-pulse" />
                      <span className="text-green-600">
                        {estimatedTime !== null && estimatedTime <= 0 
                          ? "Arrived at destination" 
                          : <>
                              On the way{" "}
                              {estimatedTime !== null && `- ETA: ${Math.max(0, estimatedTime)} minutes`}
                            </>
                        }
                      </span>
                    </div>
                  )}
                  {request?.status === "SERVICING" && (
                    <span className="text-yellow-500">Service in progress</span>
                  )}
                  {request?.status === "IN_PROGRESS" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="text-green-600" />
                      <span className="text-green-600">Service in progress</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                { request.status === "PAYMENT_AUTHORIZED" && (
                <Button
                  className={cn(
                    "w-full",
                    (isLoading || isGettingLocation) && "cursor-not-allowed",
                    showRoute && "hidden"
                  )}
                  onClick={handleStartRoute}
                  disabled={isLoading || showRoute || !mechanicLocation || isGettingLocation}
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
                  ) : showRoute ? (
                    "Route Started"
                  ) : (
                    "Start Route"
                  )}
                </Button>)
                }

                {/* Arrival Button */}
                {!isLoading && !arrivalCode && showRoute && (
                  <Button 
                    onClick={handleArrival} 
                    className={cn(
                      "w-full",
                      !isNearCustomer && "opacity-50"
                    )}
                    disabled={!isNearCustomer}
                  >
                    {isNearCustomer ? (
                      "I've Arrived"
                    ) : distance !== null ? (
                      `${Math.max(0, (distance / 1000)).toFixed(1)}km away from customer`
                    ) : (
                      "Calculating distance..."
                    )}
                  </Button>
                )}
                
                {arrivalCode && request.status === "IN_PROGRESS" && (
                  <Card className="w-full bg-card/80 text-card-foreground backdrop-blur-sm shadow-lg p-4 rounded-lg border-none transform transition-all duration-300 ease-in-out">
                    <h3 className="text-lg font-semibold mb-2 text-start">Arrival Code</h3>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-center">{arrivalCode}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(arrivalCode)
                          setIsCopied(true)
                          toast({
                            title: "Copied!",
                            description: "Arrival code copied to clipboard",
                          })
                          setTimeout(() => setIsCopied(false), 1000)
                        }}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">Share this code with your client to begin service</p>
                  </Card>
                )}

                {request.status === "SERVICING" && (
                  <Button onClick={handleEndService} className={cn("w-full", isLoading && "cursor-not-allowed opacity-50")}>
                    {isLoading ? (<>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                    ) : ("Complete Service")}
                  </Button>
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
                     <h2 className="text-2xl font-semibold">Enter Completion Code</h2>
                     <p className="text-muted-foreground">
                       Please enter the 6-digit code provided by your client to complete the service
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
            ) }
    </div>
  )
}