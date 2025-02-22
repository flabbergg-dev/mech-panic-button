import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { handleServiceOfferAction } from '@/app/actions/serviceOfferAction'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { getMechanicByIdAction } from '@/app/actions/mechanic/get-mechanic-by-id.action'
import { getUserAction } from '@/app/actions/user/get-user.action'
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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Location {
  latitude: number
  longitude: number
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
    latitude: number
    longitude: number
  } | null
  customerLocation: {
    latitude: number
    longitude: number
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
        await updateServiceRequestByIdAction(serviceRequestId)
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
      if (mechanicLocation && customerLocation) {
        const time = await calculateEstimatedTime(mechanicLocation, customerLocation);
        setEstimatedTime(time);
      }
    };
    getEstimatedTime();
  }, [mechanicLocation, customerLocation])

  // Handle offer
  const handleOffer = async (accepted: boolean) => {
    try {
      setIsLoading(true)

      if (!accepted) {
        // If declining the offer, just update the status
        try {
          await handleServiceOfferAction(
            serviceRequestId,
            accepted
          );
          if (onOfferHandled) {
            onOfferHandled()
          }
        } catch (error) {
          console.error("Error handling offer:", error);
          toast({
            title: 'Error',
            description: error as string,
          })
          setError(true);
        }
        return;
      }

      // Handle offer acceptance
      const offerResponse = await handleServiceOfferAction(
        serviceRequestId,
        accepted
      );

      if (!offerResponse.success) {
        console.error("Error handling offer:", offerResponse.error);
        toast({
          title: 'Error',
          description: offerResponse.error as string,
        })
        setError(true);
        return;
      }

      // Set offer as accepted to show checkout button
      setOfferAccepted(true);
      toast({
        title: 'Success',
        description: 'Offer accepted! Please proceed to checkout.',
      })

    } catch (error) {
      console.error('Error handling offer:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to handle offer',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false);
    }
  }
// Handle checkout
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/create-payment-session", {
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
      
      const { sessionDetails, session, sessionSecret, error } = await response.json();

      if (error) {
        console.error("Error creating transaction:", error);
        toast({
          title: 'Error',
          description: error,
        })
        setError(true);
        return;
      }

      if (sessionDetails) {
        setSessionDetailsObject(sessionDetails);
      }

      if (session) {
        setSessionId(session);
        console.log("Session ID:", session);
      }

      if (sessionSecret) {
        setSecret(sessionSecret);
      }

    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false);
    }
  }



  if (mechanicConnectId === null || mechanicConnectId === undefined) {
    return null
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{`${firstName[0]}${lastName[0]}`}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{mechanicName}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>★ {mechanicRating?.toFixed(1) || "4.8"}</span>
                <span className="mx-1">•</span>
                <span>{estimatedTime || "Calculating..."} </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">${(price).toFixed(2)}</p>
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Expires in {/* Add expiry calculation */}
              </p>
            )}
          </div>
        </div>

        {note && (
          <div
            className={`mt-4 text-sm text-muted-foreground ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {note}
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          {!offerAccepted ? (
            <>
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
                Accept
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Proceed to Checkout
            </Button>
          )}
        </div>
      </Card>
      {secret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: secret }}
        >
          <EmbeddedCheckout className="absolute top-0 bottom-0 left-0 right-0" />
        </EmbeddedCheckoutProvider>
      )}
      {sessionId && <p>Redirecting to checkout...</p>}
      {error && <p className="error">Something went wrong!</p>}
    </motion.div>
  )
}
