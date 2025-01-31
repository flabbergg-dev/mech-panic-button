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
        if (request.offers.length === 0) return null;

        // Sort offers by creation date (newest first)
        const sortedOffers = [...request.offers].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return (
          <div key={request.id} className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Service Request Offers</h3>
            <div className="grid gap-4">
              {sortedOffers.map((offer) => (
                <ServiceOfferCard
                  key={offer.id}
                  serviceRequestId={request.id}
                  mechanicName={`${offer.mechanic.user.firstName} ${offer.mechanic.user.lastName}`}
                  price={offer.price}
                  note={offer.note || undefined}
                  expiresAt={offer.expiresAt || undefined}
                  onOfferHandled={() => {
                    // You might want to refresh the page or update the UI here
                    window.location.reload()
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
