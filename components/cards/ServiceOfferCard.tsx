import React from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { handleServiceOfferAction } from '@/app/actions/serviceOfferAction'
import { loadStripe } from '@stripe/stripe-js'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { getStripeCustomerId } from '@/app/actions/user/get-stripe-customer-id'

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
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [estimatedTime, setEstimatedTime] = React.useState<string | null>(null)
  const [firstName, lastName] = mechanicName.split(' ')

  const handleOffer = async (accepted: boolean) => {
    try {
      setIsLoading(true)
      const result = await handleServiceOfferAction(serviceRequestId, accepted)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      if (accepted) {
        const stripeConnectId = await getStripeCustomerId(mechanicId);
        if (!stripeConnectId) {
          throw new Error('Mechanic does not have a stripe account')
        } else {
          const response = await fetch('/api/create-payment-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceRequestId,
              amount: price,
              userId,
              stripeConnectId
            }),
          })
          const session = await response.json()
          if (!session.success) {
            throw new Error('Failed to create payment session')
          }
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
          await stripe?.redirectToCheckout({ sessionId: session.sessionId })
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
                <AvatarImage src={`https://avatar.vercel.sh/${firstName}.png`} />
                <AvatarFallback>{firstName[0]}{lastName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{firstName}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>★ {mechanicRating?.toFixed(1) || '4.8'}</span>
                  <span className="mx-1">•</span>
                  <span>{estimatedTime || 'Calculating...'} Away</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${price.toFixed(2)}</div>
              {/* TODO: Add model name */}
              <div className="text-sm text-muted-foreground">Toyota Corolla</div>
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
                    e.stopPropagation()
                    handleOffer(false)
                  }}
                  disabled={isLoading}
                >
                  Decline
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOffer(true)
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
    </motion.div>
  )
}
