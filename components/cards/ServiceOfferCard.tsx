import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { handleServiceOfferAction } from '@/app/actions/serviceOfferAction'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from "next/navigation";
import { updateServiceRequestByIdAction } from '@/app/actions/service/request/updateServiceRequestByIdAction'
import { getServiceOfferStatusAction } from '@/app/actions/service/offer/getServiceOfferStatusAction'
import { calculateEstimatedTime } from '@/utils/location';
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Location {
  longitude: number
  latitude: number
}

interface ServiceOfferCardProps {
  serviceRequestId: string
  mechanicId: string
  mechanicName: string
  mechanicRating?: number
  mechanicConnectId: string | null | undefined
  price: number
  note?: string
  expiresAt?: Date
  onOfferHandled?: () => void
  userId: string
  mechanicLocation: {
    longitude: number
    latitude: number
  } | null
  customerLocation: {
    longitude: number
    latitude: number
  } | null
}

export function ServiceOfferCard({
  serviceRequestId,
  mechanicId,
  mechanicConnectId,
  mechanicName,
  mechanicRating,
  price,
  note,
  expiresAt,
  onOfferHandled,
  userId,
  mechanicLocation,
  customerLocation
}: ServiceOfferCardProps) {
  const [error, setError] = useState(false);
  const [sessionId, setSessionId] = useState();
  const [secret, setSecret] = useState();
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [firstName, lastName] = mechanicName.split(' ')
  const [mechanicUserId, setMechanicUserId] = useState("")
  const [offerAccepted, setOfferAccepted] = useState(false)
  const [expirationTime, setExpirationTime] = useState<string | null>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  interface SessionDetails {
    payment_status: string;
  }
  const [sessionDetailsObject, setSessionDetailsObject] = useState<SessionDetails | null>(null);
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id")

  // Get mechanic user
  useEffect(() => {
    const checkOfferStatus = async () => {
      try {
        const response = await getServiceOfferStatusAction(serviceRequestId);
        if (response.success) {
          setOfferAccepted(response.isAccepted);
        }
      } catch (error) {
        console.error("Error checking offer status:", error);
      }
    };

    checkOfferStatus();
  }, [serviceRequestId]);

  // Update service request
  useEffect(() => {
    const catchSearhOnPayment = async () => {
      try {
        const response = await updateServiceRequestByIdAction(serviceRequestId, "PAYMENT_AUTHORIZED")

        if(!response.success) return

        setPaymentCompleted(response.success)
      } catch (error) {
        console.error("Error updating service request:", error)
      }
    }
 
    if(sessionIdParam) {
      catchSearhOnPayment()
    }
  }, [sessionIdParam, serviceRequestId])

  // Get estimated time
  useEffect(() => {
    const getEstimatedTime = async () => {
      try {
        console.log("Debug: Location data in ServiceOfferCard:", {
          mechanicLocation,
          customerLocation,
          hasValidMechanicLocation: mechanicLocation && 'latitude' in mechanicLocation && 'longitude' in mechanicLocation,
          hasValidCustomerLocation: customerLocation && 'latitude' in customerLocation && 'longitude' in customerLocation
        });

        if (!mechanicLocation || !customerLocation) {
          console.error("Debug: Missing location data");
          setEstimatedTime("Location data unavailable");
          return;
        }

        if (!('latitude' in mechanicLocation) || !('longitude' in mechanicLocation) ||
            !('latitude' in customerLocation) || !('longitude' in customerLocation)) {
          console.error("Debug: Invalid location format");
          setEstimatedTime("Invalid location format");
          return;
        }

        const time = await calculateEstimatedTime(mechanicLocation, customerLocation);
        setEstimatedTime(time);
      } catch (error) {
        console.error("Debug: Error in getEstimatedTime:", error);
        setEstimatedTime("Error calculating time");
      }
    };

    getEstimatedTime();
  }, [mechanicLocation, customerLocation]);

  {useEffect(() => {
    if (!expiresAt) return;

    const updateExpirationTime = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff <= 0) {
        setExpirationTime('Expired');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setExpirationTime(`Expires in ${minutes}m ${seconds}s`);
    };

    updateExpirationTime();
    const timer = setInterval(updateExpirationTime, 1000);

    return () => clearInterval(timer);
  }, [expiresAt])}

  const handleOffer = async (accepted: boolean) => {
    try {
      setIsLoading(true);
      const offerResponse = await handleServiceOfferAction(
        serviceRequestId,
        accepted
      );

      if (!offerResponse.success) {
        console.error("Error handling offer:", offerResponse.error);
        toast({
          title: 'Error',
          description: offerResponse.error as string,
        });
        setError(true);
        return;
      }

      // Set offer as accepted to show checkout button
      setOfferAccepted(true);
      
      // Call onOfferHandled to refresh the parent component
      if (onOfferHandled) {
        onOfferHandled();
      }
      
      toast({
        title: 'Success',
        description: 'Offer accepted! Please proceed to checkout.',
      });

    } catch (error) {
      console.error('Error handling offer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to handle offer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stripe/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceRequestId,
          amount: price,
          userId,
          mechanicConnectId,
        }),
      });
      
      const { sessionId, clientSecret, error } = await response.json();

      if (error) {
        console.error("Error creating transaction:", error);
        toast({
          title: 'Error',
          description: error,
        });
        setError(true);
        return;
      }

      if (sessionId) {
        setSessionId(sessionId);
        setSecret(clientSecret);
      }

    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (mechanicConnectId === null || mechanicConnectId === undefined) { return <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="w-full"
  >
    <Card className="p-4"> <span className="text-red-500"> Waiting for another mechanic.</span> </Card></motion.div> }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{firstName} {lastName}</h3>
              {mechanicRating && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm">{mechanicRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">${price}</p>
              {estimatedTime && (
                <p className="text-sm text-muted-foreground">
                  {estimatedTime} away
                </p>
              )}
            </div>
          </div>

          {note && (
            <p className="text-sm text-muted-foreground">{note}</p>
          )}

          {!offerAccepted ? (
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleOffer(false)}
                disabled={isLoading}
              >
                Decline
              </Button>
              <Button
                onClick={() => handleOffer(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Accept'
                )}
              </Button>
            </div>
          ) : !sessionId ? (
            <div className="flex justify-end">
              <Button
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </div>
          ) : secret ? (
            <div className="w-full">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret: secret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
