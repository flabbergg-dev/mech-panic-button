import { type Metadata } from "next"
import MechanicDashboard from "./MechanicDashboard"

export const metadata: Metadata = {
  title: "Mechanic Dashboard - Mech Panic",
  description: "Manage service requests and your availability",
}

export default function Page() {
  return <MechanicDashboard />
}
