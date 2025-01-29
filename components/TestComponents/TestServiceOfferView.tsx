"use client"
import React from 'react'
import { ServiceOffer, ServiceRequest, User, Mechanic } from '@prisma/client'
import { ServiceOfferCard } from '../cards/ServiceOfferCard'


type MechanicWithUser = Mechanic & {
  user: User
}

type ServiceOfferWithMechanic = ServiceOffer & {
  mechanic: MechanicWithUser
}

type ServiceRequestWithOffers = ServiceRequest & {
  offers: ServiceOfferWithMechanic[]
}

interface TestServiceOfferViewProps {
  serviceRequests: ServiceRequestWithOffers[]
}

export function TestServiceOfferView({ serviceRequests }: TestServiceOfferViewProps) {
  if (serviceRequests.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No offers available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {serviceRequests.map((request) => {
        const latestOffer = request.offers[0] // Assumes offers are ordered by createdAt desc
        if (!latestOffer) return null

        return (
          <ServiceOfferCard
            key={request.id}
            serviceRequestId={request.id}
            mechanicName={`${latestOffer.mechanic.user.firstName} ${latestOffer.mechanic.user.lastName}`}
            price={latestOffer.price}
            note={latestOffer.note || undefined}
            expiresAt={latestOffer.expiresAt || undefined}
            onOfferHandled={() => {
              // You might want to refresh the page or update the UI here
              window.location.reload()
            }}
          />
        )
      })}
    </div>
  )
}
