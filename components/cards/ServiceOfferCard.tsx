import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { handleServiceOfferAction } from '@/app/actions/serviceOfferAction'
import { formatDistance } from 'date-fns'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

interface ServiceOfferCardProps {
  serviceRequestId: string
  mechanicName: string
  mechanicRating?: number
  price: number
  note?: string
  expiresAt?: Date
  onOfferHandled?: () => void
  userId: string
}

export function ServiceOfferCard({
  serviceRequestId,
  mechanicName,
  mechanicRating,
  price,
  note,
  expiresAt,
  onOfferHandled,
  userId
  
}: ServiceOfferCardProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleOffer = async (accepted: boolean) => {
    try {
      setIsLoading(true)
      const result = await handleServiceOfferAction(serviceRequestId, accepted)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      if (accepted) {
        // Create payment hold session
        const response = await fetch('/api/create-payment-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceRequestId,
            amount: price,
            userId
          }),
        })

        const session = await response.json()
        
        if (!session.success) {
          throw new Error('Failed to create payment session')
        }

        // Redirect to payment page
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        await stripe?.redirectToCheckout({ sessionId: session.sessionId })

        // The redirect URL in the Stripe session will handle the navigation back to the map
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
    <Card className="w-full max-w-md mx-auto ">
      <CardHeader className="">
        <CardTitle className="flex items-center justify-between space-x-2">
          <div>
            <span>Service Offer from {mechanicName}</span>
            {mechanicRating && (
              <span className="ml-2 text-sm text-muted-foreground">
                ★ {mechanicRating.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-xl font-bold">${price.toFixed(2)}</span>
        </CardTitle>
        <CardDescription>
          {expiresAt && (
            <div className="text-sm text-muted-foreground">
              Expires {formatDistance(expiresAt, new Date(), { addSuffix: true })}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      {note && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{note}</p>
        </CardContent>
      )}
      <CardFooter className="flex justify-end space-x-2">
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
          Accept Offer
        </Button>
      </CardFooter>
    </Card>
  )
}
