"use client"

import { useEffect, useState } from "react"
import { useUserRole } from "@/hooks/use-user-role"
import { MechanicProfile } from "./MechanicProfile"
import { getBookingRequestsAction } from "@/app/actions/booking/request/getBookingRequestsAction"
import { Loader } from "@/components/loader"
import { getMechanicAction } from "@/app/actions/mechanic/getMechanicAction"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export const Profile = () => {
  const pathname = usePathname()
  const userId = pathname.split("/").pop() || ""
  const { userRole } = useUserRole()
  const [mechanicData, setMechanicData] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchMechanicData = async () => {
      try {
        setLoading(true)
        // Get mechanic profile data
        const mechanicResult = await getMechanicAction(userId)
        if (mechanicResult.mechanic) {
          setMechanicData(mechanicResult.mechanic)
          console.log(mechanicData, "mechanicData")
          
          // Get mechanic bookings
          const bookingsResult = await getBookingRequestsAction()
          if (bookingsResult) {
            setBookings(bookingsResult)
          }
        } else if (mechanicResult.error) {
          setError(mechanicResult.error)
        }
      } catch (err) {
        console.error("Error fetching mechanic data:", err)
        setError("Failed to load mechanic profile")
      } finally {
        setLoading(false)
      }
    }
    fetchMechanicData()
  }, [userRole])

  if (loading) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen mt-16 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Button onClick={() => window.history.back()}>Back</Button>
      <MechanicProfile mechanicData={mechanicData} bookings={bookings} />
    </div>
  )
}
