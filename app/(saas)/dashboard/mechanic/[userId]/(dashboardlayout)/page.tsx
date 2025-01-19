import { type Metadata } from "next"
import MechanicDashboard from "./MechanicDashboard"

export const metadata: Metadata = {
  title: "Mechanic Dashboard - Mech Panic",
  description: "Manage service requests and your availability",
}

interface Props {
  params: { userId: string }
}

export default function Page({ params }: Props) {
  return <MechanicDashboard />
}
