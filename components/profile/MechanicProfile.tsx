"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshIcon } from "@/components/icons/refresh"
import { formatDistanceToNow } from "date-fns"
import { DateTimePicker } from "../forms/dateTimePicker"

interface MechanicProfileProps {
  mechanicData: any;
  bookings: any[];
}

export const MechanicProfile = ({ mechanicData, bookings = [] }: MechanicProfileProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(false)

  // Get bookings for the selected date
  const filteredBookings = date 
    ? bookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentTime);
        return bookingDate.toDateString() === date.toDateString();
      })
    : [];

  // Get all future bookings
  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.appointmentTime);
    return bookingDate > new Date();
  }).sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary to-primary/70 rounded-2xl p-6 mb-8 text-white">
        <div className="flex gap-4 items-center mb-4">
          <Avatar className="h-20 w-20 border-4 border-white">
            <AvatarImage src={mechanicData?.user?.profileImage} />
            <AvatarFallback>{mechanicData?.user?.firstName?.[0] || "N/A"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {mechanicData?.user?.firstName} {mechanicData?.user?.lastName}
            </h1>
            <p className="opacity-80">{mechanicData?.bio || "Professional Mechanic"}</p>
            <div className="flex items-center mt-1">
              <span className="text-yellow-300 mr-1">★</span>
              <span>{mechanicData?.rating || "New"}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm opacity-70">Status</p>
            <p className="font-semibold flex items-center">
              {mechanicData?.isAvailable ? (
                <Badge className="bg-green-500">Available</Badge>
              ) : (
                <Badge className="bg-red-500">Unavailable</Badge>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-70">Services</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {mechanicData?.servicesOffered?.map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm opacity-70">Member Since</p>
            <p className="font-semibold">
              {mechanicData?.createdAt 
                ? formatDistanceToNow(new Date(mechanicData.createdAt), { addSuffix: true })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Availability Calendar</CardTitle>
            <CardDescription>Select a date to view bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <DateTimePicker
              value={date || new Date()}
              onChange={(date) => {
                if (date) {
                  setDate(date)
                }
              }}
            />
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Bookings on {date?.toLocaleDateString()}</h3>
              {filteredBookings.length > 0 ? (
                <div className="space-y-2">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-2 bg-muted rounded-md">
                      <p className="font-medium">{new Date(booking.appointmentTime).toLocaleTimeString()}</p>
                      <p className="text-sm">{booking.customer?.firstName} {booking.customer?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{booking.serviceType}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings for this date</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled service requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col place-items-center gap-4 pt-10">
                <Image src="/images/car.svg" alt="car" width={100} height={100} />
                <p className="text-center">Loading your appointments...</p>
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(booking.appointmentTime).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(booking.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      </div>
                      <h3 className="font-medium mt-2">{booking.serviceType}</h3>
                      <div className="mt-1 text-sm">
                        <p>Customer: {booking.customer?.firstName} {booking.customer?.lastName}</p>
                        {booking.customer?.phoneNumber && (
                          <p>Phone: {booking.customer.phoneNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Booked {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col place-items-center gap-4 pt-10">
                <p className="text-center">
                  You currently have no upcoming appointments.
                </p>
                <Button onClick={() => setLoading(!loading)}>
                  <RefreshIcon />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
