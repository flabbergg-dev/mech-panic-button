"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { MECHANIC_ROUTES } from "@/lib/routes/mechanic.routes"

export const useMechanicNavigation = () => {
  const router = useRouter()
  const { user } = useUser()
  const userId = user?.id || ""

  return {
    goToDashboard: () => router.push(MECHANIC_ROUTES.DASHBOARD),
    goToServiceRequest: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.SERVICE_REQUEST(userId, serviceRequestId)),
    goToBookingRequest: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.BOOKING_REQUEST(userId, serviceRequestId)),
    goToRoadAssistance: () =>
      router.push(MECHANIC_ROUTES.ROAD_ASSISTANCE(userId)),
    goToStartDrive: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.START_DRIVE(userId, serviceRequestId)),
    goToInTransit: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.IN_TRANSIT(userId, serviceRequestId)),
    goToPinConfirmation: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.PIN_CONFIRMATION(userId, serviceRequestId)),
    goToDestinationArrived: (serviceRequestId: string) =>
      router.push(
        MECHANIC_ROUTES.DESTINATION_ARRIVED(userId, serviceRequestId)
      ),
    goToEndService: (serviceRequestId: string) =>
      router.push(MECHANIC_ROUTES.END_SERVICE(userId, serviceRequestId)),
    goToProfile: () => router.push(MECHANIC_ROUTES.PROFILE(userId)),
    goToSettings: () => router.push(MECHANIC_ROUTES.SETTINGS(userId)),
    goToServiceHistory: () =>
      router.push(MECHANIC_ROUTES.SERVICE_HISTORY(userId)),
    goBack: () => router.back(),
  }
}
