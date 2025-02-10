import { type Metadata } from "next"
import { Suspense } from "react"
import { MechanicDashboard } from "./MechanicDashboard"

export const metadata: Metadata = {
  title: "Mechanic Dashboard - Mech Panic",
  description: "Manage service requests and your availability",
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <MechanicDashboard />
    </Suspense>
  )
}
