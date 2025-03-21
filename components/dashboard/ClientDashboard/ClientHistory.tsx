import Booking from '@/components/Bookings/Booking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

export const ClientHistory = () => {
  return (
    <div className="p-4 space-y-4 mt-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-michroma-sans flex flex-col gap-4">
            <h1>Booking</h1>
            <p className="text-sm">Here you can book and manage your appointments scheduled with mechanics</p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Booking />
        </CardContent>
      </Card>
    </div>
  )
}
