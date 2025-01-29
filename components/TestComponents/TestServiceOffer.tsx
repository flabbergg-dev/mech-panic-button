"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createServiceOfferAction } from '@/app/actions/serviceOfferAction'
import { ServiceRequest, User, ServiceType, ServiceStatus } from '@prisma/client'

type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

interface TestServiceOfferProps {
  mechanicId: string
  serviceRequests: ServiceRequestWithClient[]
}

export function TestServiceOffer({ mechanicId, serviceRequests }: TestServiceOfferProps) {
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestWithClient | null>(null)
  const [price, setPrice] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !price) return

    try {
      setIsLoading(true)
      const result = await createServiceOfferAction({
        mechanicId,
        serviceRequestId: selectedRequest.id,
        price: parseFloat(price),
        note: note || undefined,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      alert('Offer created successfully!')
      // Reset form
      setSelectedRequest(null)
      setPrice('')
      setNote('')
    } catch (error) {
      console.error('Error creating offer:', error)
      alert(error instanceof Error ? error.message : 'Failed to create offer')
    } finally {
      setIsLoading(false)
    }
  }

  if (serviceRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No service requests available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create Test Service Offer</CardTitle>
            <CardDescription>Select a service request and make an offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Service Request</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedRequest?.id || ''}
                onChange={(e) => {
                  const request = serviceRequests.find(r => r.id === e.target.value)
                  setSelectedRequest(request || null)
                }}
              >
                <option value="">Select a request...</option>
                {serviceRequests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.client.firstName} {request.client.lastName} - {request.serviceType} - {new Date(request.createdAt).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedRequest && (
              <>
                <div className="space-y-2">
                  <Label>Offer Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Note (Optional)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add any details about your offer..."
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!selectedRequest || !price || isLoading}>
              {isLoading ? 'Creating Offer...' : 'Create Offer'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {selectedRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Client:</strong> {selectedRequest.client.firstName} {selectedRequest.client.lastName}</p>
              <p><strong>Service Type:</strong> {selectedRequest.serviceType}</p>
              <p><strong>Created:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              <p><strong>Location:</strong> Lat: {(selectedRequest.location as any).latitude}, Long: {(selectedRequest.location as any).longitude}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
