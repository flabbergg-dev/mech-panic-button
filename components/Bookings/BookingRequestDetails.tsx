"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader } from '@/components/loader'
import { useMechanicNavigation } from '@/hooks/useMechanicNavigation.navigator'
import { getBookingRequestsAction } from '@/app/actions/booking/request/getBookingRequestsAction'
import { Booking, BookingStatus } from '@prisma/client'
import { cancelBookingRequestAction } from '@/app/actions/booking/request/cancelBookingRequest'
import { updateBookingRequestAction } from '@/app/actions/booking/request/updateBookingRequest'

export const BookingRequestDetails = () => {
  const params = useParams()
  const userId = params.userId as string
  const { goToBookingRequest } = useMechanicNavigation()
  const [loading, setLoading] = useState(true)
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([])
  const [formData, setFormData] = useState({
    scheduledStart: '',
    totalPrice: 0
  })

  // Fetch active booking requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Replace with actual data fetching logic
        const response = await getBookingRequestsAction()
        setBookingRequests(response || [])
      } catch (error) {
        console.error('Failed to fetch booking requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [userId])

  if (loading) {
    return <Loader />
  }

  const handleCancel = async () => {
    await cancelBookingRequestAction(bookingRequests[0].id)
  }

  const handleSubmit = async () => {
    await updateBookingRequestAction(bookingRequests[0].id, {
      status: BookingStatus.CANCELLED
    })
  }
  return (
    <div className="p-6 max-w-3xl mx-auto bg-background rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold mb-6">Booking Request Details</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduledStart" className="block text-sm font-medium mb-1">Scheduled Start</label>
            <input 
              type="datetime-local" 
              id="scheduledStart" 
              className="w-full p-2 border rounded-md"
              onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
              defaultValue={bookingRequests[0].scheduledStart.toISOString().split('T')[0]} 
            />
          </div>

          <div>
            <label htmlFor="service" className="block text-sm font-medium mb-1">Service Type:</label>
            <input 
              type="text" 
              id="service" 
              className="w-full p-2 border rounded-md"
              disabled
              defaultValue={bookingRequests[0].serviceType || ''} 
            />
          </div>

          <div>
            <label htmlFor="totalPrice" className="block text-sm font-medium mb-1">Total Price ($)</label>
            <input 
              type="number" 
              id="totalPrice" 
              className="w-full p-2 border rounded-md"
              onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
              defaultValue={bookingRequests[0].totalPrice} 
            />
          </div>

        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>Created: {bookingRequests[0].createdAt.toLocaleString()}</div>
          <div>Updated: {bookingRequests[0].updatedAt.toLocaleString()}</div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            onClick={handleCancel}
            className="px-4 py-2 border border-secondary rounded-md hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
          >
            Submit to Client
          </button>
        </div>
      </div>
    </div>
  )
}
