import { type Metadata } from "next"
import CustomerDashboard from "./CustomerDashboard"

export const metadata: Metadata = {
  title: "Customer Dashboard - Mech Panic",
  description: "Manage your service requests and view your history",
}

interface Props {
  params: { userId: string }
}

export default function Page({ params }: Props) {
  return <CustomerDashboard />
}
