export const MECHANIC_ROUTES = {
  // Main Dashboard
  DASHBOARD: "/dashboard/",

  // Service Flow
  SERVICE_REQUEST: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/service-request/${id}`,
  BOOKING_REQUEST: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/booking-request/${id}`,
  ROAD_ASSISTANCE: (userId: string) =>
    `/dashboard/mechanic/${userId}/road-assistance`,
  MAP: (userId: string) => `/dashboard/mechanic/${userId}/map`,
  START_DRIVE: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/start-drive/${id}`,
  IN_TRANSIT: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/in-transit/${id}`,
  PIN_CONFIRMATION: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/pin-confirmation/${id}`,
  DESTINATION_ARRIVED: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/destination-arrived/${id}`,
  END_SERVICE: (userId: string, id: string) =>
    `/dashboard/mechanic/${userId}/end-service/${id}`,

  // Additional Routes
  SERVICE_HISTORY: (userId: string) => `/dashboard/mechanic/${userId}/history`,
  PROFILE: (userId: string) => `/dashboard/mechanic/${userId}/profile`,
  SETTINGS: (userId: string) => `/dashboard/mechanic/${userId}/settings`,
} as const

// Type safety for routes
export type MechanicRoutes =
  (typeof MECHANIC_ROUTES)[keyof typeof MECHANIC_ROUTES]
