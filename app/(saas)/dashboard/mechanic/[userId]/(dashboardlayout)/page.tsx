import type{  Metadata } from "next"
import { Suspense } from "react"
import { MechanicDashboard } from "./MechanicDashboard"
import { Navbar } from "@/components/navigation/mechanic-navbar.navigation"
import { Loader } from "@/components/loader"

export const metadata: Metadata = {
  title: "Mechanic Dashboard - Mech Panic",
  description: "Manage service requests and your availability",
}

export default function Page() {
  return (
    <Suspense fallback={<Loader title="Loading Your Dashboard..." />}>
      <Navbar />
      <MechanicDashboard />
    </Suspense>
  )
}
