import React, { useEffect, useState } from 'react'
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
  const [mechanicConnectId, setMechanicConnectId] = useState<string | null>(null)
  const [mechanicUserId, setMechanicUserId] = useState("")

  const handleOffer = async (accepted: boolean) => {
    try {
      setIsLoading(true)

      if (accepted) {
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
        const {session, sessionSecret, error} = await response.json()

        if (session) {
          setSessionId(session);
        }

        if (sessionSecret) {
          setSecret(sessionSecret);
          console.log(sessionSecret + "sessionSecret");
        }

        if (error) {
          console.error("Error creating account:", error);
          toast({
            title: 'Error',
            description: error,
          })
          setError(true);
        }

        if(response.ok) {
          const result = await handleServiceOfferAction(serviceRequestId, accepted);
    
          if (!result.success) {
            throw new Error(result.error);
          }
        }


      }

      if (onOfferHandled) {
        onOfferHandled()
      }
    } catch (error) {
      console.error('Error handling offer:', error)
      alert(error instanceof Error ? error.message : 'Failed to handle offer')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if(mechanicId) {
        const response = await getMechanicByIdAction(mechanicId!)
        setMechanicUserId(response.mechanic?.userId!);
        if (response) {
          const userResponse = await getUserAction(response.mechanic?.userId!)
          setMechanicConnectId(userResponse!.stripeCustomerId)
          console.log("Mechanic Connect ID: ", userResponse!.stripeCustomerId)
        }
      } else {
        console.error("No mechanic ID")
      }
    }

    fetchData()

  }, [mechanicUserId])

  return (
    <motion.div
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden bg-background/90 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={`https://avatar.vercel.sh/${firstName}.png`}
                />
                <AvatarFallback>
                  {firstName[0]}
                  {lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{firstName}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>★ {mechanicRating?.toFixed(1) || "4.8"}</span>
                  <span className="mx-1">•</span>
                  <span>{estimatedTime || "Calculating..."} Away</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${price.toFixed(2)}</div>
              {/* TODO: Add model name */}
              <div className="text-sm text-muted-foreground">
                Toyota Corolla
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOffer(false);
                  }}
                  disabled={isLoading}
                >
                  Decline
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOffer(true);
                  }}
                  disabled={isLoading}
                >
                  Accept Offer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
  );
}
